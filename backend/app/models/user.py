from sqlalchemy import Column, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMPTZ
from sqlalchemy.sql import func
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(Text, unique=True, nullable=False)
    email = Column(Text, unique=True, nullable=False)
    display_name = Column(Text)
    created_at = Column(TIMESTAMPTZ, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMPTZ, server_default=func.now(), onupdate=func.now(), nullable=False)
