from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MoodCreate(BaseModel):
    mood_score: int  # 1-10
    stress_level: int  # 1-10
    notes: Optional[str] = None
    trigger_tags: List[str] = []


class MoodOut(BaseModel):
    id: str
    user_id: str
    timestamp: Optional[datetime] = None
    mood_score: int
    stress_level: int
    notes: Optional[str] = None
    trigger_tags: List[str] = []

    class Config:
        from_attributes = True


class StressAlert(BaseModel):
    alert_triggered: bool
    current_avg: float = 0.0
    trend: str = "stable"
    recommendations: List[str] = []
