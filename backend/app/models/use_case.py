from sqlalchemy import Column, Text, Boolean, Integer, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database import Base


class UseCase(Base):
    __tablename__ = "use_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    title = Column(Text, nullable=False)
    alert_name = Column(Text, nullable=False)
    alert_description = Column(Text)
    analytics_rule_name = Column(Text)
    analytics_rule_kql = Column(Text, nullable=True)
    investigation_notes = Column(Text)
    response_notes = Column(Text)

    category = Column(Text)
    severity = Column(Text)
    platform = Column(Text, default="Microsoft Sentinel")
    difficulty = Column(Text)

    detection_purpose = Column(Text)
    detection_logic = Column(Text)
    typical_attack_scenarios = Column(Text)
    kql_explanation = Column(Text)

    entity_mapping = Column(JSONB, default=list)
    tables_used = Column(JSONB, default=list)
    important_columns = Column(JSONB, default=list)
    benign_indicators = Column(JSONB, default=list)
    malicious_indicators = Column(JSONB, default=list)
    classification_guidance = Column(Text)
    rule_tuning_suggestions = Column(JSONB, default=list)
    mitre_mapping = Column(JSONB, default=list)

    learn_recommendations = Column(JSONB, default=list)
    related_concepts = Column(JSONB, default=list)
    kql_operators_to_study = Column(JSONB, default=list)

    enrichment_status = Column(Text, default="pending")
    enrichment_error = Column(Text)
    enriched_at = Column(TIMESTAMP(timezone=True))

    is_public = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    investigation_steps = relationship("InvestigationStep", back_populates="use_case", cascade="all, delete-orphan", order_by="InvestigationStep.step_order")
    investigation_queries = relationship("InvestigationQuery", back_populates="use_case", cascade="all, delete-orphan", order_by="InvestigationQuery.query_order")
    use_case_tags = relationship("UseCaseTag", back_populates="use_case", cascade="all, delete-orphan")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, unique=True, nullable=False)
    color = Column(Text, default="#6366f1")

    use_case_tags = relationship("UseCaseTag", back_populates="tag")


class UseCaseTag(Base):
    __tablename__ = "use_case_tags"

    use_case_id = Column(UUID(as_uuid=True), ForeignKey("use_cases.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    use_case = relationship("UseCase", back_populates="use_case_tags")
    tag = relationship("Tag", back_populates="use_case_tags")


class InvestigationStep(Base):
    __tablename__ = "investigation_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    use_case_id = Column(UUID(as_uuid=True), ForeignKey("use_cases.id", ondelete="CASCADE"), nullable=False)
    step_order = Column(Integer, nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text)
    pivot_type = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    use_case = relationship("UseCase", back_populates="investigation_steps")


class InvestigationQuery(Base):
    __tablename__ = "investigation_queries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    use_case_id = Column(UUID(as_uuid=True), ForeignKey("use_cases.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text)
    kql = Column(Text, nullable=False)
    query_order = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

    use_case = relationship("UseCase", back_populates="investigation_queries")
