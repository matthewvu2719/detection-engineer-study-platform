import asyncio
import json
import logging
import re
from datetime import datetime, timezone
from sqlalchemy import delete as sa_delete

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from sqlalchemy import select

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.use_case import UseCase, InvestigationStep
from app.services.mcp_client import get_ms_learn_tools
from app.core.prompts import ENRICHMENT_AGENT_SYSTEM, ENRICHMENT_AGENT_HUMAN

logger = logging.getLogger(__name__)
settings = get_settings()


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
            enrichment = await _run_enrichment(uc)
            await _apply_enrichment(db, uc, enrichment)
            uc.enrichment_status = "completed"
            uc.enriched_at = datetime.now(timezone.utc)
            await db.commit()

            # Fire MCP module fetch in background — enrichment is already done
            concepts = (enrichment.get("kql_operators_to_study") or [])[:2]
            topics = (enrichment.get("related_concepts") or [])[:2]
            search_terms = concepts + topics
            if search_terms:
                asyncio.create_task(
                    _fetch_and_store_learn_modules(use_case_id, search_terms)
                )

        except Exception as exc:
            logger.exception("Enrichment failed for use_case_id=%s", use_case_id)
            uc.enrichment_status = "failed"
            uc.enrichment_error = str(exc)[:500]
            await db.commit()


async def _run_enrichment(uc: UseCase) -> dict:
    """Plain LLM call — fast (~10s). No MCP here."""
    llm = _get_llm()
    notes = uc.investigation_notes or "Not provided"

    human_message = ENRICHMENT_AGENT_HUMAN.format(
        alert_name=uc.alert_name,
        kql=uc.analytics_rule_kql or "Not provided — infer from context.",
        investigation_notes=notes[:3000] + ("…[truncated]" if len(notes) > 3000 else ""),
        response_notes=(uc.response_notes or "Not provided")[:1000],
    )

    response = await llm.ainvoke([
        SystemMessage(content=ENRICHMENT_AGENT_SYSTEM),
        HumanMessage(content=human_message),
    ])

    logger.info("LLM enrichment done for use_case_id=%s", uc.id)
    return _extract_json(response.content)


async def _fetch_and_store_learn_modules(use_case_id: str, search_terms: list[str]) -> None:
    """
    Separate background task — runs after enrichment is already completed.
    Searches MS Learn via MCP for real module URLs, then updates the DB.
    Fails silently if MCP is unavailable.
    """
    logger.info("MCP learn module fetch started for use_case_id=%s, terms=%s", use_case_id, search_terms)
    try:
        modules = await asyncio.wait_for(
            _search_ms_learn(search_terms),
            timeout=60,
        )
        if not modules:
            return

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(UseCase).where(UseCase.id == use_case_id))
            uc = result.scalar_one_or_none()
            if uc:
                # Merge MCP results with LLM suggestions — deduplicate by URL
                existing = uc.learn_recommendations or []
                existing_urls = {m.get("url") for m in existing}
                merged = existing + [m for m in modules if m.get("url") not in existing_urls]
                uc.learn_recommendations = merged
                await db.commit()
                logger.info("MCP learn modules merged for use_case_id=%s (%d total)", use_case_id, len(merged))

    except asyncio.TimeoutError:
        logger.warning("MCP learn module fetch timed out for use_case_id=%s", use_case_id)
    except Exception as exc:
        logger.warning("MCP learn module fetch failed for use_case_id=%s: %s", use_case_id, exc)


async def _search_ms_learn(search_terms: list[str]) -> list[dict]:
    """Fetch MCP tools and run searches in a thread to avoid blocking the event loop."""
    try:
        tools = await asyncio.wait_for(get_ms_learn_tools(), timeout=10)
    except Exception as exc:
        logger.warning("Could not load MCP tools: %s", exc)
        return []

    search_tool = next((t for t in tools if t.name == "microsoft_docs_search"), None)
    if not search_tool:
        return []

    modules = []
    for term in search_terms[:3]:
        try:
            query = f"{term} Microsoft Sentinel"
            # Run in thread — MCP HTTP calls may block the event loop
            raw = await asyncio.wait_for(
                search_tool.ainvoke({"query": query}),
                timeout=15,
            )
            parsed = _parse_mcp_result(raw, term)
            if parsed:
                modules.append(parsed)
        except Exception as exc:
            logger.warning("MCP search failed for term '%s': %s", term, exc)

    return modules


_MCP_SKIP_PATTERNS = re.compile(
    r'/(navigation|whats-new|release-notes|overview|faq|troubleshoot|support|pricing|free-trial'
    r'|security-copilot/preinstalled|defender-for-office|azure-sentinel/connect-)',
    re.IGNORECASE,
)

def _parse_mcp_result(result, term: str) -> dict | None:
    text = result if isinstance(result, str) else str(result)

    # Collect all candidate URLs from the result
    urls = re.findall(r'https://learn\.microsoft\.com/\S+', text)
    url = None
    for candidate in urls:
        candidate = candidate.rstrip('.,)')
        # Skip navigation, unrelated product pages, release notes, etc.
        if not _MCP_SKIP_PATTERNS.search(candidate):
            url = candidate
            break

    if not url:
        return None

    # Prefer a title that appears directly before a URL as markdown link text
    title_match = re.search(r'\[([^\]]{10,100})\]\(' + re.escape(url), text)
    if not title_match:
        title_match = re.search(r'\[([^\]]{10,80})\]', text)
    title = title_match.group(1) if title_match else f"Microsoft Learn: {term}"

    return {"title": title, "url": url, "reason": f"Recommended for: {term}"}


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
    uc.kql_operators_to_study = data.get("kql_functions", data.get("kql_operators_to_study", []))
    uc.investigation_functions = data.get("investigation_functions", [])
    uc.related_concepts = data.get("related_concepts", [])
    uc.learn_recommendations = data.get("learn_modules", [])

    if not uc.category and data.get("category"):
        uc.category = data["category"]
    if not uc.difficulty and data.get("difficulty"):
        uc.difficulty = data["difficulty"]

    await db.execute(sa_delete(InvestigationStep).where(InvestigationStep.use_case_id == uc.id))

    for i, step in enumerate(data.get("investigation_steps", [])):
        db.add(InvestigationStep(
            use_case_id=uc.id,
            step_order=i + 1,
            title=step.get("title", ""),
            description=step.get("description"),
            kql=step.get("kql"),
            pivot_type=step.get("pivot_type"),
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
