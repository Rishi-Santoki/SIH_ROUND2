from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_authenticated_user
from app.core.config import get_settings
from supabase import create_client
import uuid
from typing import Dict, Any, Callable

# Initialize Service Client to bypass RLS for seeding and setup
settings = get_settings()
service_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Mocked User States
USERS = {
    "student_A": {"user_id": "ff5b5a14-0020-4b70-ba19-f159519bc2d6", "role": "student", "is_active": True, "email": "student_A@test.com", "full_name": "Student A"},
    "student_B": {"user_id": "ba43ac14-4372-4de5-ab78-53dcfd8a7df6", "role": "student", "is_active": True, "email": "student_B@test.com", "full_name": "Student B"},
    "company_A": {"user_id": "c7fa1efc-356c-4cd9-bdfd-9c9bba6542a8", "role": "industry", "is_active": True, "email": "comp_A@test.com", "company_id": str(uuid.uuid4()), "full_name": "Comp A"},
    "company_B": {"user_id": "bc71d4b4-3086-4cc6-82ad-6689ef1857d6", "role": "industry", "is_active": True, "email": "comp_B@test.com", "company_id": str(uuid.uuid4()), "full_name": "Comp B"},
    "academician_A": {"user_id": "01aa7e7a-af0d-4c77-9fb9-90724c9012e8", "role": "academician", "is_active": True, "email": "acad_A@test.com", "institution_id": str(uuid.uuid4()), "full_name": "Acad A"},
    "institution_A": {"user_id": "2a055ce2-eb55-4f6d-b82d-6f4e2a327f27", "role": "institution", "is_active": True, "email": "inst_A@test.com", "institution_id": str(uuid.uuid4()), "full_name": "Inst A"},
    "alumni_A1": {"user_id": str(uuid.uuid4()), "role": "alumni", "is_active": True, "email": "alum_A1@test.com", "institution_id": "inst_A_id", "is_verified": True, "full_name": "Alum A1"},
    "alumni_A2": {"user_id": str(uuid.uuid4()), "role": "alumni", "is_active": True, "email": "alum_A2@test.com", "institution_id": "inst_A_id", "is_verified": False, "full_name": "Alum A2"},
    "alumni_B1": {"user_id": str(uuid.uuid4()), "role": "alumni", "is_active": True, "email": "alum_B1@test.com", "institution_id": "inst_B_id", "is_verified": True, "full_name": "Alum B1"},
    "super_admin": {"user_id": "66ccdbac-21e4-4128-bb78-6ea56404b364", "role": "super_admin", "is_active": True, "email": "admin@test.com", "full_name": "Admin"}
}
# Fixup alumni institution IDs to match institution_A where necessary
USERS["alumni_A1"]["institution_id"] = USERS["institution_A"]["institution_id"]
USERS["alumni_A2"]["institution_id"] = USERS["institution_A"]["institution_id"]

def mock_get_authenticated_user(user_key: str):
    def _mock():
        if user_key not in USERS:
            # Simulate invalid token
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        u = USERS[user_key].copy()
        # Attach service client so DB calls don't fail due to RLS since we aren't signing actual Supabase JWTs
        u["client"] = service_client 
        u["token"] = f"mock_{user_key}"
        return u
    return _mock

client = TestClient(app)

