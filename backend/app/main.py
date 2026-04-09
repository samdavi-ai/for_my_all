from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import auth, tasks, schedule, focus, wellbeing, ai_chat, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    print(f"🚀 {settings.APP_NAME} API started!")
    yield
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="Smart Study Companion API",
    version="1.0.0",
    description="AI-Powered Productivity & Wellbeing Tool for Students",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(auth.router, prefix=f"{PREFIX}/auth", tags=["Auth"])
app.include_router(tasks.router, prefix=f"{PREFIX}/tasks", tags=["Tasks"])
app.include_router(schedule.router, prefix=f"{PREFIX}/schedule", tags=["Schedule"])
app.include_router(focus.router, prefix=f"{PREFIX}/focus", tags=["Focus"])
app.include_router(wellbeing.router, prefix=f"{PREFIX}/wellbeing", tags=["Wellbeing"])
app.include_router(ai_chat.router, prefix=f"{PREFIX}/chat", tags=["Chat"])
app.include_router(analytics.router, prefix=f"{PREFIX}/analytics", tags=["Analytics"])


@app.get("/")
async def root():
    return {"message": "Smart Study Companion API", "version": "1.0.0", "docs": "/docs"}
