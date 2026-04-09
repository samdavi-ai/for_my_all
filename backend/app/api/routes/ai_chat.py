from fastapi import APIRouter, Depends
from sqlalchemy import select, desc, delete
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.chat import ChatMessage, MessageRole
from app.schemas.chat import ChatMessageCreate, ChatMessageOut, SummarizeRequest, ExplainRequest, SummaryResponse, ExplanationResponse
from app.services import ai_service

router = APIRouter()


@router.post("/message", response_model=ChatMessageOut)
async def send_message(
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Save user message
    user_msg = ChatMessage(
        user_id=current_user.id,
        role=MessageRole.USER,
        content=data.content,
    )
    db.add(user_msg)
    await db.flush()

    # Get conversation history
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(desc(ChatMessage.timestamp))
        .limit(10)
    )
    history = list(reversed(result.scalars().all()))

    # Get AI response
    ai_response = await ai_service.chat_with_companion(
        user=current_user,
        message=data.content,
        history=history,
        db=db,
    )

    # Save AI response
    ai_msg = ChatMessage(
        user_id=current_user.id,
        role=MessageRole.ASSISTANT,
        content=ai_response,
    )
    db.add(ai_msg)
    await db.commit()
    await db.refresh(ai_msg)

    return ai_msg


@router.get("/history", response_model=List[ChatMessageOut])
async def get_chat_history(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.timestamp)
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


@router.delete("/history")
async def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        delete(ChatMessage).where(ChatMessage.user_id == current_user.id)
    )
    await db.commit()
    return {"message": "Chat history cleared"}


@router.post("/summarize-notes", response_model=SummaryResponse)
async def summarize_notes(
    data: SummarizeRequest,
    current_user: User = Depends(get_current_user),
):
    result = await ai_service.summarize_notes(data.text)
    return SummaryResponse(**result)


@router.post("/explain", response_model=ExplanationResponse)
async def explain_topic(
    data: ExplainRequest,
    current_user: User = Depends(get_current_user),
):
    style = current_user.learning_style.value if current_user.learning_style else "Visual"
    result = await ai_service.explain_topic(data.topic, style)
    return ExplanationResponse(**result)
