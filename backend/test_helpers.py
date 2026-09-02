import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # admin key
API_URL = "http://127.0.0.1:8000"

admin_supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_token(email, password="password123"):
    res = admin_supabase.auth.sign_in_with_password({"email": email, "password": password})
    return res.session.access_token

def create_user(email, role, full_name="Test User", password="password123"):
    try:
        user_res = admin_supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        user_id = user_res.user.id
        admin_supabase.table("users").update({"role": role, "full_name": full_name}).eq("user_id", user_id).execute()
        return user_id, get_token(email, password)
    except Exception as e:
        print(f"User {email} probably exists: {e}")
        user = admin_supabase.table("users").select("user_id").eq("email", email).execute().data[0]
        user_id = user["user_id"]
        admin_supabase.table("users").update({"role": role, "full_name": full_name}).eq("user_id", user_id).execute()
        return user_id, get_token(email, password)

def create_institution(name):
    res = admin_supabase.table("institutions").insert({"name": name, "domain": f"{name.lower()}.edu", "verification_status": "verified"}).execute()
    return res.data[0]["institution_id"]

def create_company(name, verified=True):
    res = admin_supabase.table("companies").insert({"name": name, "domain": f"{name.lower()}.com", "verified": verified}).execute()
    return res.data[0]["company_id"]

def create_skill(name):
    res = admin_supabase.table("skills").insert({"name": name, "category": "technical"}).execute()
    return res.data[0]["skill_id"]

def create_career_role(title):
    res = admin_supabase.table("career_roles").insert({"title": title}).execute()
    return res.data[0]["career_role_id"]
