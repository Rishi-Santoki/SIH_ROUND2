from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List
from app.dependencies import get_current_recruiter, require_verified_company
from app.models.industry_schemas import OpportunityCreate, OpportunityUpdate, OpportunitySkillAdd

router = APIRouter(prefix="/industry/opportunities", tags=["Industry Opportunities"])

@router.post("")
def create_opportunity(req: OpportunityCreate, recruiter: dict = Depends(require_verified_company)):
    client: Client = recruiter["client"]
    data = req.model_dump(exclude_unset=True, exclude={"create_faculty_collaboration"})
    data["company_id"] = recruiter["company_id"]
    data["status"] = "draft"
    
    # Handle datetime
    data["application_deadline"] = data["application_deadline"].isoformat()
    
    res = client.table("opportunities").insert(data).execute()
    new_opp = res.data[0]
    
    if req.opportunity_type in ["fdp", "project"] and req.create_faculty_collaboration:
        collab_data = {
            "company_id": recruiter["company_id"],
            "collaboration_type": req.opportunity_type,
            "title": req.title,
            "description": req.description,
            "status": "proposed"
        }
        client.table("faculty_collaborations").insert(collab_data).execute()
        
    return new_opp

@router.post("/{opportunity_id}/skills")
def add_skills(opportunity_id: str, skills: List[OpportunitySkillAdd], recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    # Check ownership
    opp = client.table("opportunities").select("company_id").eq("opportunity_id", opportunity_id).execute()
    if not opp.data or opp.data[0]["company_id"] != recruiter["company_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    data = []
    for s in skills:
        item = s.model_dump()
        item["opportunity_id"] = opportunity_id
        item["skill_id"] = str(item["skill_id"])
        data.append(item)
        
    res = client.table("opportunity_skills").insert(data).execute()
    return res.data

@router.patch("/{opportunity_id}/publish")
def publish_opportunity(opportunity_id: str, recruiter: dict = Depends(require_verified_company)):
    client: Client = recruiter["client"]
    
    opp = client.table("opportunities").select("*").eq("opportunity_id", opportunity_id).execute()
    if not opp.data or opp.data[0]["company_id"] != recruiter["company_id"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    skills = client.table("opportunity_skills").select("id").eq("opportunity_id", opportunity_id).execute()
    if not skills.data:
        raise HTTPException(status_code=400, detail="Cannot publish opportunity without required skills")
        
    # Assuming deadline in future check
    res = client.table("opportunities").update({"status": "active"}).eq("opportunity_id", opportunity_id).execute()
    return res.data

@router.patch("/{opportunity_id}/close")
def close_opportunity(opportunity_id: str, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    res = client.table("opportunities").update({"status": "closed"}).eq("opportunity_id", opportunity_id).eq("company_id", recruiter["company_id"]).execute()
    return res.data

@router.patch("/{opportunity_id}")
def update_opportunity(opportunity_id: str, req: OpportunityUpdate, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    data = req.model_dump(exclude_unset=True)
    if "application_deadline" in data:
        data["application_deadline"] = data["application_deadline"].isoformat()
        
    res = client.table("opportunities").update(data).eq("opportunity_id", opportunity_id).eq("company_id", recruiter["company_id"]).execute()
    return res.data

@router.get("")
def list_opportunities(recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    # In reality, grouping applications count would require an RPC or view, or processing in memory
    res = client.table("opportunities").select("*, applications(status)").eq("company_id", recruiter["company_id"]).execute()
    
    # Compute counts
    for r in res.data:
        apps = r.pop("applications", [])
        counts = {}
        for a in apps:
            counts[a["status"]] = counts.get(a["status"], 0) + 1
        r["applicant_counts"] = counts
        
    return res.data

@router.get("/{opportunity_id}")
def get_opportunity(opportunity_id: str, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    res = client.table("opportunities").select("*, opportunity_skills(*)").eq("opportunity_id", opportunity_id).eq("company_id", recruiter["company_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return res.data[0]
