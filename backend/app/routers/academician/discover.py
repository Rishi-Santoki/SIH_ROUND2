from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import Optional
from app.dependencies import get_db_client, get_current_academician

router = APIRouter(prefix="/academician/collaborations", tags=["Academician Discover"])

@router.get("/available")
def get_available_collaborations(
    collaboration_type: Optional[str] = Query(None),
    academician: dict = Depends(get_current_academician), 
    client: Client = Depends(get_db_client)
):
    query = client.table("faculty_collaborations").select(
        "*, companies(verified)"
    ).eq("status", "proposed")
    
    if collaboration_type:
        query = query.eq("collaboration_type", collaboration_type)
        
    res = query.execute()
    
    # Filter verified companies in memory (since Supabase select with joined filtering is tricky via python SDK)
    available = []
    for row in res.data:
        # If there's a company, it must be verified
        if row.get("company_id") and row.get("companies") and not row["companies"].get("verified"):
            continue
        available.append(row)
        
    return available

@router.get("/recommended")
def get_recommended_collaborations(academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # Fetch available
    available = get_available_collaborations(None, academician, client)
    if not available:
        return []
        
    # Fetch academician's expertise
    prof_res = client.table("academician_profiles").select("expertise_areas").eq("academician_id", academician["user_id"]).execute()
    expertise_areas = prof_res.data[0].get("expertise_areas", []) if prof_res.data else []
    expertise_lower = [e.lower() for e in expertise_areas]
    
    # Rank by overlap
    # We'll check how many expertise tags appear in title or description or match the collaboration_type
    def score_collab(collab):
        score = 0
        text_to_search = (collab.get("title", "") + " " + collab.get("description", "") + " " + collab.get("collaboration_type", "")).lower()
        for e in expertise_lower:
            if e in text_to_search:
                score += 1
        return score

    available.sort(key=score_collab, reverse=True)
    return available

@router.get("/{collaboration_id}")
def get_collaboration(collaboration_id: str, academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    res = client.table("faculty_collaborations").select("*").eq("collaboration_id", collaboration_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    return res.data[0]

@router.post("/{collaboration_id}/apply")
def apply_collaboration(collaboration_id: str, academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # Check if exists and is proposed
    collab_res = client.table("faculty_collaborations").select("academician_id, status").eq("collaboration_id", collaboration_id).execute()
    if not collab_res.data:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    
    collab = collab_res.data[0]
    if collab.get("status") != "proposed":
        raise HTTPException(status_code=400, detail="Collaboration is not in proposed status")
        
    # Check if this is a single-academician one without an applicant list (where academician_id is NULL)
    # The requirement says:
    # "if academician_id on the row is null, claiming it sets academician_id = auth.uid() and status = 'ongoing' directly"
    # "if multiple academicians can apply... add a lightweight collaboration_applications table"
    # We added collaboration_applications in Migration 12.
    # We will always insert into applications to support multiple.
    
    # Verify no double apply
    existing = client.table("collaboration_applications").select("application_id").eq("collaboration_id", collaboration_id).eq("academician_id", academician["user_id"]).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Already applied")
        
    res = client.table("collaboration_applications").insert({
        "collaboration_id": collaboration_id,
        "academician_id": academician["user_id"],
        "status": "applied"
    }).execute()
    
    return res.data[0]
