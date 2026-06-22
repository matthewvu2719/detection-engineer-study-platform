from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models.practice import PracticeChallenge
from app.schemas.practice import (
    ChallengeRequest, ChallengeOut,
    KQLSubmission, EvaluationOut,
    HintRequest, HintResponse,
)
from app.services.challenge_generator import generate_challenge
from app.services.kql_evaluator import evaluate_submission

router = APIRouter()


@router.post("/challenge", response_model=ChallengeOut, status_code=201)
async def create_challenge(
    payload: ChallengeRequest,
    db: AsyncSession = Depends(get_db),
):
    challenge = await generate_challenge(
        db=db,
        difficulty=payload.difficulty,
        source_use_case_id=payload.source_use_case_id,
        user_id=payload.user_id,
    )
    return challenge


@router.get("/challenge/{challenge_id}", response_model=ChallengeOut)
async def get_challenge(challenge_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PracticeChallenge).where(PracticeChallenge.id == challenge_id)
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge


@router.post("/submit", response_model=EvaluationOut, status_code=201)
async def submit_kql(
    payload: KQLSubmission,
    db: AsyncSession = Depends(get_db),
):
    try:
        _, evaluation = await evaluate_submission(
            db=db,
            challenge_id=payload.challenge_id,
            submitted_kql=payload.submitted_kql,
            user_id=payload.user_id,
            started_at=payload.started_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return evaluation


@router.post("/hint", response_model=HintResponse)
async def get_hint(payload: HintRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PracticeChallenge).where(PracticeChallenge.id == payload.challenge_id)
    )
    challenge = result.scalar_one_or_none()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    hints = challenge.hints or []
    if payload.hint_index >= len(hints):
        raise HTTPException(status_code=400, detail="No more hints available")

    return HintResponse(
        hint=hints[payload.hint_index],
        hints_remaining=len(hints) - payload.hint_index - 1,
    )
