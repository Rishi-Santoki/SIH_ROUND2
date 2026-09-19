from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_authenticated_user, get_db_client, get_service_client

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/onboarding-status")
def get_onboarding_status(user: dict = Depends(get_authenticated_user)):
    client: Client = user["client"]
    role = user["role"]
    user_id = user["user_id"]
    
    profile_complete = False
    
    if role == "student":
        res = client.table("student_profiles").select("student_id").eq("student_id", user_id).execute()
        profile_complete = len(res.data) > 0
    elif role == "industry":
        res = client.table("recruiter_profiles").select("recruiter_id").eq("recruiter_id", user_id).execute()
        profile_complete = len(res.data) > 0
    elif role == "academician":
        res = client.table("academician_profiles").select("academician_id").eq("academician_id", user_id).execute()
        profile_complete = len(res.data) > 0
    elif role == "institution":
        res = client.table("institution_admins").select("admin_id").eq("admin_id", user_id).execute()
        profile_complete = len(res.data) > 0
    elif role == "alumni":
        res = client.table("alumni_profiles").select("alumni_id").eq("alumni_id", user_id).execute()
        profile_complete = len(res.data) > 0
    elif role == "super_admin":
        profile_complete = True # Super admins don't have a separate profile to onboard
        
    return {
        "role": role,
        "profile_complete": profile_complete
    }

@router.delete("/me/sessions")
def revoke_sessions(auth=Depends(get_authenticated_user)):
    """Revoke all refresh tokens for the current user (log out everywhere)."""
    client = get_service_client()
    # The GoTrue admin API doesn't expose a direct 'revoke all' endpoint easily via the python client.
    # We can delete from auth.refresh_tokens but it's risky. 
    # A safer proxy in a custom flow is to bump the user's `updated_at` or let frontend clear local tokens.
    # We'll return 501 Not Implemented for now.
    raise HTTPException(status_code=501, detail="Session revocation requires Super Admin API or direct auth.refresh_tokens access")

@router.get("/career-roles")
def list_active_career_roles():
    """Generic endpoint for dropdowns to list active career roles."""
    client = get_service_client()
    res = client.table("career_roles").select("career_role_id, title, category, description").execute()
    return res.data

