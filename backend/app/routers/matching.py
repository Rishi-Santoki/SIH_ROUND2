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
    
    # Let's fetch some opportunities (say, all active)
    opps = client.table("opportunities").select("opportunity_id").eq("status", "open").execute()
    
    matches = []
    for o in opps.data:
        score_data = calculate_match_score(client, student["user_id"], o["opportunity_id"], target_role_id)
        if score_data["match_score"] > 0: # Only return somewhat matching
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
