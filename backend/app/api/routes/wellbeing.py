from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.mood import MoodEntry
from app.schemas.mood import MoodCreate, MoodOut, StressAlert
from app.services.stress_service import get_stress_analysis, get_break_suggestion
from app.services.recommender_service import get_study_recommendations

router = APIRouter()


@router.post("/mood", response_model=MoodOut)
async def log_mood(
    data: MoodCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = MoodEntry(
        user_id=current_user.id,
        mood_score=data.mood_score,
        stress_level=data.stress_level,
        notes=data.notes,
        trigger_tags=data.trigger_tags,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.get("/mood/history", response_model=List[MoodOut])
async def get_mood_history(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(MoodEntry)
        .where(MoodEntry.user_id == current_user.id, MoodEntry.timestamp >= since)
        .order_by(desc(MoodEntry.timestamp))
    )
    return result.scalars().all()


@router.get("/alerts", response_model=StressAlert)
async def get_stress_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await get_stress_analysis(current_user.id, db)
    return StressAlert(**analysis)


@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await get_stress_analysis(current_user.id, db)
    style = current_user.learning_style.value if current_user.learning_style else "Visual"
    return await get_study_recommendations(style, analysis.get("trend", "stable"))


@router.post("/break-suggestion")
async def get_break_suggestion_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_break_suggestion(current_user.id, db)
