import sqlite3
import os

DB_PATH = "./mediaos.db"


def test_connection():
    print(f"🔍 Checking database at: {os.path.abspath(DB_PATH)}")

    if not os.path.exists(DB_PATH):
        print(f"❌ ERROR: File '{DB_PATH}' does not exist in this directory!")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 1. List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"📊 Found tables: {[t[0] for t in tables]}")

        if ('users',) in tables:
            print("✅ Table 'users' EXISTS.")

            # 2. Check users
            cursor.execute("SELECT id, username FROM users")
            users = cursor.fetchall()
            if users:
                print(f"👤 Users found in DB: {users}")
            else:
                print("⚠️ Table 'users' is EMPTY.")
        else:
            print("❌ Table 'users' is MISSING!")

        conn.close()

    except Exception as e:
        print(f"🔥 FATAL ERROR: {e}")


if __name__ == "__main__":
    test_connection()