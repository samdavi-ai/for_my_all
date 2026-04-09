import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, JSON, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class LearningStyle(str, enum.Enum):
    VISUAL = "Visual"
    AUDITORY = "Auditory"
    READING = "Reading"
    KINESTHETIC = "Kinesthetic"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String, nullable=False)
    learning_style = Column(SAEnum(LearningStyle), default=LearningStyle.VISUAL)
    peak_hours = Column(JSON, default=[9, 14, 20])
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("StudySession", back_populates="user", cascade="all, delete-orphan")
    mood_entries = relationship("MoodEntry", back_populates="user", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
