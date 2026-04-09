from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.user import LearningStyle


class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    learning_style: LearningStyle = LearningStyle.VISUAL


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    learning_style: LearningStyle
    peak_hours: Optional[List[int]] = [9, 14, 20]
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    learning_style: Optional[LearningStyle] = None
    peak_hours: Optional[List[int]] = None
    avatar_url: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
