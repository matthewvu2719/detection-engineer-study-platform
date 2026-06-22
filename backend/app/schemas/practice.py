from pydantic import BaseModel, Field
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class ChallengeRequest(BaseModel):
    difficulty: str = Field(..., pattern="^(Easy|Medium|Hard)$")
    source_use_case_id: Optional[UUID] = None
    user_id: Optional[UUID] = None


class ChallengeOut(BaseModel):
    id: UUID
    source_type: str
    difficulty: str
    scenario: str
    objectives: list[str]
    available_tables: list[str]
    expected_entities: list[str]
    hints: list[str]
    tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class KQLSubmission(BaseModel):
    challenge_id: UUID
    submitted_kql: str
    user_id: Optional[UUID] = None
    started_at: Optional[datetime] = None


class EvaluationOut(BaseModel):
    id: UUID
    session_id: UUID
    overall_score: int
    detection_logic_score: Optional[int]
    query_structure_score: Optional[int]
    entity_mapping_score: Optional[int]
    time_window_score: Optional[int]
    performance_score: Optional[int]
    strengths: list[str]
    weaknesses: list[str]
    missing_logic: list[str]
    suggested_improvements: list[str]
    reference_solution: Optional[str]
    recommended_concepts: list[str]
    learn_modules: list[Any]
    learning_summary: str
    created_at: datetime

    model_config = {"from_attributes": True}


class HintRequest(BaseModel):
    challenge_id: UUID
    hint_index: int = Field(default=0, ge=0)


class HintResponse(BaseModel):
    hint: str
    hints_remaining: int
