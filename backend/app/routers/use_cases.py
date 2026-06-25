from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from uuid import UUID
import math

from app.database import get_db
from app.models.use_case import UseCase, Tag, UseCaseTag, InvestigationStep, InvestigationQuery
from app.schemas.use_case import (
    UseCaseCreate, UseCaseDetail, UseCaseListItem,
    UseCaseListResponse, EnrichmentJobResponse
)
from app.services.ai_enrichment import enrich_use_case

router = APIRouter()


@router.post("/", response_model=UseCaseDetail, status_code=201)
async def create_use_case(
    payload: UseCaseCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(UseCase).where(UseCase.analytics_rule_kql == payload.analytics_rule_kql)
    )
    duplicate = existing.scalar_one_or_none()
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail={"message": "A use case with this KQL already exists.", "existing_id": str(duplicate.id)},
        )

    use_case = UseCase(
        title=payload.title,
        alert_name=payload.alert_name,
        alert_description=payload.alert_description,
        analytics_rule_name=payload.analytics_rule_name,
        analytics_rule_kql=payload.analytics_rule_kql,
        investigation_notes=payload.investigation_notes,
        response_notes=payload.response_notes,
        category=payload.category,
        severity=payload.severity,
        platform=payload.platform,
        difficulty=payload.difficulty,
        mitre_mapping=payload.mitre_mapping,
        enrichment_status="pending",
    )
    db.add(use_case)
    await db.flush()

    # Resolve / create tags
    for tag_name in payload.tags:
        result = await db.execute(select(Tag).where(Tag.name == tag_name))
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
            await db.flush()
        db.add(UseCaseTag(use_case_id=use_case.id, tag_id=tag.id))

    await db.commit()

    # Kick off enrichment in background
    background_tasks.add_task(enrich_use_case, str(use_case.id))

    return await _load_use_case(db, use_case.id)


@router.get("/", response_model=UseCaseListResponse)
async def list_use_cases(
    query: str | None = Query(default=None),
    category: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    difficulty: str | None = Query(default=None),
    platform: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(UseCase).options(
        selectinload(UseCase.use_case_tags).selectinload(UseCaseTag.tag)
    )

    if query:
        like = f"%{query}%"
        stmt = stmt.where(
            or_(
                UseCase.title.ilike(like),
                UseCase.alert_name.ilike(like),
                UseCase.alert_description.ilike(like),
                UseCase.category.ilike(like),
            )
        )
    if category:
        stmt = stmt.where(UseCase.category == category)
    if severity:
        stmt = stmt.where(UseCase.severity == severity)
    if difficulty:
        stmt = stmt.where(UseCase.difficulty == difficulty)
    if platform:
        stmt = stmt.where(UseCase.platform == platform)
    if tag:
        stmt = stmt.join(UseCaseTag).join(Tag).where(Tag.name == tag)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(UseCase.created_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    results = (await db.execute(stmt)).scalars().all()

    items = []
    for uc in results:
        tags = [UseCaseTag_to_tag(uct) for uct in uc.use_case_tags]
        item = UseCaseListItem(
            id=uc.id,
            title=uc.title,
            alert_name=uc.alert_name,
            category=uc.category,
            severity=uc.severity,
            platform=uc.platform,
            difficulty=uc.difficulty,
            enrichment_status=uc.enrichment_status,
            is_public=uc.is_public,
            created_at=uc.created_at,
            tags=tags,
        )
        items.append(item)

    return UseCaseListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{use_case_id}", response_model=UseCaseDetail)
async def get_use_case(use_case_id: UUID, db: AsyncSession = Depends(get_db)):
    uc = await _load_use_case(db, use_case_id)
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")
    return uc


@router.delete("/{use_case_id}", status_code=204)
async def delete_use_case(use_case_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UseCase).where(UseCase.id == use_case_id))
    uc = result.scalar_one_or_none()
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")
    await db.delete(uc)
    await db.commit()


@router.post("/{use_case_id}/enrich", response_model=EnrichmentJobResponse)
async def trigger_enrichment(
    use_case_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(UseCase).where(UseCase.id == use_case_id))
    uc = result.scalar_one_or_none()
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")

    uc.enrichment_status = "pending"
    await db.commit()

    background_tasks.add_task(enrich_use_case, str(use_case_id))

    return EnrichmentJobResponse(
        use_case_id=use_case_id,
        status="pending",
        message="Enrichment started",
    )


# ── helpers ──────────────────────────────────────────────────────────────────

async def _load_use_case(db: AsyncSession, use_case_id: UUID):
    stmt = (
        select(UseCase)
        .where(UseCase.id == use_case_id)
        .options(
            selectinload(UseCase.investigation_steps),
            selectinload(UseCase.investigation_queries),
            selectinload(UseCase.use_case_tags).selectinload(UseCaseTag.tag),
        )
    )
    result = await db.execute(stmt)
    uc = result.scalar_one_or_none()
    if not uc:
        return None

    tags = [UseCaseTag_to_tag(uct) for uct in uc.use_case_tags]
    return UseCaseDetail.model_validate({**uc.__dict__, "tags": tags})


def UseCaseTag_to_tag(uct: UseCaseTag):
    from app.schemas.use_case import TagOut
    return TagOut(id=uct.tag.id, name=uct.tag.name, color=uct.tag.color)
