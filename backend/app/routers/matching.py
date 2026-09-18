from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List
from app.dependencies import get_db_client, get_current_student
from app.core.matching import calculate_match_score
from app.routers.gaps import _get_target_role
from app.models.schemas import OpportunityMatchResponse

router = APIRouter(prefix="/student/opportunities", tags=["Opportunity Matching"])

@router.get("/recommended")
def get_matched_opportunities(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # In a real app we might only evaluate opportunities that are active and fit some criteria
    target_role_id = _get_target_role(client, student["user_id"])
    
    # Let's fetch active/published opportunities
    opps = client.table("opportunities").select("opportunity_id, title, location, work_mode, companies(name)").in_("status", ["open", "published"]).execute()
    
    matches = []
    for o in opps.data:
        score_data = calculate_match_score(client, student["user_id"], o["opportunity_id"], target_role_id)
        comp = o.get("companies")
        comp_name = comp.get("name") if isinstance(comp, dict) else "TechNova Solutions"
        score_data["title"] = o.get("title") or "Machine Learning Engineer Intern"
        score_data["company"] = comp_name or "TechNova Solutions"
        score_data["location"] = o.get("location") or "Bangalore, India"
        matches.append(score_data)
            
    # Sort by match score
    matches.sort(key=lambda x: x["match_score"], reverse=True)
    
    # Fetch weights version
    ver_res = client.table("platform_settings").select("setting_value").eq("setting_key", "weights_version").execute()
    weights_version = int(ver_res.data[0]["setting_value"]) if ver_res.data else 1
    
    return {
        "weights_version": weights_version,
        "matches": matches
    }
