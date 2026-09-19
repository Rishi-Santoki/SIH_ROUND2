from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from datetime import datetime
from app.dependencies import get_db_client, get_current_student
from app.core.matching import get_skill_gaps, calculate_readiness_percentage
from app.routers.gaps import _get_target_role
from app.routers.student_roadmap import generate_skill_roadmap

router = APIRouter(prefix="/student", tags=["Readiness & Roadmap"])

@router.get("/readiness")
def get_student_readiness(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    try:
        res = client.table("student_profiles").select("target_career_id").eq("student_id", student["user_id"]).execute()
        if not res.data or not res.data[0].get("target_career_id"):
            return {
                "target_role_title": None,
                "readiness_score": 0.0,
                "has_target_role": False
            }
        
        target_role_id = res.data[0]["target_career_id"]
        cr = client.table("career_roles").select("title").eq("career_role_id", target_role_id).execute()
        target_role_name = cr.data[0]["title"] if cr.data else None
        
        gaps = get_skill_gaps(client, student["user_id"], target_role_id)
        readiness = calculate_readiness_percentage(gaps)
        
        return {
            "target_role_title": target_role_name,
            "readiness_score": float(readiness),
            "has_target_role": True
        }
    except Exception:
        return {
            "target_role_title": None,
            "readiness_score": 0.0,
            "has_target_role": False
        }

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
    
    # Sort gaps by importance descending, mandatory first
    sorted_gaps = sorted(
        gaps, 
        key=lambda x: (x.get("is_mandatory", False), x.get("importance_weight", 0)), 
        reverse=True
    )
    
    already_have = []
    path = []
    
    next_milestone = "Ready for applications"
    
    for g in sorted_gaps:
        if g["status"] == "mastered":
            already_have.append(g["skill_name"])
        elif g["status"] in ["missing", "partial"]:
            if next_milestone == "Ready for applications":
                next_milestone = f"Improve {g['skill_name']}"
                
            # Invoke Module 3 logic internally for this skill
            try:
                roadmap = generate_skill_roadmap(
                    skill_id=g["skill_id"],
                    target_role_id=target_role_id,
                    client=client,
                    student=student
                )
                if roadmap.get("status") != "already_mastered":
                    # Attach the skill context to each step
                    skill_path = roadmap.get("path", [])
                    for step in skill_path:
                        step["target_skill"] = g["skill_name"]
                    path.extend(skill_path)
            except Exception as e:
                print(f"Skipping roadmap for {g['skill_name']} due to error: {e}")
                pass
                
    # Renumber the merged path sequentially
    for i, step in enumerate(path):
        step["step_number"] = i + 1

    return {
        "target_role": target_role_name,
        "current_state": {"readiness": readiness},
        "already_have": already_have,
        "path": path,
        "next_milestone": next_milestone
    }
