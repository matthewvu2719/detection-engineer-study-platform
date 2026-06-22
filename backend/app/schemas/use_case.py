from pydantic import BaseModel, Field
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class UseCaseCreate(BaseModel):
    title: str
    alert_name: str
    alert_description: Optional[str] = None
    analytics_rule_name: Optional[str] = None
    analytics_rule_kql: str
    investigation_notes: Optional[str] = None
    response_notes: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    platform: str = "Microsoft Sentinel"
    difficulty: Optional[str] = None
    mitre_mapping: list[dict] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class InvestigationStepOut(BaseModel):
    id: UUID
    step_order: int
    title: str
    description: Optional[str]
    pivot_type: Optional[str]

    model_config = {"from_attributes": True}


class InvestigationQueryOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    kql: str
    query_order: int

    model_config = {"from_attributes": True}


class TagOut(BaseModel):
    id: UUID
    name: str
    color: str

    model_config = {"from_attributes": True}


class UseCaseListItem(BaseModel):
    id: UUID
    title: str
    alert_name: str
    category: Optional[str]
    severity: Optional[str]
    platform: str
    difficulty: Optional[str]
    enrichment_status: str
    is_public: bool
    created_at: datetime
    tags: list[TagOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class UseCaseDetail(BaseModel):
    id: UUID
    title: str
    alert_name: str
    alert_description: Optional[str]
    analytics_rule_name: Optional[str]
    analytics_rule_kql: str
    investigation_notes: Optional[str]
    response_notes: Optional[str]

    category: Optional[str]
    severity: Optional[str]
    platform: str
    difficulty: Optional[str]

    detection_purpose: Optional[str]
    detection_logic: Optional[str]
    typical_attack_scenarios: Optional[str]
    kql_explanation: Optional[str]

    entity_mapping: list[Any] = Field(default_factory=list)
    tables_used: list[Any] = Field(default_factory=list)
    important_columns: list[Any] = Field(default_factory=list)
    benign_indicators: list[Any] = Field(default_factory=list)
    malicious_indicators: list[Any] = Field(default_factory=list)
    classification_guidance: Optional[str]
    rule_tuning_suggestions: list[Any] = Field(default_factory=list)
    mitre_mapping: list[Any] = Field(default_factory=list)

    learn_recommendations: list[Any] = Field(default_factory=list)
    related_concepts: list[Any] = Field(default_factory=list)
    kql_operators_to_study: list[Any] = Field(default_factory=list)

    enrichment_status: str
    enriched_at: Optional[datetime]
    is_public: bool
    created_at: datetime
    updated_at: datetime

    tags: list[TagOut] = Field(default_factory=list)
    investigation_steps: list[InvestigationStepOut] = Field(default_factory=list)
    investigation_queries: list[InvestigationQueryOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class UseCaseSearchParams(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[str] = None
    difficulty: Optional[str] = None
    platform: Optional[str] = None
    tag: Optional[str] = None
    enrichment_status: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class UseCaseListResponse(BaseModel):
    items: list[UseCaseListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class EnrichmentJobResponse(BaseModel):
    use_case_id: UUID
    status: str
    message: str
