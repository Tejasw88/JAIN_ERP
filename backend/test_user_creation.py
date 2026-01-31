import requests

BASE_URL = "http://localhost:8000/api"
TOKEN = None # Will need to get an admin token first

def get_admin_token():
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "identifier": "admin",
        "password": "123456789"  # Assuming default admin
    })
    if resp.status_code == 200:
        return resp.json()['token']
    else:
        print(f"Failed to login as admin: {resp.text}")
        return None

def test_student_creation_validation():
    token = get_admin_token()
    if not token: return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("--- Testing Student Creation Validation ---")
    
    # Payload missing year and section
    payload = {
        "username": "test.valid.student",
        "email": "test.valid@jainuniversity.ac.in",
        "role": "Student",
        "name": "Test Validator",
        "idno": "JUUG25VALID001",
        "department": "CSE"
        # Missing year and section
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/users", json=payload, headers=headers)
        if resp.status_code == 400:
            print("✅ SUCCESS: Backend correctly rejected missing fields.")
            print(f"   Response: {resp.json().get('detail')}")
        else:
            print(f"❌ FAILURE: Backend accepted missing fields! Status: {resp.status_code}")
            print(f"   Response: {resp.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_student_creation_validation()
