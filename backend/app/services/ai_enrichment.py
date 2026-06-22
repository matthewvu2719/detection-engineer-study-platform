import json
import re
from datetime import datetime, timezone

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
from sqlalchemy import select

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.use_case import UseCase, InvestigationStep, InvestigationQuery
from app.services.mcp_client import ms_learn_tools
from app.core.prompts import ENRICHMENT_AGENT_SYSTEM, ENRICHMENT_AGENT_HUMAN

settings = get_settings()


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openai_model,
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
            uc.enrichment_status = "failed"
            uc.enrichment_error = str(exc)[:500]

        await db.commit()


async def _run_enrichment_agent(uc: UseCase) -> dict:
    """
    LangGraph ReAct agent that:
    1. Reads the KQL rule and identifies tables + operators
    2. Uses microsoft_docs_search / microsoft_docs_fetch MCP tools to retrieve
       official Microsoft Learn documentation for each
    3. Produces a structured JSON enrichment grounded in real docs
    """
    llm = _get_llm()

    human_message = ENRICHMENT_AGENT_HUMAN.format(
        alert_name=uc.alert_name,
        alert_description=uc.alert_description or "Not provided",
        analytics_rule_name=uc.analytics_rule_name or "Not provided",
        kql=uc.analytics_rule_kql,
        investigation_notes=uc.investigation_notes or "Not provided",
        response_notes=uc.response_notes or "Not provided",
    )

    async with ms_learn_tools() as tools:
        agent = create_react_agent(
            llm,
            tools,
            state_modifier=SystemMessage(content=ENRICHMENT_AGENT_SYSTEM),
        )

        result = await agent.ainvoke({
            "messages": [HumanMessage(content=human_message)]
        })

    final_message = result["messages"][-1].content
    return _extract_json(final_message)


async def _apply_enrichment(db, uc: UseCase, data: dict) -> None:
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
    """Extract JSON object from agent's final message."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Extract from markdown code block
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return json.loads(match.group(1))

    # Find the first { ... } block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group(0))

    raise ValueError(f"Could not extract JSON from agent response: {text[:300]}")
