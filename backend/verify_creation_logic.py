from fastapi.testclient import TestClient
from server import app
import traceback
from unittest.mock import MagicMock, patch

# Mock DB connection to avoid hitting real DB if possible, OR just rely on validation error happening BEFORE DB hit.
# The validation for department/year/section happens *before* DB check in my modification.

client = TestClient(app)

def test_creation_validation():
    print("--- Testing Student Creation Validation (In-Process) ---")
    
    # We need a token to bypass verify_token dependency OR we can override it.
    # Let's override the dependency to simulate an logged-in admin.
    
    
    # We will just use the standard login flow since it is working now.
    
    try:
        # 1. Login
        login_resp = client.post("/api/auth/login", json={"identifier": "admin", "password": "123456789"})
        if login_resp.status_code != 200:
            print(f"Login failed: {login_resp.status_code} {login_resp.text}")
            return
        
        token = login_resp.json()['token']
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Try to create student with missing fields
        payload = {
            "username": "test.valid.student",
            "email": "test.valid@jainuniversity.ac.in",
            "role": "Student",
            "name": "Test Validator",
            "idno": "JUUG25VALID001",
            "department": "" # Empty!
            # Missing year/section
        }
        
        resp = client.post("/api/users", json=payload, headers=headers)
        
        if resp.status_code == 400:
            print("✅ SUCCESS: Backend correctly rejected missing fields.")
            print(f"   Response: {resp.json().get('detail')}")
        else:
            print(f"❌ FAILURE: Backend accepted missing fields! Status: {resp.status_code}")
            print(f"   Response: {resp.text}")

    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    test_creation_validation()