def run_4_step_test(method: str, path: str, required_role: str, valid_payload: Dict[str, Any] = None, path_params: Dict[str, str] = None, cross_tenant_params: Dict[str, str] = None, query_params: str = ""):
    print(f"\n--- Testing {method} {path} ---")
    
    # Identify correct user and wrong role user
    correct_user_key = None
    wrong_role_user_key = None
    
    if required_role == "ANY":
        correct_user_key = "student_A"
        wrong_role_user_key = None
    else:
        for k, v in USERS.items():
            if v["role"] == required_role:
                correct_user_key = k
            elif v["role"] != required_role and v["role"] not in ["super_admin"]:
                wrong_role_user_key = k
            
    if not correct_user_key:
        print(f"[FAIL] Could not find test user with role {required_role}")
        return False
        
    resolved_path = path
    cross_tenant_path = path
    if path_params:
        for k, v in path_params.items():
            resolved_path = resolved_path.replace(f"{{{k}}}", str(v))
    if cross_tenant_params:
        for k, v in cross_tenant_params.items():
            cross_tenant_path = cross_tenant_path.replace(f"{{{k}}}", str(v))
            
    if query_params:
        resolved_path += query_params
    from app.dependencies import get_db_client
    from unittest.mock import patch
    
    with patch("app.routers.auth.get_onboarding_status", return_value={"profile_complete": True, "requires_verification": False}):
         
        # 1. No token -> expect 401
        app.dependency_overrides = {} # Remove overrides
        req_kwargs = {"url": resolved_path}
        if valid_payload and method in ["POST", "PUT", "PATCH"]:
            req_kwargs["json"] = valid_payload
            
        res1 = getattr(client, method.lower())(**req_kwargs)
        if res1.status_code not in (401, 403): # Sometimes dependency throws 403 instead of 401
            print(f"[FAIL] Step 1 (No token) failed. Expected 401/403, got {res1.status_code}")
            return False
        print("[PASS] Step 1 (No token) passed")
    
        # 2. Wrong-role token -> expect 403
        if required_role != "ANY":
            app.dependency_overrides[get_authenticated_user] = mock_get_authenticated_user(wrong_role_user_key)
            app.dependency_overrides[get_db_client] = lambda: service_client
            res2 = getattr(client, method.lower())(**req_kwargs)
            if res2.status_code != 403:
                print(f"[FAIL] Step 2 (Wrong role '{USERS[wrong_role_user_key]['role']}') failed. Expected 403, got {res2.status_code} - Response: {res2.text}")
                return False
            print("[PASS] Step 2 (Wrong role) passed")
        else:
            print("[SKIP] Step 2 (Wrong role) skipped for ANY role")
    
        # 3. Valid token -> expect 200/201
        # If required_role is ANY, just use student_A as the valid user
        valid_user_key = correct_user_key if correct_user_key else "student_A"
        app.dependency_overrides[get_authenticated_user] = mock_get_authenticated_user(valid_user_key)
        app.dependency_overrides[get_db_client] = lambda: service_client
        res3 = getattr(client, method.lower())(**req_kwargs)
        if res3.status_code not in (200, 201, 204):
            print(f"[FAIL] Step 3 (Valid token) failed. Expected 20X, got {res3.status_code} - Response: {res3.text}")
            return False
        print(f"[PASS] Step 3 (Valid token) passed with {res3.status_code}")
    
        # 4. Cross-tenant authz check
        if cross_tenant_params and path_params:
            req_kwargs_cross = {"url": cross_tenant_path}
            if valid_payload and method in ["POST", "PUT", "PATCH"]:
                req_kwargs_cross["json"] = valid_payload
            res4 = getattr(client, method.lower())(**req_kwargs_cross)
            if res4.status_code not in (403, 404, 401):
                print(f"[FAIL] Step 4 (Cross-tenant check) failed. Expected 403/404, got {res4.status_code} - Response: {res4.text}")
                return False
            print("[PASS] Step 4 (Cross-tenant check) passed")
            
        return True

