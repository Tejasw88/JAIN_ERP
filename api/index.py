import sys
from pathlib import Path

# Add the backend directory to the path so we can import server
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Import the FastAPI app from server.py
from server import app

# Vercel expects the app to be named 'app' or 'handler'
# FastAPI is ASGI-compatible, which Vercel supports
