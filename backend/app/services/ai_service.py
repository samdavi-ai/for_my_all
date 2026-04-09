from groq import Groq
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.task import Task, TaskStatus
from app.models.mood import MoodEntry
from app.models.user import User

client = None
if settings.GROQ_API_KEY:
    client = Groq(api_key=settings.GROQ_API_KEY)


async def get_pending_tasks_summary(user_id: str, db: AsyncSession) -> str:
    result = await db.execute(
        select(Task)
        .where(Task.user_id == user_id, Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]))
        .order_by(desc(Task.priority_score))
        .limit(5)
    )
    tasks = result.scalars().all()
    if not tasks:
        return "No pending tasks"
    return ", ".join([f"{t.title} ({t.subject}, priority: {t.priority_score:.1f})" for t in tasks])


async def get_latest_mood(user_id: str, db: AsyncSession):
    result = await db.execute(
        select(MoodEntry)
        .where(MoodEntry.user_id == user_id)
        .order_by(desc(MoodEntry.timestamp))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def chat_with_companion(user: User, message: str, history: list, db: AsyncSession) -> str:
    """Chat with AI companion using Groq API."""
    if not client:
        return _mock_response(message)

    pending_tasks = await get_pending_tasks_summary(user.id, db)
    recent_mood = await get_latest_mood(user.id, db)

    system_prompt = f"""You are a warm, supportive Smart Study Companion AI for {user.name}.
Learning style: {user.learning_style.value if user.learning_style else 'Visual'}.
Pending tasks: {pending_tasks}.
Current stress level: {recent_mood.stress_level if recent_mood else 'unknown'}/10.
Keep responses concise (max 150 words). Be encouraging and practical.
If stress > 7, gently suggest a break or breathing exercise.
Use emojis sparingly to be friendly. Format with markdown when helpful."""

    messages = [{"role": m.role.value if hasattr(m.role, 'value') else m.role, "content": m.content} for m in history[-10:]]
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "system", "content": system_prompt}] + messages,
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"I'm having a moment — please try again shortly! (Error: {str(e)[:50]})"


async def summarize_notes(text: str) -> dict:
    """Summarize study notes into key points."""
    if not client:
        return {
            "summary": "Here's a summary of your notes:\n\n• Key point 1 from your notes\n• Key point 2 from your notes\n• Key point 3 from your notes",
            "key_points": ["Point 1", "Point 2", "Point 3"]
        }

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{
                "role": "user",
                "content": f"Summarize these study notes into 5 key bullet points. Return a brief summary paragraph followed by the bullet points:\n\n{text}"
            }],
            max_tokens=400,
            temperature=0.3,
        )
        content = response.choices[0].message.content
        return {"summary": content, "key_points": []}
    except Exception as e:
        return {"summary": f"Could not summarize: {str(e)[:50]}", "key_points": []}


async def explain_topic(topic: str, learning_style: str = "Visual") -> dict:
    """Explain a topic adapted to the user's learning style."""
    if not client:
        return {"explanation": f"Here's an explanation of '{topic}' tailored to your {learning_style} learning style."}

    style_instruction = {
        "Visual": "Use analogies, comparisons, and describe visual diagrams or charts that would help explain this.",
        "Auditory": "Explain as if giving a lecture. Use rhythm and repetition.",
        "Reading": "Provide a structured written explanation with headers and bullet points.",
        "Kinesthetic": "Include hands-on examples, experiments, or activities to understand the concept.",
    }

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{
                "role": "user",
                "content": f"Explain the following topic in a concise way (max 200 words). {style_instruction.get(learning_style, '')}:\n\nTopic: {topic}"
            }],
            max_tokens=400,
            temperature=0.5,
        )
        return {"explanation": response.choices[0].message.content}
    except Exception as e:
        return {"explanation": f"Could not explain: {str(e)[:50]}"}


def _mock_response(message: str) -> str:
    """Fallback mock response when no API key is configured."""
    msg_lower = message.lower()
    if any(word in msg_lower for word in ["stress", "anxious", "worried", "overwhelmed"]):
        return "I hear you, and it's completely normal to feel stressed. 💙 Here are some things that might help:\n\n• Take 3 deep breaths right now (4 seconds in, 7 hold, 8 out)\n• Break your current task into smaller 10-minute chunks\n• Step outside for a quick 5-minute walk\n\nRemember: you're doing great just by showing up. Would you like to talk more about what's on your mind?"
    elif any(word in msg_lower for word in ["study", "tip", "advice", "help"]):
        return "Here are some study tips tailored for you! 📚\n\n• Start with your hardest subject while your energy is highest\n• Use the Pomodoro technique: 25 min focus + 5 min break\n• Review notes within 24 hours of learning\n• Try teaching the concept to someone else — it boosts retention!\n\nWould you like help with a specific subject?"
    elif any(word in msg_lower for word in ["prioritize", "task", "organize"]):
        return "Let's get organized! 📋 Here's my suggestion:\n\n1. Check your task list and identify what's due soonest\n2. Rate each task by difficulty (tackle hard ones during peak hours)\n3. Use the 2-minute rule: if it takes < 2 min, do it now\n4. Schedule focus sessions for your big tasks\n\nI can see your pending tasks — want me to help prioritize them?"
    else:
        return f"Thanks for reaching out! 😊 I'm your Study Companion and I'm here to help with:\n\n• Study tips & techniques\n• Task prioritization\n• Stress management\n• Explaining topics\n• Note summarization\n\nHow can I help you today?"
