from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_student
from app.models.schemas import ProfileUpdate, TargetRoleUpdate

router = APIRouter(prefix="/student/profile", tags=["Profile"])

@router.get("")
def get_profile(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # Join users and student_profiles
    res = client.table("users").select("*, student_profiles(*)").eq("user_id", student["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@router.patch("")
def update_profile(update_data: ProfileUpdate, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    data = update_data.model_dump(exclude_unset=True)
    if "student_id" in data or "institution_id" in data or "role" in data:
        raise HTTPException(status_code=400, detail="Cannot update protected fields")
        
    if "resume_url" in data:
        from app.services.storage_service import delete_file
        res = client.table("student_profiles").select("resume_url").eq("student_id", student["user_id"]).execute()
        if res.data and res.data[0].get("resume_url"):
            old_url = res.data[0]["resume_url"]
            if old_url != data["resume_url"]:
                # Use service_role or DB client? delete_file uses the client. The db_client acts as the user, which is correct for their own files.
                delete_file(client, "resumes", old_url)
    
    res = client.table("student_profiles").update(data).eq("student_id", student["user_id"]).execute()
    return res.data

@router.post("/onboarding")
def onboard_profile(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # Check if exists
    existing = client.table("student_profiles").select("student_id").eq("student_id", student["user_id"]).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    # Create profile
    res = client.table("student_profiles").insert({"student_id": student["user_id"]}).execute()
    return res.data

@router.get("/target-role")
def get_target_role(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("student_profiles").select("target_career_id").eq("student_id", student["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return {"target_career_id": res.data[0].get("target_career_id")}

@router.put("/target-role")
def set_target_role(update: TargetRoleUpdate, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # Verify career role exists
    cr = client.table("career_roles").select("career_role_id").eq("career_role_id", str(update.target_career_id)).execute()
    if not cr.data:
        raise HTTPException(status_code=404, detail="Career role not found")
        
    client.table("student_profiles").update({"target_career_id": str(update.target_career_id)}).eq("student_id", student["user_id"]).execute()
    return {"status": "success"}
