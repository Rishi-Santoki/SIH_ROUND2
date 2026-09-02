from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import datetime
from app.dependencies import get_db_client, get_current_student
from app.core.matching import get_skill_gaps, calculate_readiness_percentage
from app.routers.gaps import _get_target_role

router = APIRouter(prefix="/student", tags=["Readiness & Roadmap"])

@router.get("/career-digital-twin")
def get_digital_twin(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    target_role_id = _get_target_role(client, student["user_id"])
    
    # Get role name
    cr = client.table("career_roles").select("title").eq("career_role_id", target_role_id).execute()
    target_role_name = cr.data[0]["title"] if cr.data else "Unknown"
    
    gaps = get_skill_gaps(client, student["user_id"], target_role_id)
    
    breakdown = []
    recommendations = []
    rank = 1
    
    for g in gaps:
        breakdown.append({
            "skill": g["skill_name"],
            "current": g["current_level"],
            "target": g["required_level"]
        })
        if g["status"] in ["missing", "partial"]:
            recommendations.append({
                "rank": rank,
                "action": f"Improve {g['skill_name']}",
                "linked_gap": g["skill_name"]
            })
            rank += 1
            
    readiness = calculate_readiness_percentage(gaps)
    
    return {
        "target_role": target_role_name,
        "skill_breakdown": breakdown,
        "readiness_percentage": readiness,
        "recommendations": recommendations,
        "last_recalculated": datetime.utcnow()
    }

@router.get("/career-roadmap")
def get_roadmap(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # Aggregating endpoint (USP 9)
    # Target role -> gaps -> learning plan -> matched opps -> next milestone
    target_role_id = _get_target_role(client, student["user_id"])
    cr = client.table("career_roles").select("title").eq("career_role_id", target_role_id).execute()
    target_role_name = cr.data[0]["title"] if cr.data else "Unknown"
    
    gaps = get_skill_gaps(client, student["user_id"], target_role_id)
    readiness = calculate_readiness_percentage(gaps)
    
    # Next milestone: single highest-importance unmet gap
    next_milestone = "Ready for applications"
    for g in gaps:
        if g["status"] in ["missing", "partial"]:
            next_milestone = f"Improve {g['skill_name']}"
            break
            
    # For a real implementation, we would call the internal functions for learning plan and opps here
    return {
        "target_role": target_role_name,
        "current_state": {"readiness": readiness},
        "gaps": gaps,
        "learning_plan": [], # populated by calling learning router logic
        "matched_opportunities": [], # populated by calling matching router logic
        "next_milestone": next_milestone
    }
