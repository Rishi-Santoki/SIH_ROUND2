from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import Optional
from app.dependencies import get_current_recruiter, require_verified_company
from app.models.industry_schemas import MilestoneCreate, MilestoneUpdate
from app.routers.industry.applications import _emit_outcome_signal

router = APIRouter(prefix="/industry", tags=["Industry Pipeline & Interns"])

@router.get("/pipeline")
def get_pipeline(opportunity_id: Optional[str] = None, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    company_id = recruiter["company_id"]
    
    query = client.table("applications").select("opportunity_id, status, opportunities!inner(company_id)").eq("opportunities.company_id", company_id)
    if opportunity_id:
        query = query.eq("opportunity_id", opportunity_id)
        
    res = query.execute()
    
    # Kanban aggregate
    kanban = {}
    for a in res.data:
        opp_id = a["opportunity_id"]
        status = a["status"]
        if opp_id not in kanban:
            kanban[opp_id] = {}
        kanban[opp_id][status] = kanban[opp_id].get(status, 0) + 1
        
    return kanban

@router.get("/pipeline/{opportunity_id}")
def get_pipeline_details(opportunity_id: str, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    company_id = recruiter["company_id"]
    
    res = client.table("applications").select("*, student_profiles(bio)").eq("opportunity_id", opportunity_id).eq("opportunities.company_id", company_id).execute()
    return res.data

@router.post("/interns/{application_id}/milestones")
def create_milestone(application_id: str, req: MilestoneCreate, recruiter: dict = Depends(require_verified_company)):
    client: Client = recruiter["client"]
    
    # Ensure selected
    app_res = client.table("applications").select("status, opportunities!inner(company_id)").eq("application_id", application_id).execute()
    if not app_res.data or app_res.data[0]["opportunities"]["company_id"] != recruiter["company_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    if app_res.data[0]["status"] != "selected":
        raise HTTPException(status_code=400, detail="Application is not in selected state")
        
    data = {
        "application_id": application_id,
        "milestone": req.milestone,
        "status": "not_started"
    }
    res = client.table("internship_tracking").insert(data).execute()
    return res.data

@router.patch("/interns/{application_id}/milestones/{tracking_id}")
def update_milestone(application_id: str, tracking_id: str, req: MilestoneUpdate, recruiter: dict = Depends(require_verified_company)):
    client: Client = recruiter["client"]
    
    # Ownership verified by RLS assuming RLS joins correctly, or verify here
    data = req.model_dump(exclude_unset=True)
    res = client.table("internship_tracking").update(data).eq("tracking_id", tracking_id).execute()
    
    if req.mentor_rating is not None:
        _emit_outcome_signal(client, application_id, "mentor_rating_recorded", {"rating": req.mentor_rating})
        
    return res.data

@router.get("/interns")
def list_interns(recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    company_id = recruiter["company_id"]
    
    # Applications where status = selected
    res = client.table("applications").select("*, internship_tracking(*), opportunities!inner(company_id)").eq("status", "selected").eq("opportunities.company_id", company_id).execute()
    return res.data
