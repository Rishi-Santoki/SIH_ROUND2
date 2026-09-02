from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_authenticated_user, get_db_client

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
    res = client.table("career_roles").select("career_role_id, title, category, description").eq("is_active", True).execute()
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
    else:
        if role == "student":
            dashboard_route = "/student/dashboard"
        elif role == "industry":
            dashboard_route = "/industry/dashboard"
        elif role == "academician":
            dashboard_route = "/academician/dashboard"
        elif role == "institution":
            dashboard_route = "/institution/dashboard"
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

from app.models.auth_schemas import UserUpdate

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
