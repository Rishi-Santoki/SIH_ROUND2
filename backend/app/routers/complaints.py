from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.dependencies import get_current_user
from app.models.super_admin_schemas import ComplaintCreate

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.post("")
def submit_complaint(data: ComplaintCreate, current_user: dict = Depends(get_current_user)):
    client = current_user["client"]
    user_id = current_user["user_id"]
    
    # Validate the target entity exists
    entity_type = data.against_entity_type
    entity_id = data.against_entity_id
    
    if entity_type == "user":
        if entity_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot file complaint against yourself")
        res = client.table("users").select("user_id").eq("user_id", entity_id).execute()
    elif entity_type == "opportunity":
        res = client.table("opportunities").select("opportunity_id").eq("opportunity_id", entity_id).execute()
    elif entity_type == "company":
        res = client.table("companies").select("company_id").eq("company_id", entity_id).execute()
    elif entity_type == "institution":
        res = client.table("institutions").select("institution_id").eq("institution_id", entity_id).execute()
    elif entity_type == "assessment":
        res = client.table("assessments").select("assessment_id").eq("assessment_id", entity_id).execute()
    else:
        raise HTTPException(status_code=400, detail="Invalid entity_type")
        
    if not res.data:
        raise HTTPException(status_code=404, detail=f"Target {entity_type} not found")
        
    res = client.table("complaints").insert({
        "submitted_by": user_id,
        "against_entity_type": entity_type,
        "against_entity_id": entity_id,
        "category": data.category,
        "description": data.description,
        "status": "open"
    }).execute()
    
    return {"message": "Complaint submitted successfully", "complaint_id": res.data[0]["complaint_id"]}

@router.get("/my")
def get_my_complaints(current_user: dict = Depends(get_current_user)):
    client = current_user["client"]
    res = client.table("complaints").select("*").eq("submitted_by", current_user["user_id"]).execute()
    return res.data