if __name__ == "__main__":
    # Section A
    print("\n\n" + "="*40 + "\nSECTION A: Auth\n" + "="*40)
    # 1. GET /auth/me
    run_4_step_test("GET", "/auth/me", required_role="ANY")
    # 2. GET /auth/onboarding-status
    run_4_step_test("GET", "/auth/onboarding-status", required_role="ANY")
    # 3. GET /auth/institutions
    run_4_step_test("GET", "/auth/institutions", required_role="ANY")
    # 4. GET /auth/companies
    run_4_step_test("GET", "/auth/companies", required_role="ANY")
    
    print("\nNOTE: POST /auth/register/complete was skipped as Path A (trigger-based DB trigger) is used instead.")
    
    # Section B: Student Core
    print("\n\n" + "="*40 + "\nSECTION B: Student Core\n" + "="*40)
    
    # Profile
    run_4_step_test("GET", "/student/profile", required_role="student", 
                    cross_tenant_params={"student_id": "other-student-id"})
                    
    run_4_step_test("PATCH", "/student/profile", required_role="student",
                    valid_payload={"current_semester": 5})
                    
    run_4_step_test("POST", "/student/profile/onboarding", required_role="student",
                    valid_payload={"degree": "B.Tech", "major": "Computer Science", "graduation_year": 2026, "current_semester": 4, "cgpa": 8.5})
                    
    run_4_step_test("GET", "/student/profile/target-role", required_role="student")
    
    dummy_uuid = str(uuid.uuid4())
    
    # Get some valid IDs from DB
    careers = service_client.table("career_roles").select("id").limit(1).execute()
    valid_career_id = careers.data[0]["id"] if careers.data else dummy_uuid
    
    skills = service_client.table("skills").select("id").limit(1).execute()
    valid_skill_id = skills.data[0]["id"] if skills.data else dummy_uuid
    
    progs = service_client.table("learning_programs").select("id").limit(1).execute()
    valid_prog_id = progs.data[0]["id"] if progs.data else dummy_uuid
    
    opps = service_client.table("opportunities").select("id").limit(1).execute()
    valid_opp_id = opps.data[0]["id"] if opps.data else dummy_uuid
    
    apps = service_client.table("applications").select("id").limit(1).execute()
    valid_app_id = apps.data[0]["id"] if apps.data else dummy_uuid
    
    notifs = service_client.table("notifications").select("id").limit(1).execute()
    valid_notif_id = notifs.data[0]["id"] if notifs.data else dummy_uuid

    run_4_step_test("PUT", "/student/profile/target-role", required_role="student",
                    valid_payload={"target_career_id": valid_career_id})
                    
    # Skills
    run_4_step_test("GET", "/student/skills", required_role="student")
    run_4_step_test("POST", "/student/skills", required_role="student",
                    valid_payload={"skill_id": valid_skill_id, "proficiency_level": 1})
    run_4_step_test("GET", "/student/skills/dna/{skill_id}", required_role="student",
                    path_params={"skill_id": valid_skill_id})
    run_4_step_test("GET", "/student/skill-gap", required_role="student")
    run_4_step_test("GET", "/student/skill-gap/summary", required_role="student")
    
    # Career Digital Twin & Roadmap
    run_4_step_test("GET", "/student/career-digital-twin", required_role="student")
    run_4_step_test("GET", "/student/career-roadmap", required_role="student")
    
    # Learning Progress
    run_4_step_test("GET", "/student/learning-progress/recommendations", required_role="student")
    run_4_step_test("POST", "/student/learning-progress", required_role="student",
                    valid_payload={"learning_program_id": valid_prog_id})
    run_4_step_test("PATCH", "/student/learning-progress/{progress_id}", required_role="student",
                    path_params={"progress_id": dummy_uuid}, valid_payload={"status": "completed", "completion_percentage": 100})
    run_4_step_test("GET", "/student/learning-progress", required_role="student")
    
    # Opportunities & Applications
    run_4_step_test("GET", "/student/opportunities/recommended", required_role="student")
    run_4_step_test("POST", "/student/applications", required_role="student",
                    valid_payload={"opportunity_id": valid_opp_id})
    run_4_step_test("GET", "/student/applications", required_role="student")
    run_4_step_test("GET", "/student/applications/{application_id}", required_role="student",
                    path_params={"application_id": valid_app_id})
                    
    # Portfolio
    run_4_step_test("POST", "/student/portfolio/projects", required_role="student",
                    valid_payload={"title": "Test Project", "description": "Desc"})
    run_4_step_test("GET", "/student/portfolio/projects", required_role="student")
    run_4_step_test("POST", "/student/portfolio/certifications", required_role="student",
                    valid_payload={"title": "Test Cert", "issuer": "Test Issuer"})
    run_4_step_test("GET", "/student/portfolio/certifications", required_role="student")
    
    # Notifications & Copilot
    run_4_step_test("GET", "/student/notifications", required_role="student")
    run_4_step_test("PATCH", "/student/notifications/{notification_id}/read", required_role="student",
                    path_params={"notification_id": valid_notif_id})
    run_4_step_test("POST", "/student/copilot", required_role="student",
                    valid_payload={"message": "Hello"})
    run_4_step_test("GET", "/student/copilot/history", required_role="student")
