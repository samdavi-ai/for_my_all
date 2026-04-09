import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, CheckConstraint, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    ARCHIVED = "archived"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject = Column(String(100), nullable=False)
    deadline = Column(DateTime, nullable=True)
    difficulty = Column(Integer, default=3)
    importance_flag = Column(Boolean, default=False)
    priority_score = Column(Float, default=0.5)
    estimated_mins = Column(Integer, default=60)
    status = Column(SAEnum(TaskStatus), default=TaskStatus.PENDING)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("difficulty >= 1 AND difficulty <= 5", name="ck_difficulty_range"),
    )

    # Relationships
    user = relationship("User", back_populates="tasks")
    sessions = relationship("StudySession", back_populates="task")
