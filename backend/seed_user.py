import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.abspath('.'))

from app.core.database import async_session
from app.models.user import User
from app.core.security import hash_password
import uuid

async def create_demo_user():
    async with async_session() as db:
        user_id = str(uuid.uuid4())
        hashed_pw = hash_password('password123')
        
        user = User(
            id=user_id,
            email='demo@example.com',
            hashed_password=hashed_pw,
            name='Demo User',
            learning_style='Visual'
        )
        db.add(user)
        try:
            await db.commit()
            print("Successfully created demo user!")
        except Exception as e:
            print("Error creating user (might already exist):", e)

if __name__ == '__main__':
    asyncio.run(create_demo_user())
