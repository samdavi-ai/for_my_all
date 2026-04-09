import sqlite3
import uuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_pw = pwd_context.hash("password123")
user_id = str(uuid.uuid4())

conn = sqlite3.connect("smart_study.db")
c = conn.cursor()

try:
    c.execute("DELETE FROM users WHERE email = 'demo@example.com'")
    c.execute("""
    INSERT INTO users (id, email, hashed_password, name, learning_style)
    VALUES (?, ?, ?, ?, ?)
    """, (user_id, 'demo@example.com', hashed_pw, 'Demo User', 'VISUAL'))
    
    conn.commit()
    print("User inserted successfully via raw SQL with VISUAL enum key!")
except Exception as e:
    print("Error:", e)
finally:
    conn.close()
