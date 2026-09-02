from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_academician
from app.models.academician_schemas import CollaborationCreate, CollaborationUpdate, CollaborationStatusUpdate

router = APIRouter(prefix="/academician", tags=["Academician Collaborations"])

@router.post("/collaborations")
def propose_collaboration(req: CollaborationCreate, academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # If company_id is provided, enforce that the company is verified
    if req.company_id:
        comp_res = client.table("companies").select("verified").eq("company_id", req.company_id).execute()
        if not comp_res.data or not comp_res.data[0].get("verified"):
            raise HTTPException(status_code=403, detail="Company must be verified to propose a collaboration with them")
            
    insert_data = req.dict(exclude_unset=True)
    insert_data["academician_id"] = academician["user_id"]
    insert_data["status"] = "proposed"
    
    # Convert dates to ISO format string if present
    if insert_data.get("start_date"):
        insert_data["start_date"] = insert_data["start_date"].isoformat()
    if insert_data.get("end_date"):
        insert_data["end_date"] = insert_data["end_date"].isoformat()
        
    res = client.table("faculty_collaborations").insert(insert_data).execute()
    return res.data[0]

@router.get("/collaborations/mine")
def get_my_collaborations(academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # Collaborations proposed by this academician (they are the owner)
    res = client.table("faculty_collaborations").select("*").eq("academician_id", academician["user_id"]).execute()
    return res.data

@router.patch("/collaborations/{collaboration_id}")
def edit_collaboration(collaboration_id: str, req: CollaborationUpdate, academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # Check ownership and status
    collab_res = client.table("faculty_collaborations").select("academician_id, status").eq("collaboration_id", collaboration_id).execute()
    if not collab_res.data:
        raise HTTPException(status_code=404, detail="Collaboration not found")
        
    if collab_res.data[0].get("academician_id") != academician["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this collaboration")
        
    if collab_res.data[0].get("status") != "proposed":
        raise HTTPException(status_code=400, detail="Cannot edit a collaboration that is ongoing or completed")
        
    update_data = req.dict(exclude_unset=True)
    if update_data.get("start_date"):
        update_data["start_date"] = update_data["start_date"].isoformat()
    if update_data.get("end_date"):
        update_data["end_date"] = update_data["end_date"].isoformat()
        
    if not update_data:
        return {"message": "No fields to update"}
        
    res = client.table("faculty_collaborations").update(update_data).eq("collaboration_id", collaboration_id).execute()
    return res.data[0]

@router.patch("/collaborations/{collaboration_id}/status")
def update_collaboration_status(collaboration_id: str, req: CollaborationStatusUpdate, academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # Only owning academician_id or owning company can transition status. Since this is the academician router, check academician ownership.
    collab_res = client.table("faculty_collaborations").select("academician_id").eq("collaboration_id", collaboration_id).execute()
    if not collab_res.data:
        raise HTTPException(status_code=404, detail="Collaboration not found")
        
    if collab_res.data[0].get("academician_id") != academician["user_id"]:
        # Let's also check if they are the accepted applicant for it (for company-initiated ones where academician_id isn't the owner but they are the appointee?
        # Actually, if they are applied and accepted, they aren't the owner.
        # "Only the owning academician_id... may transition status - check ownership explicitly"
        raise HTTPException(status_code=403, detail="Not authorized to change status. Must be the collaboration owner.")
        
    update_dict = {"status": req.status}
    # No completion_notes field in DB schema yet, but if it existed we'd set it here.
    
    res = client.table("faculty_collaborations").update(update_dict).eq("collaboration_id", collaboration_id).execute()
    
    # Emit outcome signal here if it's completed (USP 14)
    if req.status == "completed":
        client.table("audit_logs").insert({
            "action": "collaboration_completed",
            "entity_type": "faculty_collaborations",
            "entity_id": collaboration_id,
            "performed_by": academician["user_id"]
        }).execute()
        
    return res.data[0]

@router.get("/applications")
def get_my_applications(academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # Unified view of applied collaborations.
    # We join collaboration_applications with faculty_collaborations
    res = client.table("collaboration_applications").select(
        "*, faculty_collaborations(*)"
    ).eq("academician_id", academician["user_id"]).execute()
    return res.data

@router.get("/collaborations/history")
def get_collaboration_history(academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # Read-only aggregate of completed ones
    # This includes both ones they owned and completed, and ones they applied to, were accepted, and are completed.
    
    owned = client.table("faculty_collaborations").select(
        "*, companies(name)"
    ).eq("academician_id", academician["user_id"]).eq("status", "completed").execute()
    
    applied = client.table("collaboration_applications").select(
        "*, faculty_collaborations(*, companies(name))"
    ).eq("academician_id", academician["user_id"]).eq("status", "accepted").execute()
    
    history = []
    
    for row in owned.data:
        history.append({
            "collaboration_id": row["collaboration_id"],
            "type": row["collaboration_type"],
            "title": row["title"],
            "partner": row.get("companies", {}).get("name") if row.get("companies") else "Independent",
            "duration": f"{row.get('start_date', 'N/A')} to {row.get('end_date', 'N/A')}",
            "role": "Owner"
        })
        
    for app in applied.data:
        collab = app.get("faculty_collaborations")
        if collab and collab.get("status") == "completed":
            history.append({
                "collaboration_id": collab["collaboration_id"],
                "type": collab["collaboration_type"],
                "title": collab["title"],
                "partner": collab.get("companies", {}).get("name") if collab.get("companies") else "Unknown",
                "duration": f"{collab.get('start_date', 'N/A')} to {collab.get('end_date', 'N/A')}",
                "role": "Participant"
            })
            
    # Sort by end_date (string comparison is fine for ISO dates, but handle 'N/A')
    history.sort(key=lambda x: x["duration"].split(" to ")[1], reverse=True)
    return history
