import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    start_time = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=True)
    duration_mins = Column(Integer, nullable=True)
    focus_score = Column(Integer, nullable=True)  # 1-10
    break_count = Column(Integer, default=0)
    distraction_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    task = relationship("Task", back_populates="sessions")
