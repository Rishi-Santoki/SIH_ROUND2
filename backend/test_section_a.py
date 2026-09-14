import requests
import json
import sys
import os
from pprint import pprint

BASE_URL = "http://127.0.0.1:8000"
TOKENS_FILE = r"C:\Users\LENOVO\.gemini\antigravity-ide\brain\e7c20bbf-4a51-4b77-953d-b8b2b8e25e2b\scratch\tokens.json"

try:
    with open(TOKENS_FILE, "r") as f:
        tokens = json.load(f)
except Exception as e:
    print(f"Error loading tokens: {e}")
    sys.exit(1)

student_token = tokens.get("student_a")
industry_token = tokens.get("company_a")

def get_headers(token=None):
    if token:
        return {"Authorization": f"Bearer {token}"}
    return {}

def test_no_token():
    print("--- Step 1: No Token Tests ---")
    endpoints = [
        ("GET", "/auth/onboarding-status"),
        ("GET", "/auth/me"),
        ("PATCH", "/auth/me"),
        ("DELETE", "/auth/me/sessions"),
    ]
    all_passed = True
    for method, path in endpoints:
        url = f"{BASE_URL}{path}"
        res = requests.request(method, url)
        if res.status_code == 401:
            print(f"[PASS] {method} {path} correctly rejected no-token with 401")
        else:
            print(f"[FAIL] {method} {path} returned {res.status_code} instead of 401")
            all_passed = False
    return all_passed

def test_valid_token():
    print("\n--- Step 3: Valid Token Tests ---")
    all_passed = True

    # GET /auth/onboarding-status
    res = requests.get(f"{BASE_URL}/auth/onboarding-status", headers=get_headers(student_token))
    if res.status_code == 200 and "profile_complete" in res.json():
        print("[PASS] GET /auth/onboarding-status returned 200 and valid shape")
    else:
        print(f"[FAIL] GET /auth/onboarding-status failed. Status: {res.status_code}, Body: {res.text}")
        all_passed = False

    # GET /auth/me
    res = requests.get(f"{BASE_URL}/auth/me", headers=get_headers(student_token))
    if res.status_code == 200 and "full_name" in res.json():
        print("[PASS] GET /auth/me returned 200 and valid shape")
    else:
        print(f"[FAIL] GET /auth/me failed. Status: {res.status_code}, Body: {res.text}")
        all_passed = False

    # PATCH /auth/me
    res = requests.patch(f"{BASE_URL}/auth/me", headers=get_headers(student_token), json={"full_name": "Updated Name"})
    if res.status_code == 200:
        print("[PASS] PATCH /auth/me returned 200")
    else:
        print(f"[FAIL] PATCH /auth/me failed. Status: {res.status_code}, Body: {res.text}")
        all_passed = False

    # GET /auth/career-roles (Might be public or authenticated, let's test without token first?)
    # Wait, in auth.py, /career-roles has no Depends(). So it's public! But it calls `get_service_client()` which doesn't exist!
    # Ah, let's see.
    res = requests.get(f"{BASE_URL}/auth/career-roles")
    if res.status_code == 200:
        print("[PASS] GET /auth/career-roles returned 200")
    else:
        print(f"[FAIL] GET /auth/career-roles failed. Status: {res.status_code}, Body: {res.text}")
        all_passed = False
        
    res = requests.get(f"{BASE_URL}/auth/institutions", headers=get_headers(student_token))
    if res.status_code == 200:
        print("[PASS] GET /auth/institutions returned 200")
    else:
        print(f"[FAIL] GET /auth/institutions failed. Status: {res.status_code}, Body: {res.text}")
        all_passed = False

    res = requests.get(f"{BASE_URL}/auth/companies", headers=get_headers(student_token))
    if res.status_code == 200:
        print("[PASS] GET /auth/companies returned 200")
    else:
        print(f"[FAIL] GET /auth/companies failed. Status: {res.status_code}, Body: {res.text}")
        all_passed = False
        
    return all_passed

if __name__ == "__main__":
    t1 = test_no_token()
    t2 = test_valid_token()
    if t1 and t2:
        print("\n[PASS] Section A passed!")
    else:
        print("\n[FAIL] Section A failed!")
