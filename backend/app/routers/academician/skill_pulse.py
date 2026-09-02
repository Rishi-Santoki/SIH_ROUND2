from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_academician
from app.core.analytics import get_industry_demand, get_student_readiness, generate_insights

router = APIRouter(prefix="/academician", tags=["Academician Skill Pulse"])

@router.get("/skill-pulse")
def get_skill_pulse(academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    institution_id = academician.get("institution_id")
    if not institution_id:
        raise HTTPException(status_code=400, detail="Academician is not linked to an institution")

    skills_res = client.table("skills").select("skill_id, name").execute()
    skill_map = {s["skill_id"]: s["name"] for s in skills_res.data}
    
    industry_demand = get_industry_demand(client, skill_map=skill_map)
    
    students_res = client.table("student_profiles").select("student_id").eq("institution_id", institution_id).execute()
    student_ids = [s["student_id"] for s in students_res.data]
    
    student_readiness = get_student_readiness(client, student_ids, skill_map=skill_map)
    
    insights = generate_insights(industry_demand, student_readiness)
    
    for d in industry_demand:
        d.pop("_skill_id", None)
    for r in student_readiness:
        r.pop("_skill_id", None)
        
    return {
        "industry_demand": industry_demand,
        "student_readiness": student_readiness,
        "insights": insights
    }
