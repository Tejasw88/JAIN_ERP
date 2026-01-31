import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

def run_migration(cursor, filepath):
    print(f"Applying {filepath}...")
    if not os.path.exists(filepath):
        # Try both relative to root and relative to backend
        alt_path = os.path.join('backend', filepath)
        if os.path.exists(alt_path):
            filepath = alt_path
        else:
            print(f"File {filepath} not found")
            return
    
    with open(filepath, 'r') as f:
        sql = f.read()
        # Primitive splitter, handles most our migration files
        statements = sql.split(';')
        for statement in statements:
            if statement.strip():
                try:
                    cursor.execute(statement)
                except Exception as e:
                    # Ignore "already exists" errors for idempotency
                    err_str = str(e).lower()
                    if 'duplicate column' in err_str or 'already exists' in err_str or 'duplicate key' in err_str or 'duplicate entry' in err_str:
                        continue
                    print(f"Warn in {filepath}: {e}")

try:
    conn = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USERNAME'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_DATABASE'),
        port=int(os.getenv('DB_PORT', 4000)),
        ssl={'ssl': True}
    )
    cursor = conn.cursor()
    
    # Run migrations in order
    migrations = [
        'migrations/phase_3_to_10_migration.sql',
        'migrations/phase_4_attendance.sql',
        'migrations/phase_11_departments.sql',
        'migrations/phase_13_sections_and_leave.sql'
    ]
    
    for m in migrations:
        run_migration(cursor, m)
    
    conn.commit()
    print("Migrations applied successfully!")
    conn.close()
except Exception as e:
    print(f"Migration error: {e}")
