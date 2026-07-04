import asyncio
import json
import logging
import re
from datetime import datetime, timezone

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
from sqlalchemy import select

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.use_case import UseCase, InvestigationStep, InvestigationQuery
from app.services.mcp_client import get_ms_learn_tools
from app.core.prompts import ENRICHMENT_AGENT_SYSTEM, ENRICHMENT_AGENT_HUMAN

logger = logging.getLogger(__name__)
settings = get_settings()

MCP_TIMEOUT = 90  # seconds before falling back to LLM-only enrichment


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openai_enrichment_model,
        api_key=settings.openai_api_key,
        temperature=0.2,
    )


async def enrich_use_case(use_case_id: str) -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(UseCase).where(UseCase.id == use_case_id))
        uc = result.scalar_one_or_none()
        if not uc:
            return

        uc.enrichment_status = "processing"
        await db.commit()

        try:
            enrichment = await _run_enrichment_agent(uc)
            await _apply_enrichment(db, uc, enrichment)
            uc.enrichment_status = "completed"
            uc.enriched_at = datetime.now(timezone.utc)
        except Exception as exc:
            logger.exception("Enrichment failed for use_case_id=%s", use_case_id)
            uc.enrichment_status = "failed"
            uc.enrichment_error = str(exc)[:500]

        await db.commit()


async def _run_enrichment_agent(uc: UseCase) -> dict:
    llm = _get_llm()

    notes = uc.investigation_notes or "Not provided"
    human_message = ENRICHMENT_AGENT_HUMAN.format(
        alert_name=uc.alert_name,
        kql=uc.analytics_rule_kql or "Not provided — infer from context.",
        investigation_notes=notes[:3000] + ("…[truncated]" if len(notes) > 3000 else ""),
        response_notes=(uc.response_notes or "Not provided")[:1000],
    )

    # Try MCP-grounded enrichment first; fall back to LLM-only if it times out
    try:
        tools = await asyncio.wait_for(get_ms_learn_tools(), timeout=15)
        agent = create_react_agent(
            llm,
            tools,
            prompt=SystemMessage(content=ENRICHMENT_AGENT_SYSTEM),
        )
        result = await asyncio.wait_for(
            agent.ainvoke(
                {"messages": [HumanMessage(content=human_message)]},
                config={"recursion_limit": 16},
            ),
            timeout=MCP_TIMEOUT,
        )
        logger.info("Enrichment completed with MCP for use_case_id=%s", uc.id)
    except (asyncio.TimeoutError, Exception) as exc:
        logger.warning("MCP enrichment timed out or failed (%s), falling back to LLM-only", exc)
        result = await _run_llm_only(llm, human_message)

    final_message = result["messages"][-1].content
    return _extract_json(final_message)


async def _run_llm_only(llm: ChatOpenAI, human_message: str) -> dict:
    """Fallback: plain LLM call with no MCP tools — always fast."""
    messages = [
        SystemMessage(content=ENRICHMENT_AGENT_SYSTEM),
        HumanMessage(content=human_message),
    ]
    response = await llm.ainvoke(messages)
    return {"messages": [response]}


async def _apply_enrichment(db, uc: UseCase, data: dict) -> None:
    if not uc.analytics_rule_kql and data.get("suggested_kql"):
        uc.analytics_rule_kql = data["suggested_kql"]

    uc.detection_purpose = data.get("detection_purpose")
    uc.detection_logic = data.get("detection_logic")
    uc.typical_attack_scenarios = data.get("typical_attack_scenarios")
    uc.kql_explanation = data.get("kql_explanation")
    uc.tables_used = data.get("tables_used", [])
    uc.important_columns = data.get("important_columns", [])
    uc.entity_mapping = data.get("entity_mapping", [])
    uc.benign_indicators = data.get("benign_indicators", [])
    uc.malicious_indicators = data.get("malicious_indicators", [])
    uc.classification_guidance = data.get("classification_guidance")
    uc.rule_tuning_suggestions = data.get("rule_tuning_suggestions", [])
    uc.kql_operators_to_study = data.get("kql_operators_to_study", [])
    uc.related_concepts = data.get("related_concepts", [])
    uc.learn_recommendations = data.get("learn_modules", [])

    if not uc.category and data.get("category"):
        uc.category = data["category"]
    if not uc.difficulty and data.get("difficulty"):
        uc.difficulty = data["difficulty"]

    for i, step in enumerate(data.get("investigation_steps", [])):
        db.add(InvestigationStep(
            use_case_id=uc.id,
            step_order=i + 1,
            title=step.get("title", ""),
            description=step.get("description"),
            pivot_type=step.get("pivot_type"),
        ))

    for i, query in enumerate(data.get("investigation_queries", [])):
        db.add(InvestigationQuery(
            use_case_id=uc.id,
            title=query.get("title", ""),
            description=query.get("description"),
            kql=query.get("kql", ""),
            query_order=i,
        ))


def _extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group(0))

    raise ValueError(f"Could not extract JSON from agent response: {text[:300]}")
