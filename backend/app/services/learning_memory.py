from uuid import UUID

from langchain_openai import OpenAIEmbeddings
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.memory import PracticeMemory
from app.models.practice import Evaluation, PracticeSession

settings = get_settings()


def _get_embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(
        model=settings.openai_embedding_model,
        api_key=settings.openai_api_key,
    )


async def store_learning_memory(
    db: AsyncSession,
    user_id: UUID,
    session: PracticeSession,
    evaluation: Evaluation,
) -> PracticeMemory:
    embeddings = _get_embeddings()
    embedding_vector = await embeddings.aembed_query(evaluation.learning_summary)

    weak = [c for c in (evaluation.recommended_concepts or []) if evaluation.overall_score < 70]
    strong = [s for s in (evaluation.strengths or [])]

    memory = PracticeMemory(
        user_id=user_id,
        session_id=session.id,
        evaluation_id=evaluation.id,
        learning_summary=evaluation.learning_summary,
        weak_concepts=weak,
        strong_concepts=strong,
        overall_score=evaluation.overall_score,
        difficulty=session.difficulty,
        embedding=embedding_vector,
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return memory


async def retrieve_relevant_memories(
    db: AsyncSession,
    user_id: UUID,
    query: str,
    top_k: int = 5,
) -> list[PracticeMemory]:
    embeddings = _get_embeddings()
    query_vector = await embeddings.aembed_query(query)

    vector_literal = "[" + ",".join(str(v) for v in query_vector) + "]"

    stmt = (
        select(PracticeMemory)
        .where(PracticeMemory.user_id == user_id)
        .order_by(
            PracticeMemory.embedding.op("<->")(text(f"'{vector_literal}'::vector"))
        )
        .limit(top_k)
    )

    result = await db.execute(stmt)
    return result.scalars().all()


async def get_user_learning_profile(
    db: AsyncSession,
    user_id: UUID,
) -> dict:
    result = await db.execute(
        select(PracticeMemory)
        .where(PracticeMemory.user_id == user_id)
        .order_by(PracticeMemory.created_at.desc())
        .limit(20)
    )
    memories = result.scalars().all()

    if not memories:
        return {"has_history": False}

    scores = [m.overall_score for m in memories if m.overall_score is not None]
    weak_counts: dict[str, int] = {}
    for m in memories:
        for concept in (m.weak_concepts or []):
            weak_counts[concept] = weak_counts.get(concept, 0) + 1

    top_weak = sorted(weak_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "has_history": True,
        "sessions_completed": len(memories),
        "average_score": round(sum(scores) / len(scores), 1) if scores else 0,
        "top_weak_concepts": [c for c, _ in top_weak],
        "recent_summaries": [m.learning_summary for m in memories[:3]],
    }
