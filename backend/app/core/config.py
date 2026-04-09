from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Smart Study Companion"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database (SQLite for easy setup)
    DATABASE_URL: str = "sqlite+aiosqlite:///./smart_study.db"

    # JWT Auth
    SECRET_KEY: str = "your-super-secret-jwt-key-minimum-32-characters-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Groq AI
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
