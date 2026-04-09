from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.session import StudySession
from app.schemas.session import SessionStart, SessionEnd, SessionOut

router = APIRouter()


@router.post("/start", response_model=SessionOut)
async def start_session(
    data: SessionStart,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check for active session
    result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == current_user.id,
            StudySession.end_time.is_(None),
        )
    )
    active = result.scalar_one_or_none()
    if active:
        raise HTTPException(status_code=400, detail="You already have an active session")

    session = StudySession(
        user_id=current_user.id,
        task_id=data.task_id,
        start_time=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/end", response_model=SessionOut)
async def end_session(
    data: SessionEnd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudySession).where(
            StudySession.id == data.session_id,
            StudySession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.end_time = datetime.now(timezone.utc)
    session.duration_mins = int((session.end_time - session.start_time).total_seconds() / 60)
    session.focus_score = data.focus_score
    session.notes = data.notes
    session.distraction_count = data.distraction_count

    await db.commit()
    await db.refresh(session)
    return session


@router.get("/active", response_model=Optional[SessionOut])
async def get_active_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == current_user.id,
            StudySession.end_time.is_(None),
        )
    )
    return result.scalar_one_or_none()


@router.post("/break")
async def log_break(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StudySession).where(
            StudySession.id == session_id,
            StudySession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.break_count += 1
    await db.commit()
    return {"break_count": session.break_count}


@router.get("/sessions", response_model=List[SessionOut])
async def get_sessions(
    days: int = 7,
    task_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    query = select(StudySession).where(
        StudySession.user_id == current_user.id,
        StudySession.start_time >= since,
    )
    if task_id:
        query = query.where(StudySession.task_id == task_id)

    query = query.order_by(desc(StudySession.start_time))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats/week")
async def get_weekly_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(StudySession).where(
            StudySession.user_id == current_user.id,
            StudySession.start_time >= since,
            StudySession.end_time.isnot(None),
        )
    )
    sessions = result.scalars().all()

    total_mins = sum(s.duration_mins or 0 for s in sessions)
    focus_scores = [s.focus_score for s in sessions if s.focus_score]
    avg_focus = round(sum(focus_scores) / len(focus_scores), 1) if focus_scores else 0

    # Most productive hour
    hour_counts = {}
    for s in sessions:
        h = s.start_time.hour
        hour_counts[h] = hour_counts.get(h, 0) + 1
    most_productive = max(hour_counts, key=hour_counts.get) if hour_counts else 9

    return {
        "total_mins": total_mins,
        "avg_focus": avg_focus,
        "total_sessions": len(sessions),
        "most_productive_hour": most_productive,
    }
