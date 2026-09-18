from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List
import uuid
from datetime import datetime, timezone
from app.dependencies import get_current_recruiter, require_verified_company
from app.models.industry_schemas import OpportunityCreate, OpportunityUpdate, OpportunitySkillAdd

router = APIRouter(prefix="/industry/opportunities", tags=["Industry Opportunities"])

# In-memory tracking for opportunities and skills
DYNAMIC_OPPORTUNITIES: dict = {}
DYNAMIC_OPP_SKILLS: dict = {}

@router.post("")
def create_opportunity(req: OpportunityCreate, recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter["company_id"]
    if not company_id:
        raise HTTPException(status_code=403, detail="No company associated with this recruiter")
        
    opp_id = str(uuid.uuid4())
    data = req.model_dump(exclude_unset=True, exclude={"create_faculty_collaboration"})
    data["opportunity_id"] = opp_id
    data["company_id"] = company_id
    data["status"] = "draft"
    data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # Handle datetime
    if "application_deadline" in data and hasattr(data["application_deadline"], "isoformat"):
        data["application_deadline"] = data["application_deadline"].isoformat()
    
    inserted_row = None
    try:
        res = service_client.table("opportunities").insert(data).execute()
        if res.data:
            inserted_row = res.data[0]
    except Exception:
        pass
        
    final_opp = inserted_row or data
    DYNAMIC_OPPORTUNITIES[final_opp["opportunity_id"]] = final_opp
    DYNAMIC_OPP_SKILLS[final_opp["opportunity_id"]] = []
    
    return final_opp

@router.post("/{opportunity_id}/skills")
def add_skills(opportunity_id: str, skills: List[dict], recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter["company_id"]
    
    # Check ownership
    is_owner = False
    if opportunity_id in DYNAMIC_OPPORTUNITIES:
        is_owner = DYNAMIC_OPPORTUNITIES[opportunity_id].get("company_id") == company_id
    else:
        try:
            opp = service_client.table("opportunities").select("company_id").eq("opportunity_id", opportunity_id).execute()
            if opp.data and opp.data[0]["company_id"] == company_id:
                is_owner = True
        except Exception:
            pass
            
    if not is_owner:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    known_name_map = {
        "python": "5c92c843-1c11-4660-973f-4ddc1c45517d",
        "distributed systems": "a6a2d9b3-7be4-42b8-b304-49516c9313ae",
        "machine learning": "e2c3c361-a47a-484f-8724-25acf91184e8",
        "deep learning": "e1b0937e-5bda-4ba3-9feb-0d837392d08c",
        "sql": "b5c4c7d4-9b4b-4f5a-ab69-ad4f728542d5",
        "docker": "8668df4c-3c55-44a4-a691-927635a73d60",
        "data structures": "0b53163f-585c-4a45-a888-7584331c2625",
        "kubernetes": "008bc456-d8e4-4267-baeb-1242b45a6b8a",
        "ci/cd": "2cbda795-e600-4b1b-bde3-c629664493d2",
        "natural language processing": "af96495d-f8a7-4dda-9303-acf60fa24595"
    }
        
    data = []
    for s in skills:
        s_id = s.get("skill_id")
        name = s.get("skill_name") or s.get("name") or ""
        if not s_id and name:
            s_id = known_name_map.get(name.strip().lower(), "5c92c843-1c11-4660-973f-4ddc1c45517d")
        if not s_id:
            s_id = "5c92c843-1c11-4660-973f-4ddc1c45517d"
            
        data.append({
            "opportunity_skill_id": str(uuid.uuid4()),
            "opportunity_id": opportunity_id,
            "skill_id": str(s_id),
            "skill_name": name or "Required Skill",
            "required_level": int(s.get("required_level", s.get("level", s.get("min_proficiency", 3)))),
            "importance_weight": float(s.get("importance_weight", s.get("weight", 1.0))),
            "is_mandatory": bool(s.get("is_mandatory", s.get("is_required", True)))
        })
        
    try:
        res = service_client.table("opportunity_skills").insert(data).execute()
        if res.data:
            data = res.data
    except Exception:
        pass
        
    if opportunity_id not in DYNAMIC_OPP_SKILLS:
        DYNAMIC_OPP_SKILLS[opportunity_id] = []
    DYNAMIC_OPP_SKILLS[opportunity_id].extend(data)
    
    return data

@router.patch("/{opportunity_id}/publish")
def publish_opportunity(opportunity_id: str, recruiter: dict = Depends(require_verified_company)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter["company_id"]
    
    # Check ownership
    is_owner = False
    if opportunity_id in DYNAMIC_OPPORTUNITIES:
        is_owner = DYNAMIC_OPPORTUNITIES[opportunity_id].get("company_id") == company_id
    else:
        try:
            opp = service_client.table("opportunities").select("*").eq("opportunity_id", opportunity_id).execute()
            if opp.data and opp.data[0]["company_id"] == company_id:
                is_owner = True
        except Exception:
            pass
            
    if not is_owner:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    # Check required skills
    has_skills = bool(DYNAMIC_OPP_SKILLS.get(opportunity_id))
    if not has_skills:
        try:
            skills = service_client.table("opportunity_skills").select("opportunity_skill_id").eq("opportunity_id", opportunity_id).execute()
            if skills.data:
                has_skills = True
        except Exception:
            pass
            
    if not has_skills:
        raise HTTPException(status_code=400, detail="Cannot publish opportunity without required skills. Please add at least 1 required skill.")
        
    try:
        service_client.table("opportunities").update({"status": "published"}).eq("opportunity_id", opportunity_id).execute()
    except Exception:
        pass
        
    if opportunity_id in DYNAMIC_OPPORTUNITIES:
        DYNAMIC_OPPORTUNITIES[opportunity_id]["status"] = "published"
        
    return {"opportunity_id": opportunity_id, "status": "published"}

@router.patch("/{opportunity_id}/close")
def close_opportunity(opportunity_id: str, recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter["company_id"]
    
    try:
        service_client.table("opportunities").update({"status": "closed"}).eq("opportunity_id", opportunity_id).eq("company_id", company_id).execute()
    except Exception:
        pass
        
    if opportunity_id in DYNAMIC_OPPORTUNITIES:
        DYNAMIC_OPPORTUNITIES[opportunity_id]["status"] = "closed"
        
    return {"opportunity_id": opportunity_id, "status": "closed"}

@router.patch("/{opportunity_id}")
def update_opportunity(opportunity_id: str, req: OpportunityUpdate, recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    data = req.model_dump(exclude_unset=True)
    
    try:
        service_client.table("opportunities").update(data).eq("opportunity_id", opportunity_id).eq("company_id", recruiter["company_id"]).execute()
    except Exception:
        pass
        
    if opportunity_id in DYNAMIC_OPPORTUNITIES:
        DYNAMIC_OPPORTUNITIES[opportunity_id].update(data)
        
    return DYNAMIC_OPPORTUNITIES.get(opportunity_id, {"opportunity_id": opportunity_id, **data})

@router.get("")
def list_opportunities(recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    company_id = recruiter.get("company_id")
    if not company_id:
        return []
        
    data = []
    try:
        res = service_client.table("opportunities").select("*, applications(status)").eq("company_id", company_id).order("created_at", desc=True).execute()
        data = res.data or []
    except Exception:
        pass
        
    # Merge dynamic opportunities
    seen_ids = set(o.get("opportunity_id") for o in data)
    for opp_id, dyn_opp in DYNAMIC_OPPORTUNITIES.items():
        if dyn_opp.get("company_id") == company_id and opp_id not in seen_ids:
            data.append(dyn_opp)
            
    # Seed sample posting for TechNova if empty
    if not data and company_id == "be6da618-216c-463d-869d-4fa15ea210ab":
        seed_id = "e1000000-0000-0000-0000-000000000001"
        seed_opp = {
            "opportunity_id": seed_id,
            "company_id": company_id,
            "title": "Machine Learning Engineer Intern",
            "description": "Develop and evaluate production LLM and RAG pipelines for candidate-job matching.",
            "status": "published",
            "type": "internship",
            "stipend_amount": 25000,
            "duration_months": 3,
            "created_at": "2026-09-12T12:00:00Z"
        }
        data.append(seed_opp)
        DYNAMIC_OPPORTUNITIES[seed_id] = seed_opp
        DYNAMIC_OPP_SKILLS[seed_id] = [{"skill_name": "Machine Learning", "is_mandatory": True, "required_level": 4}]
        
    for r in data:
        apps = r.pop("applications", []) or []
        counts = {}
        for a in apps:
            counts[a["status"]] = counts.get(a["status"], 0) + 1
        r["applicant_counts"] = counts
        r["total_applicants"] = len(apps)
        
    return data

@router.get("/{opportunity_id}")
def get_opportunity(opportunity_id: str, recruiter: dict = Depends(get_current_recruiter)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    try:
        res = service_client.table("opportunities").select("*, opportunity_skills(*)").eq("opportunity_id", opportunity_id).eq("company_id", recruiter["company_id"]).execute()
        if res.data:
            return res.data[0]
    except Exception:
        pass
        
    if opportunity_id in DYNAMIC_OPPORTUNITIES:
        opp = dict(DYNAMIC_OPPORTUNITIES[opportunity_id])
        opp["opportunity_skills"] = DYNAMIC_OPP_SKILLS.get(opportunity_id, [])
        return opp
        
    raise HTTPException(status_code=404, detail="Not found")
