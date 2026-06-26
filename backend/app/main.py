from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.models import User, UseCase, PracticeSession, Evaluation, PracticeMemory  # noqa: F401 — registers all models with Base.metadata
from app.routers import use_cases, practice, health

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(use_cases.router, prefix="/api/use-cases", tags=["use-cases"])
app.include_router(practice.router, prefix="/api/practice", tags=["practice"])
