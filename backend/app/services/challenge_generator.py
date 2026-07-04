import json
import random
import re
from uuid import UUID

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.use_case import UseCase
from app.models.practice import PracticeChallenge
from app.services.learning_memory import retrieve_relevant_memories
from app.core.prompts import (
    WEAKNESS_ANALYSIS_SYSTEM,
    WEAKNESS_ANALYSIS_HUMAN,
    CHALLENGE_AGENT_SYSTEM,
    CHALLENGE_AGENT_HUMAN,
)

settings = get_settings()

ATTACK_DOMAINS = [
    "Identity attacks and credential abuse",
    "Lateral movement and privilege escalation",
    "Data exfiltration",
    "Persistence mechanisms",
    "Command and control",
    "Cloud resource abuse",
    "Email-based attacks",
]


def _get_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.7,
        response_format={"type": "json_object"},
    )


async def generate_challenge(
    db: AsyncSession,
    difficulty: str,
    source_use_case_id: UUID | None = None,
    user_id: UUID | None = None,
) -> PracticeChallenge:
    # Step 1: Retrieve user's past practice memories via RAG
    weak_concepts: list[str] = []
    strong_concepts: list[str] = []
    coaching_notes: str = "No prior history — generate a well-rounded challenge."

    if user_id:
        memories = await retrieve_relevant_memories(
            db=db,
            user_id=user_id,
            query=f"KQL detection practice {difficulty}",
            top_k=8,
        )
        if memories:
            # Step 2: LLM analyzes memories to identify weak/strong areas
            profile = await _analyze_weaknesses(memories)
            weak_concepts = profile.get("weak_concepts", [])
            strong_concepts = profile.get("strong_concepts", [])
            coaching_notes = profile.get("coaching_notes", coaching_notes)

    # Step 3: Build use case context if provided
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
                f"KQL Reference (do not copy directly — create a practice scenario):\n{uc.analytics_rule_kql}"
            )
            source_type = "use_case"

    # Step 4: Generate personalized challenge
    data = await _generate_challenge_data(
        difficulty=difficulty,
        weak_concepts=weak_concepts,
        strong_concepts=strong_concepts,
        coaching_notes=coaching_notes,
        use_case_context=use_case_context,
    )

    challenge = PracticeChallenge(
        source_use_case_id=source_use_case_id,
        source_type=source_type,
        difficulty=difficulty,
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
    return challenge


async def _analyze_weaknesses(memories) -> dict:
    """
    LLM reads the user's past learning summaries and returns a structured
    profile of weak/strong KQL concepts to inform challenge personalization.
    """
    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.1,
        response_format={"type": "json_object"},
    )

    summaries = "\n\n".join(
        f"[Session {i+1}] Score: {m.overall_score}/100, Difficulty: {m.difficulty}\n{m.learning_summary}"
        for i, m in enumerate(memories)
    )

    messages = [
        SystemMessage(content=WEAKNESS_ANALYSIS_SYSTEM),
        HumanMessage(content=WEAKNESS_ANALYSIS_HUMAN.format(summaries=summaries)),
    ]

    response = await llm.ainvoke(messages)
    return json.loads(response.content)


async def _generate_challenge_data(
    difficulty: str,
    weak_concepts: list[str],
    strong_concepts: list[str],
    coaching_notes: str,
    use_case_context: str,
) -> dict:
    """
    LLM generates the challenge structure, with hints tailored to
    the student's identified weak areas.
    """
    llm = ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    system = CHALLENGE_AGENT_SYSTEM.format(
        weak_concepts=", ".join(weak_concepts) if weak_concepts else "none identified yet",
        strong_concepts=", ".join(strong_concepts) if strong_concepts else "none identified yet",
        coaching_notes=coaching_notes,
        difficulty=difficulty,
    )

    human = CHALLENGE_AGENT_HUMAN.format(
        difficulty=difficulty,
        domain=random.choice(ATTACK_DOMAINS),
        use_case_context=use_case_context or "Create a synthetic scenario.",
    )

    messages = [
        SystemMessage(content=system),
        HumanMessage(content=human),
    ]

    response = await llm.ainvoke(messages)
    return json.loads(response.content)
