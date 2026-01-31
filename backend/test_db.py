import pymysql
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DB_CONFIG = {
    'host': os.environ.get('DB_HOST'),
    'port': int(os.environ.get('DB_PORT', 4000)),
    'user': os.environ.get('DB_USERNAME'),
    'password': os.environ.get('DB_PASSWORD'),
    'database': os.environ.get('DB_DATABASE'),
    'ssl': {'ssl': True},
    'cursorclass': pymysql.cursors.DictCursor
}

def test_db():
    print("Connecting to DB...")
    try:
        conn = pymysql.connect(**DB_CONFIG)
        print("Connected!")
        with conn.cursor() as cursor:
            cursor.execute("SELECT 1")
            print("Query successful:", cursor.fetchone())
        conn.close()
    except Exception as e:
        print("DB Connection Failed:", e)

if __name__ == "__main__":
    test_db()
