#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class JainLMSAPITester:
    def __init__(self, base_url="https://jain-eduhub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}
        self.users = {}
        self.tests_run = 0
        self.tests_passed = 0
        
        # Test credentials
        self.credentials = {
            "admin": {"identifier": "admin", "password": "123456789"},
            "teacher": {"identifier": "teacher@jainuniversity.ac.in", "password": "123456789"},
            "student": {"identifier": "juug25btech22291@jainuniversity.ac.in", "password": "123456789"},
            "parent": {"identifier": "Tejasw.s22291", "password": "123456789"}
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, role=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if role and role in self.tokens:
            test_headers['Authorization'] = f'Bearer {self.tokens[role]}'
        elif headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ Failed - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_login(self, role):
        """Test login for specific role"""
        creds = self.credentials[role]
        success, response = self.run_test(
            f"{role.title()} Login",
            "POST",
            "auth/login",
            200,
            data=creds
        )
        
        if success and 'token' in response:
            self.tokens[role] = response['token']
            self.users[role] = response['user']
            print(f"   ✓ Token obtained for {role}")
            return True
        return False

    def test_auth_me(self, role):
        """Test /auth/me endpoint"""
        return self.run_test(
            f"Get Current User ({role})",
            "GET",
            "auth/me",
            200,
            role=role
        )

    def test_dashboard_stats(self, role):
        """Test dashboard stats endpoint"""
        return self.run_test(
            f"Dashboard Stats ({role})",
            "GET",
            "dashboard/stats",
            200,
            role=role
        )

    def test_admin_endpoints(self):
        """Test admin-specific endpoints"""
        print("\n📋 Testing Admin Endpoints...")
        
        # Test get users
        success, users_data = self.run_test(
            "Get All Users",
            "GET",
            "users",
            200,
            role="admin"
        )
        
        if success:
            print(f"   ✓ Found {len(users_data)} users")
        
        # Test get students
        success, students_data = self.run_test(
            "Get Students List",
            "GET",
            "students",
            200,
            role="admin"
        )
        
        return success

    def test_teacher_endpoints(self):
        """Test teacher-specific endpoints"""
        print("\n👨‍🏫 Testing Teacher Endpoints...")
        
        # Test get courses
        success, courses_data = self.run_test(
            "Get Teacher Courses",
            "GET",
            "courses",
            200,
            role="teacher"
        )
        
        # Test get grades
        success, grades_data = self.run_test(
            "Get Grades (Teacher)",
            "GET",
            "grades",
            200,
            role="teacher"
        )
        
        return success

    def test_student_endpoints(self):
        """Test student-specific endpoints"""
        print("\n🎓 Testing Student Endpoints...")
        
        # Test get courses
        success, courses_data = self.run_test(
            "Get Student Courses",
            "GET",
            "courses",
            200,
            role="student"
        )
        
        # Test get grades
        success, grades_data = self.run_test(
            "Get Student Grades",
            "GET",
            "grades",
            200,
            role="student"
        )
        
        # Test get attendance
        success, attendance_data = self.run_test(
            "Get Student Attendance",
            "GET",
            "attendance",
            200,
            role="student"
        )
        
        # Test get classwork
        success, classwork_data = self.run_test(
            "Get Student Classwork",
            "GET",
            "classwork",
            200,
            role="student"
        )
        
        return success

    def test_parent_endpoints(self):
        """Test parent-specific endpoints"""
        print("\n👨‍👩‍👧‍👦 Testing Parent Endpoints...")
        
        # Test get grades
        success, grades_data = self.run_test(
            "Get Child Grades",
            "GET",
            "grades",
            200,
            role="parent"
        )
        
        # Test get attendance
        success, attendance_data = self.run_test(
            "Get Child Attendance",
            "GET",
            "attendance",
            200,
            role="parent"
        )
        
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access scenarios"""
        print("\n🔒 Testing Unauthorized Access...")
        
        # Test accessing admin endpoint without token
        success, _ = self.run_test(
            "Unauthorized Admin Access",
            "GET",
            "users",
            403
        )
        
        # Test accessing admin endpoint with student token
        success, _ = self.run_test(
            "Student Accessing Admin Endpoint",
            "GET",
            "users",
            403,
            role="student"
        )
        
        return success

    def test_domain_validation(self):
        """Test domain validation for students and teachers"""
        print("\n🌐 Testing Domain Validation...")
        
        # Test invalid domain for student
        invalid_student = {
            "identifier": "invalid@gmail.com",
            "password": "123456789"
        }
        
        success, _ = self.run_test(
            "Invalid Domain Login",
            "POST",
            "auth/login",
            401,  # Should fail authentication
            data=invalid_student
        )
        
        return True  # This test passing means domain validation is working

def main():
    print("🚀 Starting JAIN University LMS API Tests")
    print("=" * 50)
    
    tester = JainLMSAPITester()
    
    # Test health check first
    health_success, _ = tester.test_health_check()
    if not health_success:
        print("❌ Health check failed. Backend may not be running.")
        return 1
    
    # Test login for all roles
    login_success = True
    for role in ["admin", "teacher", "student", "parent"]:
        if not tester.test_login(role):
            print(f"❌ {role.title()} login failed")
            login_success = False
    
    if not login_success:
        print("❌ Login tests failed. Cannot proceed with authenticated tests.")
        return 1
    
    # Test auth/me for all roles
    for role in tester.tokens.keys():
        tester.test_auth_me(role)
    
    # Test dashboard stats for all roles
    for role in tester.tokens.keys():
        tester.test_dashboard_stats(role)
    
    # Test role-specific endpoints
    if "admin" in tester.tokens:
        tester.test_admin_endpoints()
    
    if "teacher" in tester.tokens:
        tester.test_teacher_endpoints()
    
    if "student" in tester.tokens:
        tester.test_student_endpoints()
    
    if "parent" in tester.tokens:
        tester.test_parent_endpoints()
    
    # Test security
    tester.test_unauthorized_access()
    tester.test_domain_validation()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())