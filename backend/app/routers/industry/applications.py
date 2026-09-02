from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import Optional
from app.dependencies import get_current_recruiter, require_verified_company
from app.models.industry_schemas import ApplicationStatusUpdate

router = APIRouter(prefix="/industry/applications", tags=["Industry Applications"])

def _emit_outcome_signal(client: Client, application_id: str, action: str, metadata: dict):
    # USP 14 - Outcome Aware Matching. Write to audit_logs
    client.table("audit_logs").insert({
        "action": action,
        "entity_type": "application",
        "entity_id": application_id,
        "details": metadata
    }).execute()

@router.get("")
def list_applications(opportunity_id: Optional[str] = None, status: Optional[str] = None, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    company_id = recruiter["company_id"]
    
    # RLS on applications relies on joining opportunities. 
    # To filter, we use inner join with opportunities.company_id
    query = client.table("applications").select("*, opportunities!inner(*)").eq("opportunities.company_id", company_id)
    
    if opportunity_id:
        query = query.eq("opportunity_id", opportunity_id)
    if status:
        query = query.eq("status", status)
        
    res = query.execute()
    return res.data

@router.get("/{application_id}/candidate")
def get_candidate_full(application_id: str, live_score: bool = False, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    company_id = recruiter["company_id"]
    
    app_res = client.table("applications").select("*, opportunities!inner(*)").eq("application_id", application_id).eq("opportunities.company_id", company_id).execute()
    if not app_res.data:
        raise HTTPException(status_code=404, detail="Application not found")
        
    application = app_res.data[0]
    student_id = application["student_id"]
    
    # Since they applied, we can return the full profile
    profile = client.table("student_profiles").select("*").eq("student_id", student_id).execute().data[0]
    skills = client.table("student_skills").select("*, skills(name)").eq("student_id", student_id).execute().data
    projects = client.table("projects").select("*").eq("student_id", student_id).execute().data
    
    ret = {
        "application": application,
        "profile": profile,
        "skills": skills,
        "projects": projects
    }
    
    if live_score:
        from app.core.matching import calculate_match_score
        ret["live_match_score"] = calculate_match_score(client, student_id, application["opportunity_id"], "")
        
    return ret

@router.patch("/{application_id}/status")
def update_status(application_id: str, update: ApplicationStatusUpdate, recruiter: dict = Depends(require_verified_company)):
    client: Client = recruiter["client"]
    company_id = recruiter["company_id"]
    
    # Verify ownership
    app_res = client.table("applications").select("*, opportunities!inner(company_id)").eq("application_id", application_id).execute()
    if not app_res.data or app_res.data[0]["opportunities"]["company_id"] != company_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    old_status = app_res.data[0]["status"]
    
    if update.status in ["shortlisted", "interview"] and not update.recruiter_notes:
        raise HTTPException(status_code=400, detail="Recruiter notes are required for shortlisting/interviews")
    if update.status == "rejected" and not update.rejection_reason:
        raise HTTPException(status_code=400, detail="Rejection reason is required")
        
    data = update.model_dump(exclude_unset=True)
    res = client.table("applications").update(data).eq("application_id", application_id).execute()
    
    # Write outcome signals
    if update.status == "selected":
        _emit_outcome_signal(client, application_id, "candidate_selected", {"notes": update.recruiter_notes})
    elif update.status == "rejected":
        _emit_outcome_signal(client, application_id, "candidate_rejected", {"reason": update.rejection_reason})
    elif update.status == "interview":
        _emit_outcome_signal(client, application_id, "interview_scheduled", {"notes": update.recruiter_notes})
        
    # Notify student
    client.table("notifications").insert({
        "user_id": app_res.data[0]["student_id"],
        "notification_type": "application_update",
        "title": f"Application status updated to {update.status}",
        "message": update.recruiter_notes or update.rejection_reason or ""
    }).execute()
    
    return res.data
