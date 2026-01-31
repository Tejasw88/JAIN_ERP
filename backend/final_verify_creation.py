import requests
import random

BASE_URL = "http://localhost:8000/api"

def get_admin_token():
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "identifier": "admin",
        "password": "123456789"
    })
    return resp.json()['token'] if resp.status_code == 200 else None

def test_successful_student_creation():
    token = get_admin_token()
    if not token: 
        print("Login failed")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Randomize username to avoid conflict
    rand = random.randint(1000, 9999)
    payload = {
        "username": f"test.student.{rand}",
        "email": f"test.student.{rand}@jainuniversity.ac.in",
        "role": "Student",
        "name": "Test Success",
        "idno": f"JUUG25SUCCESS{rand}",
        "department": "CSE",
        "year": "1",
        "section": "A"
    }
    
    print(f"--- Testing Successful Student Creation ({payload['username']}) ---")
    
    try:
        resp = requests.post(f"{BASE_URL}/users", json=payload, headers=headers)
        if resp.status_code == 200:
            print("✅ SUCCESS: Student created successfully!")
            print(f"   Response: {resp.json().get('message')}")
        else:
            print(f"❌ FAILURE: Status {resp.status_code}")
            print(f"   Response: {resp.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_successful_student_creation()