@router.get("/me")
def get_me(user: dict = Depends(get_authenticated_user)):
    # Re-use the onboarding check logic
    status = get_onboarding_status(user)
    profile_complete = status["profile_complete"]
    role = user["role"]
    
    dashboard_route = None
    if not profile_complete:
        if role == "student":
            dashboard_route = "/onboarding/student"
        elif role == "industry":
            dashboard_route = "/onboarding/industry"
        elif role == "academician":
            dashboard_route = "/onboarding/academician"
        elif role == "institution":
            dashboard_route = "/onboarding/institution"
        elif role == "alumni":
            dashboard_route = "/onboarding/alumni"
    else:
        if role == "student":
            dashboard_route = "/student/dashboard"
        elif role == "industry":
            dashboard_route = "/industry/dashboard"
        elif role == "academician":
            dashboard_route = "/academician/dashboard"
        elif role == "institution":
            dashboard_route = "/institution/dashboard"
        elif role == "alumni":
            dashboard_route = "/alumni/dashboard"
        elif role == "super_admin":
            dashboard_route = "/admin/dashboard"

    return {
        "user_id": user["user_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": role,
        "is_active": user["is_active"],
        "onboarding_complete": profile_complete,
        "dashboard_route": dashboard_route
    }

@router.get("/institutions")
def get_institutions(client: Client = Depends(get_db_client)):
    # Public (or at-least-authenticated-any-role) unauthenticated-safe list
    res = client.table("institutions").select("institution_id, name, city, state").execute()
    return res.data

@router.get("/companies")
def get_companies(client: Client = Depends(get_db_client)):
    # Public (or at-least-authenticated-any-role) unauthenticated-safe list
    res = client.table("companies").select("company_id, name, industry_type, location").execute()
    return res.data

from app.models.auth_schemas import UserUpdate, RegisterRequest
from pydantic import BaseModel

class ConfirmAccountRequest(BaseModel):
    email: str

@router.post("/register")
def register_user(req: RegisterRequest):
    email = req.email.strip().lower()
    password = req.password
    full_name = req.full_name.strip()
    role = req.role.strip().lower()
    
    if role not in ["student", "industry", "academician", "institution", "alumni", "super_admin"]:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}")
    
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
    service_client = get_service_client()
    
    try:
        user_res = service_client.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name,
                "role": role
            }
        })
        user_id = str(user_res.user.id)
    except Exception as e:
        err_msg = str(e)
        if "already registered" in err_msg.lower() or "already exists" in err_msg.lower():
            try:
                u_res = service_client.table("users").select("user_id").eq("email", email).execute()
                if u_res.data:
                    u_id = u_res.data[0]["user_id"]
                    service_client.auth.admin.update_user_by_id(u_id, {
                        "password": password,
                        "email_confirm": True,
                        "user_metadata": {"full_name": full_name, "role": role}
                    })
                    user_id = u_id
                else:
                    raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")
        else:
            raise HTTPException(status_code=400, detail=f"Registration failed: {err_msg}")

    # Ensure user is in public.users
    try:
        service_client.table("users").upsert({
            "user_id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "is_active": True
        }).execute()
    except Exception:
        pass

    # Initialize role-specific profile so their dashboard opens with clean initial state
    try:
        if role == "student":
            st_check = service_client.table("student_profiles").select("student_id").eq("student_id", user_id).execute()
            if not st_check.data:
                service_client.table("student_profiles").insert({
                    "student_id": user_id,
                    "department": "Engineering",
                    "current_year": 1,
                    "cgpa": 0.0,
                    "graduation_year": 2028,
                    "target_career_id": None,
                    "institution_id": None
                }).execute()
        elif role == "industry":
            rec_check = service_client.table("recruiter_profiles").select("recruiter_id").eq("recruiter_id", user_id).execute()
            if not rec_check.data:
                comp_res = service_client.table("companies").select("company_id").limit(1).execute()
                comp_id = comp_res.data[0]["company_id"] if comp_res.data else None
                service_client.table("recruiter_profiles").insert({
                    "recruiter_id": user_id,
                    "company_id": comp_id,
                    "title": "Talent Acquisition Specialist"
                }).execute()
        elif role == "academician":
            acad_check = service_client.table("academician_profiles").select("academician_id").eq("academician_id", user_id).execute()
            if not acad_check.data:
                inst_res = service_client.table("institutions").select("institution_id").limit(1).execute()
                inst_id = inst_res.data[0]["institution_id"] if inst_res.data else None
                service_client.table("academician_profiles").insert({
                    "academician_id": user_id,
                    "institution_id": inst_id,
                    "department": "Computer Science & Engineering",
                    "designation": "Assistant Professor"
                }).execute()
        elif role == "institution":
            inst_check = service_client.table("institution_admins").select("admin_id").eq("admin_id", user_id).execute()
            if not inst_check.data:
                inst_res = service_client.table("institutions").select("institution_id").limit(1).execute()
                inst_id = inst_res.data[0]["institution_id"] if inst_res.data else None
                service_client.table("institution_admins").insert({
                    "admin_id": user_id,
                    "institution_id": inst_id
                }).execute()
        elif role == "alumni":
            alumni_check = service_client.table("alumni_profiles").select("alumni_id").eq("alumni_id", user_id).execute()
            if not alumni_check.data:
                inst_res = service_client.table("institutions").select("institution_id").limit(1).execute()
                inst_id = inst_res.data[0]["institution_id"] if inst_res.data else None
                service_client.table("alumni_profiles").insert({
                    "alumni_id": user_id,
                    "institution_id": inst_id,
                    "current_company": "Tech Innovations Ltd.",
                    "current_role": "Software Engineer",
                    "graduation_year": 2023,
                    "verification_status": "verified"
                }).execute()
    except Exception:
        pass

    return {
        "status": "success",
        "user_id": user_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "message": "Account created successfully"
    }

@router.post("/confirm-account")
def confirm_user_account(req: ConfirmAccountRequest):
    email = req.email.strip().lower()
    service_client = get_service_client()
    try:
        u_res = service_client.table("users").select("user_id").eq("email", email).execute()
        if u_res.data:
            u_id = u_res.data[0]["user_id"]
            service_client.auth.admin.update_user_by_id(u_id, {"email_confirm": True})
            return {"status": "success", "message": "Email confirmed"}
        return {"status": "not_found"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.patch("/me")
def update_me(update: UserUpdate, user: dict = Depends(get_authenticated_user), client: Client = Depends(get_db_client)):
    data = update.model_dump(exclude_unset=True)
    if "profile_image" in data:
        from app.services.storage_service import delete_file
        res = client.table("users").select("profile_image").eq("user_id", user["user_id"]).execute()
        if res.data and res.data[0].get("profile_image"):
            old_url = res.data[0]["profile_image"]
            if old_url != data["profile_image"]:
                delete_file(client, "profile-images", old_url)
                
    if not data:
        return {"message": "No fields to update"}
        
    res = client.table("users").update(data).eq("user_id", user["user_id"]).execute()
    return res.data

