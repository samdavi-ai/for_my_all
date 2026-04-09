import asyncio
from app.core.security import hash_password
from app.core.database import async_session
from app.models.user import User
import uuid

async def run():
    async with async_session() as db:
        user = User(
            id=str(uuid.uuid4()),
            email='admin@example.com',
            hashed_password=hash_password('password123'),
            name='Admin User',
            learning_style='Visual'
        )
        db.add(user)
        try:
            await db.commit()
            print("Admin created successfully")
        except Exception as e:
            print("Failed or already exists:", e)

if __name__ == '__main__':
    asyncio.run(run())
