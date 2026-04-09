from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageOut(BaseModel):
    id: str
    user_id: str
    role: str
    content: str
    timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True


class SummarizeRequest(BaseModel):
    text: str


class ExplainRequest(BaseModel):
    topic: str


class SummaryResponse(BaseModel):
    summary: str
    key_points: list = []


class ExplanationResponse(BaseModel):
    explanation: str
