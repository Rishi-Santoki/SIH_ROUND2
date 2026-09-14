import os
import sys
import httpx
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
supabase_key = os.environ.get("SUPABASE_ANON_KEY")

if not supabase_key:
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(supabase_url, supabase_key)

API_BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("Logging in as Aarav Patel...")
    res = supabase.auth.sign_in_with_password({
        "email": "aarav.patel@ldrp.test",
        "password": "Test@12345"
    })
    token = res.session.access_token
    user_id = res.user.id
    
    headers = {
        "Authorization": f"Bearer {token}"
    }

    # Test 1.1: View profile
    print("\n--- 1. Profile & Onboarding ---")
    resp = httpx.get(f"{API_BASE_URL}/api/student/profile", headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        print(f"1.1 Profile loaded. Name: {data.get('full_name')}, Role: {data.get('target_role')}")
    else:
        print(f"1.1 Failed: {resp.status_code} {resp.text}")

if __name__ == "__main__":
    run_tests()
