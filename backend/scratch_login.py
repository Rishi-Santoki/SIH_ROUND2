import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

try:
    res = supabase.auth.sign_in_with_password({"email": "aarav.patel@ldrp.test", "password": "password123"})
    print("Login success.")
    # Try fetching profile
    supabase.postgrest.auth(res.session.access_token)
    prof = supabase.table("student_profiles").select("*").execute()
    print("Profile count:", len(prof.data))
except Exception as e:
    print("Login failed:", e)
