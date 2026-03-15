# auth.py
import bcrypt
from datetime import datetime, timedelta
from jose import jwt
import sqlite3
import os

# Konfigurace
SECRET_KEY = "tvuj_velmi_tajny_klic"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


def get_password_hash(password: str):
    # Bcrypt vyžaduje byty. UTF-8 kódování je standard.
    pwd_bytes = password.encode('utf-8')
    # Vygenerujeme sůl a zahashujeme.
    # Výsledek je vždy 60 znaků dlouhý, což TEXT v SQLite v pohodě pobere.
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str):
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def init_db():
    conn = sqlite3.connect("mediaos.db")
    cursor = conn.cursor()
    # Použijeme VARCHAR(60), i když to SQLite interně bere jako TEXT,
    # pro lidské oko je to jasnější.
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             username VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(60) NOT NULL
        )
    ''')

    cursor.execute("SELECT * FROM users WHERE username='admin'")
    if not cursor.fetchone():
        print("🚀 Creating default admin with secure hash...")
        hashed_pass = get_password_hash("barly123")
        cursor.execute(
            "INSERT INTO users (username, hashed_password) VALUES (?, ?)",
            ("admin", hashed_pass)
        )

    conn.commit()
    conn.close()
    print("✅ Database initialized successfully.")