from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client
from app.dependencies import get_current_alumni, get_authenticated_user
from app.models.alumni_schemas import AlumniProfileOnboarding, AlumniProfileUpdate

router = APIRouter(prefix="/alumni/profile", tags=["Alumni Profile"])

@router.post("/onboarding")
def onboard_alumni_profile(profile: AlumniProfileOnboarding, user: dict = Depends(get_authenticated_user)):
    if user["role"] != "alumni":
        raise HTTPException(status_code=403, detail="Only alumni can create an alumni profile")
        
    client: Client = user["client"]
    
    # Check if already onboarded
    existing = client.table("alumni_profiles").select("alumni_id").eq("alumni_id", user["user_id"]).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Profile already exists")
        
    data = profile.model_dump(exclude_unset=True)
    data["alumni_id"] = user["user_id"]
    data["is_verified"] = False # Unconditionally false at creation
    
    res = client.table("alumni_profiles").insert(data).execute()
    return res.data[0]

@router.get("")
def get_my_profile(alumni: dict = Depends(get_current_alumni)):
    client: Client = alumni["client"]
    res = client.table("alumni_profiles").select("*").eq("alumni_id", alumni["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@router.patch("")
async def update_my_profile(request: Request, update: AlumniProfileUpdate, alumni: dict = Depends(get_current_alumni)):
    # Check for forbidden fields in raw request payload to provide clear errors
    body = await request.json()
    forbidden_fields = {"alumni_id", "role", "institution_id", "is_verified"}
    for field in forbidden_fields:
        if field in body:
            raise HTTPException(status_code=400, detail=f"Cannot update restricted field: {field}")
            
    client: Client = alumni["client"]
    data = update.model_dump(exclude_unset=True)
    
    if not data:
        return {"message": "No fields to update"}
        
    data["updated_at"] = "now()"
    res = client.table("alumni_profiles").update(data).eq("alumni_id", alumni["user_id"]).execute()
    return res.data[0]
