from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_current_recruiter
from app.models.industry_schemas import RecruiterProfileUpdate

router = APIRouter(prefix="/industry/profile", tags=["Industry Profile"])

@router.get("")
def get_profile(recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    res = client.table("recruiter_profiles").select("*, companies(name)").eq("recruiter_id", recruiter["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@router.patch("")
def update_profile(update: RecruiterProfileUpdate, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    data = update.model_dump(exclude_unset=True)
    res = client.table("recruiter_profiles").update(data).eq("recruiter_id", recruiter["user_id"]).execute()
    return res.data

from app.models.industry_schemas import IndustryOnboarding
from app.dependencies import get_db_client, get_authenticated_user

@router.post("/onboarding")
def onboard_industry(data: IndustryOnboarding, user: dict = Depends(get_authenticated_user), client: Client = Depends(get_db_client)):
    if user["role"] != "industry":
        raise HTTPException(status_code=403, detail="Not authorized as industry")
        
    existing = client.table("recruiter_profiles").select("recruiter_id").eq("recruiter_id", user["user_id"]).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Profile already exists")
        
    company_id = data.company_id
    is_primary = False
    
    if data.new_company_name:
        # Create new company
        c_res = client.table("companies").insert({"name": data.new_company_name}).execute()
        company_id = c_res.data[0]["company_id"]
        is_primary = True # First recruiter is primary
        
    if not company_id:
        raise HTTPException(status_code=400, detail="Must provide company_id or new_company_name")
        
    # Create profile
    res = client.table("recruiter_profiles").insert({
        "recruiter_id": user["user_id"],
        "company_id": str(company_id),
        "designation": data.designation,
        "is_primary_contact": is_primary
    }).execute()
    
    return res.data
