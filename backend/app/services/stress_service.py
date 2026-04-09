from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mood import MoodEntry
from app.ml.stress_detector import analyze_stress_pattern


async def get_stress_analysis(user_id: str, db: AsyncSession) -> dict:
    """Analyze recent stress patterns for a user."""
    result = await db.execute(
        select(MoodEntry)
        .where(MoodEntry.user_id == user_id)
        .order_by(desc(MoodEntry.timestamp))
        .limit(7)
    )
    entries = result.scalars().all()
    return analyze_stress_pattern(entries)


async def get_break_suggestion(user_id: str, db: AsyncSession) -> dict:
    """Get personalized break suggestion based on current state."""
    result = await db.execute(
        select(MoodEntry)
        .where(MoodEntry.user_id == user_id)
        .order_by(desc(MoodEntry.timestamp))
        .limit(1)
    )
    latest_mood = result.scalar_one_or_none()

    stress = latest_mood.stress_level if latest_mood else 5

    if stress >= 8:
        return {
            "should_break": True,
            "message": "Your stress level is high. Please take a restorative break.",
            "activity": "Try the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8. Repeat 3 times."
        }
    elif stress >= 6:
        return {
            "should_break": True,
            "message": "You've been working hard! A short break would help.",
            "activity": "Take a 5-minute walk, stretch, or grab some water. Moving your body resets your focus."
        }
    elif stress >= 4:
        return {
            "should_break": False,
            "message": "You're doing well! Keep going, but remember to take breaks.",
            "activity": "Consider a 5-minute stretch or eye rest after your current Pomodoro session."
        }
    else:
        return {
            "should_break": False,
            "message": "Great flow state! You're managing your energy well.",
            "activity": "Keep it up! Maybe reward yourself with a favorite snack after this session."
        }
