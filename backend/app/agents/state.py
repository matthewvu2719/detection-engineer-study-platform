from datetime import datetime
from typing import Optional, TypedDict


class ChallengeState(TypedDict):
    # ── inputs ────────────────────────────────────────────
    difficulty: str
    source_use_case_id: Optional[str]
    user_id: Optional[str]
    use_case_context: str       # pre-loaded from DB before graph runs

    # ── populated by rag_agent_node ───────────────────────
    weakness_profile: dict      # {weak_concepts, strong_concepts, coaching_notes, has_history}

    # ── populated by challenge_node ───────────────────────
    challenge_data: Optional[dict]


class EvaluationState(TypedDict):
    # ── inputs ────────────────────────────────────────────
    challenge: dict             # serialised PracticeChallenge fields
    submitted_kql: str
    user_id: Optional[str]
    started_at: Optional[datetime]

    # ── populated by kql_evaluator_node ──────────────────
    session_id: Optional[str]
    evaluation_id: Optional[str]
    evaluation_data: Optional[dict]
