from sqlalchemy import Column, Text, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB, TIMESTAMPTZ
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid

from app.database import Base


class PracticeMemory(Base):
    __tablename__ = "practice_memory"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("practice_sessions.id", ondelete="SET NULL"))
    evaluation_id = Column(UUID(as_uuid=True), ForeignKey("evaluations.id", ondelete="SET NULL"))

    learning_summary = Column(Text, nullable=False)
    weak_concepts = Column(JSONB, default=list)
    strong_concepts = Column(JSONB, default=list)
    overall_score = Column(Integer)
    difficulty = Column(Text)

    embedding = Column(Vector(1536))

    created_at = Column(TIMESTAMPTZ, server_default=func.now(), nullable=False)

    session = relationship("PracticeSession", back_populates="memory")
