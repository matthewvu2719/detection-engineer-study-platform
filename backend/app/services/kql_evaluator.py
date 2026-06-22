import json
import re
from datetime import datetime, timezone
from uuid import UUID

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.practice import PracticeChallenge, PracticeSession, Evaluation
from app.services.mcp_client import ms_learn_tools
from app.services.learning_memory import store_learning_memory
from app.core.prompts import EVALUATOR_AGENT_SYSTEM, EVALUATOR_AGENT_HUMAN

settings = get_settings()


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.1,
    )


async def evaluate_submission(
    db: AsyncSession,
    challenge_id: UUID,
    submitted_kql: str,
    user_id: UUID | None = None,
    started_at: datetime | None = None,
) -> tuple[PracticeSession, Evaluation]:
    result = await db.execute(
        select(PracticeChallenge).where(PracticeChallenge.id == challenge_id)
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise ValueError(f"Challenge {challenge_id} not found")

    # Persist the session first
    session = PracticeSession(
        user_id=user_id,
        challenge_id=challenge_id,
        difficulty=challenge.difficulty,
        submitted_kql=submitted_kql,
        started_at=started_at or datetime.now(timezone.utc),
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.flush()

    # Run the LangGraph evaluator agent with MCP tools
    evaluation_data = await _run_evaluator_agent(challenge, submitted_kql)

    evaluation = Evaluation(
        session_id=session.id,
        user_id=user_id,
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

    # Automatically store result in pgvector for future RAG
    if user_id:
        await store_learning_memory(
            db=db,
            user_id=user_id,
            session=session,
            evaluation=evaluation,
        )

    return session, evaluation


async def _run_evaluator_agent(
    challenge: PracticeChallenge,
    submitted_kql: str,
) -> dict:
    """
    LangGraph ReAct agent that:
    1. Evaluates the submitted KQL against the challenge
    2. Identifies concepts the student missed or got wrong
    3. Uses microsoft_docs_search to find real Microsoft Learn modules
       for the weak concepts
    4. Returns a structured evaluation with real learn URLs
    """
    llm = _get_llm()

    human_message = EVALUATOR_AGENT_HUMAN.format(
        scenario=challenge.scenario,
        objectives="\n".join(f"- {o}" for o in (challenge.objectives or [])),
        available_tables=", ".join(challenge.available_tables or []),
        expected_entities="\n".join(f"- {e}" for e in (challenge.expected_entities or [])),
        reference_kql=challenge.reference_kql,
        submitted_kql=submitted_kql,
    )

    async with ms_learn_tools() as tools:
        agent = create_react_agent(
            llm,
            tools,
            state_modifier=SystemMessage(content=EVALUATOR_AGENT_SYSTEM),
        )

        result = await agent.ainvoke({
            "messages": [HumanMessage(content=human_message)]
        })

    final_message = result["messages"][-1].content
    return _extract_json(final_message)


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
