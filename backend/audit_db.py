import pymysql
import os
from dotenv import load_dotenv

load_dotenv('.env')

def audit():
    try:
        conn = pymysql.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USERNAME'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_DATABASE'),
            port=int(os.getenv('DB_PORT', 4000)),
            ssl={'ssl': True},
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()

        print("--- Student Sections Audit ---")
        cursor.execute("SELECT id, username, name, department, year, section FROM users WHERE role = 'Student' LIMIT 10")
        students = cursor.fetchall()
        for s in students:
            print(f"Student: {s['username']} | Name: {s['name']} | Dept: {s['department']} | Year: {s['year']} | Section: {s['section']}")

        print("\n--- Class Teacher Assignments Audit ---")
        cursor.execute("""
            SELECT ct.id, u.username as teacher_username, u.name as teacher_name, ct.department, ct.year, ct.section 
            FROM class_teachers ct 
            JOIN users u ON ct.teacher_id = u.id
        """)
        assignments = cursor.fetchall()
        for a in assignments:
            print(f"Teacher: {a['teacher_name']} ({a['teacher_username']}) | Dept: {a['department']} | Year: {a['year']} | Section: '{a['section']}'")

        conn.close()
    except Exception as e:
        print(f"Audit error: {e}")

if __name__ == "__main__":
    audit()
