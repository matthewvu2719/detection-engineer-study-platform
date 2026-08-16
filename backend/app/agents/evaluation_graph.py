import json
import re
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import create_react_agent
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.state import EvaluationState
from app.config import get_settings
from app.core.prompts import EVALUATOR_AGENT_HUMAN, EVALUATOR_AGENT_SYSTEM
from app.models.practice import Evaluation, PracticeChallenge, PracticeSession
from app.services.learning_memory import store_learning_memory
from app.services.mcp_client import get_ms_learn_tools

settings = get_settings()


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


async def run_evaluation_graph(
    db: AsyncSession,
    challenge_id: UUID,
    submitted_kql: str,
    user_id: Optional[UUID] = None,
    started_at: Optional[datetime] = None,
) -> tuple[PracticeSession, Evaluation]:
    # ── pre-graph: load challenge (plain DB read) ─────────────────────────
    result = await db.execute(
        select(PracticeChallenge).where(PracticeChallenge.id == challenge_id)
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise ValueError(f"Challenge {challenge_id} not found")

    challenge_dict = {
        "id": str(challenge.id),
        "scenario": challenge.scenario,
        "objectives": challenge.objectives or [],
        "available_tables": challenge.available_tables or [],
        "expected_entities": challenge.expected_entities or [],
        "reference_kql": challenge.reference_kql or "",
        "difficulty": challenge.difficulty,
    }

    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.1,
    )

    # ── side-channel for ORM objects ──────────────────────────────────────
    _result: dict = {}

    # ── node 1: KQL evaluator — the real ReAct agent ─────────────────────
    tools = await get_ms_learn_tools()
    evaluator_agent = create_react_agent(
        llm, tools, prompt=SystemMessage(content=EVALUATOR_AGENT_SYSTEM)
    )

    async def kql_evaluator_node(state: EvaluationState) -> dict:
        ch = state["challenge"]
        human_msg = EVALUATOR_AGENT_HUMAN.format(
            scenario=ch["scenario"],
            objectives="\n".join(f"- {o}" for o in ch.get("objectives", [])),
            available_tables=", ".join(ch.get("available_tables", [])),
            expected_entities="\n".join(f"- {e}" for e in ch.get("expected_entities", [])),
            reference_kql=ch.get("reference_kql", ""),
            submitted_kql=state["submitted_kql"],
        )
        agent_result = await evaluator_agent.ainvoke(
            {"messages": [HumanMessage(content=human_msg)]},
            config={"recursion_limit": 12},
        )
        evaluation_data = _extract_json(agent_result["messages"][-1].content)

        # Persist session and evaluation records
        session = PracticeSession(
            user_id=UUID(state["user_id"]) if state.get("user_id") else None,
            challenge_id=challenge_id,
            difficulty=ch["difficulty"],
            submitted_kql=state["submitted_kql"],
            started_at=state.get("started_at") or datetime.now(timezone.utc),
            submitted_at=datetime.now(timezone.utc),
        )
        db.add(session)
        await db.flush()

        evaluation = Evaluation(
            session_id=session.id,
            user_id=UUID(state["user_id"]) if state.get("user_id") else None,
            overall_score=evaluation_data["overall_score"],
            detection_logic_score=evaluation_data.get("detection_logic_score"),
            query_structure_score=evaluation_data.get("query_structure_score"),
            entity_mapping_score=evaluation_data.get("entity_mapping_score"),
            time_window_score=evaluation_data.get("time_window_score"),
            performance_score=evaluation_data.get("performance_score"),
            strengths=evaluation_data.get("strengths", []),
            weaknesses=evaluation_data.get("weaknesses", []),
            missing_logic=evaluation_data.get("missing_logic", []),
            suggested_improvements=evaluation_data.get("suggested_improvements", []),
            reference_solution=evaluation_data.get("reference_solution"),
            recommended_concepts=evaluation_data.get("recommended_concepts", []),
            learn_modules=evaluation_data.get("learn_modules", []),
            learning_summary=evaluation_data.get("learning_summary", ""),
        )
        db.add(evaluation)
        await db.commit()
        await db.refresh(session)
        await db.refresh(evaluation)

        _result["session"] = session
        _result["evaluation"] = evaluation

        return {
            "session_id": str(session.id),
            "evaluation_id": str(evaluation.id),
            "evaluation_data": evaluation_data,
        }

    # ── node 2: memory writer — stores embedding to pgvector ─────────────
    async def memory_writer_node(state: EvaluationState) -> dict:
        if not state.get("user_id"):
            return {}
        session = _result.get("session")
        evaluation = _result.get("evaluation")
        if session and evaluation:
            await store_learning_memory(
                db, UUID(state["user_id"]), session, evaluation
            )
        return {}

    # ── build and compile the graph ───────────────────────────────────────
    builder = StateGraph(EvaluationState)
    builder.add_node("kql_evaluator", kql_evaluator_node)
    builder.add_node("memory_writer", memory_writer_node)

    builder.set_entry_point("kql_evaluator")
    builder.add_edge("kql_evaluator", "memory_writer")
    builder.add_edge("memory_writer", END)

    graph = builder.compile()

    await graph.ainvoke({
        "challenge": challenge_dict,
        "submitted_kql": submitted_kql,
        "user_id": str(user_id) if user_id else None,
        "started_at": started_at,
        "session_id": None,
        "evaluation_id": None,
        "evaluation_data": None,
    })

    return _result["session"], _result["evaluation"]
