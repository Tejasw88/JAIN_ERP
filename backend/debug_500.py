from fastapi.testclient import TestClient
from server import app
import traceback

# app.dependency_overrides = {} # Clear overrides if any

client = TestClient(app, raise_server_exceptions=True)

print("--- Sending Request ---")
try:
    resp = client.post("/api/auth/login", json={"identifier": "admin", "password": "wrong"})
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception:
    print("--- EXCEPTION CAUGHT ---")
    traceback.print_exc()
