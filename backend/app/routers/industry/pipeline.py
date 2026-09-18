import uuid
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import Optional
from app.dependencies import get_current_recruiter, require_verified_company
from app.models.industry_schemas import MilestoneCreate, MilestoneUpdate
from app.routers.industry.applications import _emit_outcome_signal, DYNAMIC_APPLICATIONS

router = APIRouter(prefix="/industry", tags=["Industry Pipeline & Interns"])

# In-memory store for milestones: application_id -> list of milestones
DYNAMIC_MILESTONES: dict = {
    "645c9b36-a30e-4457-8fc2-df37b7acf0dc": [
        {
            "tracking_id": "e6e7ca96-4c9e-4d3f-a30c-828a5c023cf0",
            "application_id": "645c9b36-a30e-4457-8fc2-df37b7acf0dc",
            "milestone": "Mid-term Evaluation",
            "status": "in_progress",
            "mentor_rating": 4.0,
            "mentor_feedback": "Doing well, progressing on tasks."
        }
    ]
}

@router.get("/pipeline")
def get_pipeline(opportunity_id: Optional[str] = None, recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter["company_id"]
    
    kanban = {}
    # Count from DYNAMIC_APPLICATIONS
    for a in DYNAMIC_APPLICATIONS.values():
        opp_id = a.get("opportunity_id", "default")
        if opportunity_id and opp_id != opportunity_id:
            continue
        status = a.get("status", "applied")
        if opp_id not in kanban:
            kanban[opp_id] = {}
        kanban[opp_id][status] = kanban[opp_id].get(status, 0) + 1
        
    return kanban

@router.get("/pipeline/{opportunity_id}")
def get_pipeline_details(opportunity_id: str, recruiter: dict = Depends(get_current_recruiter)):
    res = [a for a in DYNAMIC_APPLICATIONS.values() if a.get("opportunity_id") == opportunity_id]
    return res

@router.post("/interns/{application_id}/milestones")
def create_milestone(application_id: str, req: MilestoneCreate, recruiter: dict = Depends(require_verified_company)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter["company_id"]
    
    app = DYNAMIC_APPLICATIONS.get(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.get("status") != "selected":
        raise HTTPException(status_code=400, detail="Application is not in selected state")
        
    tracking_id = str(uuid.uuid4())
    data = {
        "tracking_id": tracking_id,
        "application_id": application_id,
        "milestone": req.milestone,
        "status": "not_started"
    }
    
    try:
        service_client.table("internship_tracking").insert(data).execute()
    except Exception:
        pass
        
    if application_id not in DYNAMIC_MILESTONES:
        DYNAMIC_MILESTONES[application_id] = []
    DYNAMIC_MILESTONES[application_id].append(data)
    
    return data

@router.patch("/interns/{application_id}/milestones/{tracking_id}")
def update_milestone(application_id: str, tracking_id: str, req: MilestoneUpdate, recruiter: dict = Depends(require_verified_company)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    
    data = req.model_dump(exclude_unset=True)
    try:
        service_client.table("internship_tracking").update(data).eq("tracking_id", tracking_id).execute()
    except Exception:
        pass
        
    # Update dynamic tracking
    milestones = DYNAMIC_MILESTONES.get(application_id, [])
    updated = None
    for m in milestones:
        if m.get("tracking_id") == tracking_id:
            m.update(data)
            updated = m
            break
            
    if not updated:
        updated = {"tracking_id": tracking_id, "application_id": application_id, **data}
        if application_id not in DYNAMIC_MILESTONES:
            DYNAMIC_MILESTONES[application_id] = []
        DYNAMIC_MILESTONES[application_id].append(updated)
        
    if req.mentor_rating is not None:
        _emit_outcome_signal(service_client, application_id, "mentor_rating_recorded", {"rating": req.mentor_rating})
        
    return updated

@router.get("/interns")
def list_interns(recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter.get("company_id")
    if not company_id:
        return []
        
    # Selected applications
    selected_apps = [a for a in DYNAMIC_APPLICATIONS.values() if a.get("status") == "selected"]
    
    results = []
    for app in selected_apps:
        app_copy = dict(app)
        app_copy["internship_tracking"] = DYNAMIC_MILESTONES.get(app["application_id"], [])
        app_copy["university"] = "LDRP Institute of Technology"
        app_copy["department"] = "Computer Science and Engineering"
        results.append(app_copy)
        
    return results

