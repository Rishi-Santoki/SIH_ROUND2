from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_academician
from app.models.academician_schemas import AcademicianProfileUpdate, ExpertiseUpdate

router = APIRouter(prefix="/academician", tags=["Academician Profile"])

@router.get("/profile")
def get_profile(academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    res = client.table("users").select(
        "user_id, email, full_name, phone_number, academician_profiles(*)"
    ).eq("user_id", academician["user_id"]).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    return res.data[0]

@router.post("/profile/onboarding")
def onboard_profile(academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # Reject if already exists
    existing = client.table("academician_profiles").select("academician_id").eq("academician_id", academician["user_id"]).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Profile already exists")
        
    # Insert blank profile (institution_id must be updated by Super Admin per specs)
    res = client.table("academician_profiles").insert({
        "academician_id": academician["user_id"]
    }).execute()
    return res.data[0]

@router.patch("/profile")
def update_profile(update_data: AcademicianProfileUpdate, academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    update_dict = update_data.dict(exclude_unset=True)
    if not update_dict:
        return {"message": "No fields to update"}
        
    res = client.table("academician_profiles").update(update_dict).eq("academician_id", academician["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@router.put("/expertise")
def update_expertise(update_data: ExpertiseUpdate, academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # Validate each entry against skills.skill_id if it's a UUID, else accept as free-text
    import uuid
    for entry in update_data.expertise_areas:
        try:
            val = uuid.UUID(entry)
            # It's a UUID, check if it exists in skills table
            skill_res = client.table("skills").select("skill_id").eq("skill_id", str(val)).execute()
            if not skill_res.data:
                raise HTTPException(status_code=400, detail=f"Skill ID {entry} not found in skills taxonomy")
        except ValueError:
            # Not a UUID, treated as free text
            pass
            
    res = client.table("academician_profiles").update({
        "expertise_areas": update_data.expertise_areas
    }).eq("academician_id", academician["user_id"]).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]
