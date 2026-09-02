from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_current_alumni

router = APIRouter(prefix="/alumni/verification", tags=["Alumni Verification"])

@router.post("")
def submit_verification_request(alumni: dict = Depends(get_current_alumni)):
    client: Client = alumni["client"]
    
    # Check if already verified
    if alumni.get("is_verified"):
        raise HTTPException(status_code=400, detail="Profile is already verified")
        
    # Check if a pending request already exists
    existing = client.table("verification_requests").select("request_id").eq("entity_type", "alumni").eq("entity_id", alumni["user_id"]).eq("status", "pending").execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="A verification request is already pending")
        
    res = client.table("verification_requests").insert({
        "entity_type": "alumni",
        "entity_id": alumni["user_id"],
        "submitted_by": alumni["user_id"],
        "status": "pending",
        "notes": "Alumni verification requested"
    }).execute()
    
    return res.data[0]

@router.get("")
def get_verification_status(alumni: dict = Depends(get_current_alumni)):
    client: Client = alumni["client"]
    
    res = client.table("verification_requests").select("*").eq("entity_type", "alumni").eq("entity_id", alumni["user_id"]).order("created_at", desc=True).limit(1).execute()
    if not res.data:
        return {"status": "none"}
        
    return res.data[0]
