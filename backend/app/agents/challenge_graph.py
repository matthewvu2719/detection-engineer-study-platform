import json
import random
import re
from typing import Optional
from uuid import UUID

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.state import ChallengeState
from app.config import get_settings
from app.core.prompts import (
    CHALLENGE_AGENT_HUMAN,
    CHALLENGE_AGENT_SYSTEM,
    WEAKNESS_ANALYSIS_HUMAN,
    WEAKNESS_ANALYSIS_SYSTEM,
)
from app.models.practice import PracticeChallenge
from app.models.use_case import UseCase
from app.services.challenge_generator import ATTACK_DOMAINS
from app.services.learning_memory import retrieve_relevant_memories

settings = get_settings()

_DEFAULT_PROFILE = {
    "has_history": False,
    "weak_concepts": [],
    "strong_concepts": [],
    "coaching_notes": "No prior history — generate a well-rounded challenge.",
}


def _extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return _DEFAULT_PROFILE


async def run_challenge_graph(
    db: AsyncSession,
    difficulty: str,
    source_use_case_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None,
) -> PracticeChallenge:
    # ── pre-graph: load use-case context (plain DB read, not agent work) ──
    use_case_context = ""
    source_type = "synthetic"
    if source_use_case_id:
        result = await db.execute(select(UseCase).where(UseCase.id == source_use_case_id))
        uc = result.scalar_one_or_none()
        if uc:
            use_case_context = (
                f"Base this challenge on the following detection use case:\n"
                f"Title: {uc.title}\n"
                f"Detection Purpose: {uc.detection_purpose or uc.alert_description or ''}\n"
                f"Tables Used: {', '.join(uc.tables_used or [])}\n"
                f"KQL Reference (do not copy directly — create a practice scenario):\n"
                f"{uc.analytics_rule_kql}"
            )
            source_type = "use_case"

    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.1,
    )

    # ── side-channel for ORM object (can't serialise through TypedDict) ───
    _result: dict = {}

    # ── node 1: RAG retriever — direct pgvector call + plain LLM synthesis ─
    weakness_llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.1,
        response_format={"type": "json_object"},
    )

    async def rag_retriever_node(state: ChallengeState) -> dict:
        if not user_id:
            return {"weakness_profile": _DEFAULT_PROFILE}

        memories = await retrieve_relevant_memories(
            db, user_id,
            query=f"KQL detection practice {state['difficulty']}",
            top_k=8,
        )
        if not memories:
            return {"weakness_profile": _DEFAULT_PROFILE}

        summaries = "\n\n".join(
            f"[Session {i + 1}] Score: {m.overall_score}/100 | Difficulty: {m.difficulty}\n"
            f"Weak concepts: {', '.join(m.weak_concepts or []) or 'none'}\n"
            f"Summary: {m.learning_summary}"
            for i, m in enumerate(memories)
        )
        response = await weakness_llm.ainvoke([
            SystemMessage(content=WEAKNESS_ANALYSIS_SYSTEM),
            HumanMessage(content=WEAKNESS_ANALYSIS_HUMAN.format(summaries=summaries)),
        ])
        profile = json.loads(response.content)
        profile.setdefault("has_history", True)
        return {"weakness_profile": profile}

    # ── node 2: challenge generator — plain LLM call as a graph node ──────
    challenge_llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    async def challenge_node(state: ChallengeState) -> dict:
        profile = state["weakness_profile"]
        weak = profile.get("weak_concepts", [])
        strong = profile.get("strong_concepts", [])

        system = CHALLENGE_AGENT_SYSTEM.format(
            weak_concepts=", ".join(weak) if weak else "none identified yet",
            strong_concepts=", ".join(strong) if strong else "none identified yet",
            coaching_notes=profile.get("coaching_notes", _DEFAULT_PROFILE["coaching_notes"]),
            difficulty=state["difficulty"],
        )
        human = CHALLENGE_AGENT_HUMAN.format(
            difficulty=state["difficulty"],
            domain=random.choice(ATTACK_DOMAINS),
            use_case_context=state["use_case_context"] or "Create a synthetic scenario.",
        )
        response = await challenge_llm.ainvoke([
            SystemMessage(content=system),
            HumanMessage(content=human),
        ])
        data = json.loads(response.content)

        challenge = PracticeChallenge(
            source_use_case_id=source_use_case_id,
            source_type=source_type,
            difficulty=state["difficulty"],
            scenario=data.get("scenario", "No scenario provided."),
            objectives=data.get("objectives", []),
            available_tables=data.get("available_tables", []),
            expected_entities=data.get("expected_entities", []),
            hints=data.get("hints", []),
            reference_kql=data.get("reference_kql", "// No reference solution provided"),
            tags=data.get("tags", []),
        )
        db.add(challenge)
        await db.commit()
        await db.refresh(challenge)
        _result["challenge"] = challenge
        return {"challenge_data": data}

    # ── build and compile the graph ───────────────────────────────────────
    builder = StateGraph(ChallengeState)
    builder.add_node("rag_retriever", rag_retriever_node)
    builder.add_node("challenge_generator", challenge_node)

    builder.set_entry_point("rag_retriever")
    builder.add_edge("rag_retriever", "challenge_generator")
    builder.add_edge("challenge_generator", END)

    graph = builder.compile()

    await graph.ainvoke({
        "difficulty": difficulty,
        "source_use_case_id": str(source_use_case_id) if source_use_case_id else None,
        "user_id": str(user_id) if user_id else None,
        "use_case_context": use_case_context,
        "weakness_profile": {},
        "challenge_data": None,
    })

    return _result["challenge"]
