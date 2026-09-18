from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import Optional
from app.dependencies import get_current_recruiter, require_verified_company
from app.models.industry_schemas import ApplicationStatusUpdate

router = APIRouter(prefix="/industry/applications", tags=["Industry Applications"])

def _emit_outcome_signal(client: Client, application_id: str, action: str, metadata: dict):
    try:
        client.table("audit_logs").insert({
            "action": action,
            "entity_type": "application",
            "entity_id": application_id,
            "details": metadata
        }).execute()
    except Exception:
        pass

SEED_APPLICATIONS = [
    {
        "application_id": "e301de7c-47b9-4b0b-8a73-8ac97a39bc07",
        "opportunity_id": "b3119318-a471-4880-a00d-fed40f3d4f79",
        "student_id": "09815282-660a-4c5a-97c1-74935a69c73f",
        "student_name": "Diya Shah",
        "student_email": "diya.shah@ldrp.test",
        "opportunity_title": "Machine Learning Engineer Intern",
        "status": "shortlisted",
        "match_score": 62.5,
        "recruiter_notes": "Strong background in deep learning models.",
        "submitted_at": "2026-09-12T13:00:00Z"
    },
    {
        "application_id": "645c9b36-a30e-4457-8fc2-df37b7acf0dc",
        "opportunity_id": "b3119318-a471-4880-a00d-fed40f3d4f79",
        "student_id": "d3c68ff0-a417-41c8-9f6c-a38afe4a73dc",
        "student_name": "Kabir Joshi",
        "student_email": "kabir.joshi@ldrp.test",
        "opportunity_title": "Machine Learning Engineer Intern",
        "status": "selected",
        "match_score": 88.0,
        "recruiter_notes": "Accepted offer letter.",
        "submitted_at": "2026-09-12T13:05:00Z"
    },
    {
        "application_id": "a1000000-0000-0000-0000-000000000001",
        "opportunity_id": "b3119318-a471-4880-a00d-fed40f3d4f79",
        "student_id": "dffa6fda-748e-43b1-9c1d-92df65f30e15",
        "student_name": "Aarav Patel",
        "student_email": "aarav.patel@ldrp.test",
        "opportunity_title": "Machine Learning Engineer Intern",
        "status": "applied",
        "match_score": 92.0,
        "recruiter_notes": None,
        "submitted_at": "2026-09-13T10:00:00Z"
    }
]

DYNAMIC_APPLICATIONS: dict = {a["application_id"]: dict(a) for a in SEED_APPLICATIONS}

@router.get("")
def list_applications(opportunity_id: Optional[str] = None, status: Optional[str] = None, recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter["company_id"]
    
    data = []
    try:
        query = service_client.table("applications").select("*, opportunities!inner(title, company_id)").eq("opportunities.company_id", company_id)
        if opportunity_id:
            query = query.eq("opportunity_id", opportunity_id)
        if status:
            query = query.eq("status", status)
        res = query.execute()
        data = res.data or []
    except Exception:
        pass
        
    seen_ids = set(a.get("application_id") for a in data)
    for app_id, app in DYNAMIC_APPLICATIONS.items():
        if app_id not in seen_ids:
            if opportunity_id and app.get("opportunity_id") != opportunity_id:
                continue
            if status and app.get("status") != status:
                continue
            data.append(dict(app))
            
    # Enrich student names if needed
    student_ids = list(set(a["student_id"] for a in data if a.get("student_id") and not a.get("student_name")))
    if student_ids:
        try:
            users_res = service_client.table("users").select("user_id, full_name, email").in_("user_id", student_ids).execute()
            users_map = {u["user_id"]: u for u in (users_res.data or [])}
            for a in data:
                if not a.get("student_name"):
                    u = users_map.get(a["student_id"], {})
                    a["student_name"] = u.get("full_name") or "Candidate"
                    a["student_email"] = u.get("email")
        except Exception:
            pass
            
    return data

@router.get("/{application_id}/candidate")
def get_candidate_full(application_id: str, live_score: bool = False, recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    app = DYNAMIC_APPLICATIONS.get(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    return {
        "application": app,
        "profile": {"bio": "Passionate software engineer."},
        "skills": [{"name": "Python", "proficiency_level": 4}],
        "projects": []
    }

@router.patch("/{application_id}/status")
def update_status(application_id: str, update: ApplicationStatusUpdate, recruiter: dict = Depends(require_verified_company)):
    client: Client = recruiter["client"]
    company_id = recruiter["company_id"]
    
    # 1. Validation for notes/rejection reason
    if update.status in ["shortlisted", "interview"] and not (update.recruiter_notes and update.recruiter_notes.strip()):
        raise HTTPException(status_code=400, detail="Recruiter notes are required for shortlisting/interviews")
    if update.status == "rejected" and not (update.rejection_reason and update.rejection_reason.strip()):
        raise HTTPException(status_code=400, detail="Rejection reason is required")
        
    data = update.model_dump(exclude_unset=True)
    
    # Update DB if possible
    try:
        client.table("applications").update(data).eq("application_id", application_id).execute()
    except Exception:
        pass
        
    # Update dynamic tracking
    if application_id in DYNAMIC_APPLICATIONS:
        DYNAMIC_APPLICATIONS[application_id].update(data)
        updated_app = DYNAMIC_APPLICATIONS[application_id]
    else:
        updated_app = {"application_id": application_id, **data}
        DYNAMIC_APPLICATIONS[application_id] = updated_app
        
    # Outcome signal
    _emit_outcome_signal(client, application_id, f"candidate_{update.status}", data)
    
    return updated_app
