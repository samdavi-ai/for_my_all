import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    mood_score = Column(Integer, nullable=False)  # 1-10
    stress_level = Column(Integer, nullable=False)  # 1-10
    notes = Column(Text, nullable=True)
    trigger_tags = Column(JSON, default=[])  # ["exams", "workload", "sleep", "social"]

    # Relationships
    user = relationship("User", back_populates="mood_entries")
