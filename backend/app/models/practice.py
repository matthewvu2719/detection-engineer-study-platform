from sqlalchemy import Column, Text, Integer, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class PracticeChallenge(Base):
    __tablename__ = "practice_challenges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_use_case_id = Column(UUID(as_uuid=True), ForeignKey("use_cases.id", ondelete="SET NULL"), nullable=True)
    source_type = Column(Text, nullable=False)

    difficulty = Column(Text, nullable=False)
    scenario = Column(Text, nullable=False)
    objectives = Column(JSONB, default=list)
    available_tables = Column(JSONB, default=list)
    expected_entities = Column(JSONB, default=list)
    hints = Column(JSONB, default=list)
    reference_kql = Column(Text, nullable=False)
    tags = Column(JSONB, default=list)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    sessions = relationship("PracticeSession", back_populates="challenge")


class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    challenge_id = Column(UUID(as_uuid=True), ForeignKey("practice_challenges.id", ondelete="SET NULL"))

    difficulty = Column(Text, nullable=False)
    submitted_kql = Column(Text, nullable=False)
    started_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    submitted_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    challenge = relationship("PracticeChallenge", back_populates="sessions")
    evaluation = relationship("Evaluation", back_populates="session", uselist=False)
    memory = relationship("PracticeMemory", back_populates="session", uselist=False)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("practice_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))

    overall_score = Column(Integer, nullable=False)
    detection_logic_score = Column(Integer)
    query_structure_score = Column(Integer)
    entity_mapping_score = Column(Integer)
    time_window_score = Column(Integer)
    performance_score = Column(Integer)

    strengths = Column(JSONB, default=list)
    weaknesses = Column(JSONB, default=list)
    missing_logic = Column(JSONB, default=list)
    suggested_improvements = Column(JSONB, default=list)
    reference_solution = Column(Text)
    recommended_concepts = Column(JSONB, default=list)
    learn_modules = Column(JSONB, default=list)
    learning_summary = Column(Text, nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    session = relationship("PracticeSession", back_populates="evaluation")
