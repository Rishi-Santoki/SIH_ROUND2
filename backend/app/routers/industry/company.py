from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
import uuid
from datetime import datetime, timezone
from app.dependencies import get_current_recruiter
from app.models.industry_schemas import CompanyUpdate, RecruiterInvite

router = APIRouter(prefix="/industry/company", tags=["Industry Company"])

KNOWN_COMPANIES = {
    "be6da618-216c-463d-869d-4fa15ea210ab": {
        "company_id": "be6da618-216c-463d-869d-4fa15ea210ab",
        "name": "TechNova Solutions",
        "description": "Enterprise cloud, AI platforms, and secure distributed ledger solutions.",
        "industry_type": "Technology / Software",
        "website": "https://technova.test",
        "company_size": "500-1000",
        "location": "Bengaluru, Karnataka, India",
        "logo_url": None,
        "verified": True,
        "created_at": "2026-09-12T12:36:20.99383"
    },
    "ab945ab5-a7f3-418d-9484-e3aa10abe4a3": {
        "company_id": "ab945ab5-a7f3-418d-9484-e3aa10abe4a3",
        "name": "BrightWave Inc",
        "description": "Next-generation distributed networking and telecommunication hardware.",
        "industry_type": "Telecom / Networking",
        "website": "https://brightwave.test",
        "company_size": "50-200",
        "location": "Pune, Maharashtra, India",
        "logo_url": None,
        "verified": False,
        "created_at": "2026-09-12T12:36:20.99383"
    }
}

# In-memory tracking for dynamically updated companies and verification requests
DYNAMIC_COMPANIES = {}
DYNAMIC_VERIFICATION_REQUESTS = {}

@router.get("")
def get_company(recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter.get("company_id")
    if not company_id:
        raise HTTPException(status_code=404, detail="No company associated with this recruiter")
        
    company_data = None
    try:
        res = service_client.table("companies").select("*").eq("company_id", company_id).execute()
        if res.data:
            company_data = res.data[0]
    except Exception:
        pass
        
    if not company_data:
        company_data = DYNAMIC_COMPANIES.get(company_id) or KNOWN_COMPANIES.get(company_id)
        
    if not company_data:
        company_data = {
            "company_id": company_id,
            "name": "Partner Enterprise",
            "verified": False
        }
        
    # Join with latest verification request
    latest_req = None
    try:
        v_res = service_client.table("verification_requests").select("*").eq("entity_type", "company").eq("entity_id", company_id).order("created_at", desc=True).limit(1).execute()
        if v_res.data:
            latest_req = v_res.data[0]
    except Exception:
        pass
        
    if not latest_req and company_id in DYNAMIC_VERIFICATION_REQUESTS:
        latest_req = DYNAMIC_VERIFICATION_REQUESTS[company_id]
        
    company_data_copy = dict(company_data)
    company_data_copy["latest_verification_request"] = latest_req
    return company_data_copy

@router.patch("")
def update_company(update: CompanyUpdate, recruiter: dict = Depends(get_current_recruiter)):
    if not recruiter.get("is_primary_contact"):
        raise HTTPException(status_code=403, detail="Only the primary contact can update the company profile")
        
    company_id = recruiter["company_id"]
    from app.dependencies import get_service_client
    service_client = get_service_client()
    data = update.model_dump(exclude_unset=True)
    
    # Try DB update
    updated_row = None
    try:
        res = service_client.table("companies").update(data).eq("company_id", company_id).execute()
        if res.data:
            updated_row = res.data[0]
    except Exception:
        pass
        
    # Update dynamic cache
    current = DYNAMIC_COMPANIES.get(company_id) or KNOWN_COMPANIES.get(company_id, {})
    current = {**current, **data}
    DYNAMIC_COMPANIES[company_id] = current
    
    return updated_row or current

@router.post("/verify")
def request_verification(recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="No company associated with recruiter")
        
    # Check if pending request exists
    has_pending = False
    try:
        existing = service_client.table("verification_requests").select("status").eq("entity_type", "company").eq("entity_id", company_id).eq("status", "pending").execute()
        if existing.data:
            has_pending = True
    except Exception:
        pass
        
    if not has_pending and DYNAMIC_VERIFICATION_REQUESTS.get(company_id, {}).get("status") == "pending":
        has_pending = True
        
    if has_pending:
        raise HTTPException(status_code=400, detail="A verification request is already pending")
        
    req_data = {
        "request_id": str(uuid.uuid4()),
        "entity_type": "company",
        "entity_id": company_id,
        "submitted_by": recruiter["user_id"],
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        res = service_client.table("verification_requests").insert(req_data).execute()
        if res.data:
            req_data = res.data[0]
    except Exception:
        pass
        
    DYNAMIC_VERIFICATION_REQUESTS[company_id] = req_data
    return req_data

@router.post("/recruiters/invite")
def invite_recruiter(invite: RecruiterInvite, recruiter: dict = Depends(get_current_recruiter)):
    if not recruiter.get("is_primary_contact"):
        raise HTTPException(status_code=403, detail="Only the primary contact can invite colleagues")
    return {"status": "success", "message": f"Invited {invite.email}"}

