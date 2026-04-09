import asyncio
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def create_user():
    async with SessionLocal() as db:
        # Check if user already exists
        # This is a raw query just to be safe
        hashed_pw = get_password_hash("adminpassword")
        user = User(
            email="admin@example.com",
            hashed_password=hashed_pw,
            name="Admin User",
            learning_style="Visual"
        )
        db.add(user)
        try:
            await db.commit()
            print("Successfully created admin@example.com")
        except Exception as e:
            print("User might already exist or error:", e)

if __name__ == "__main__":
    asyncio.run(create_user())
