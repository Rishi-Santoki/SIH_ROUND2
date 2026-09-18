from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_current_alumni

router = APIRouter(prefix="/alumni/verification", tags=["Alumni Verification"])

from pydantic import BaseModel
from typing import Optional

class AlumniVerificationSubmit(BaseModel):
    graduation_year: Optional[str] = None
    roll_number: Optional[str] = None
    document_name: Optional[str] = None
    notes: Optional[str] = None

@router.post("")
def submit_verification_request(req: Optional[AlumniVerificationSubmit] = None, alumni: dict = Depends(get_current_alumni)):
    client: Client = alumni["client"]
    
    # Check if already verified
    if alumni.get("is_verified"):
        raise HTTPException(status_code=400, detail="Profile is already verified")
        
    # Check if a pending request already exists
    existing = client.table("verification_requests").select("request_id").eq("entity_type", "alumni").eq("entity_id", alumni["user_id"]).eq("status", "pending").execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="A verification request is already pending")
        
    notes_str = "Alumni verification requested"
    if req:
        parts = []
        if req.graduation_year: parts.append(f"Grad Year: {req.graduation_year}")
        if req.roll_number: parts.append(f"Roll No: {req.roll_number}")
        if req.document_name: parts.append(f"Document: {req.document_name}")
        if req.notes: parts.append(req.notes)
        if parts:
            notes_str = " | ".join(parts)

    res = client.table("verification_requests").insert({
        "entity_type": "alumni",
        "entity_id": alumni["user_id"],
        "submitted_by": alumni["user_id"],
        "status": "pending",
        "notes": notes_str
    }).execute()
    
    return res.data[0]

@router.get("")
def get_verification_status(alumni: dict = Depends(get_current_alumni)):
    client: Client = alumni["client"]
    is_verified = bool(alumni.get("is_verified"))
    
    res = client.table("verification_requests").select("*").eq("entity_type", "alumni").eq("entity_id", alumni["user_id"]).order("created_at", desc=True).limit(1).execute()
    if not res.data:
        return {"status": "approved" if is_verified else "none", "is_verified": is_verified}
        
    data = res.data[0]
    data["is_verified"] = is_verified
    return data
