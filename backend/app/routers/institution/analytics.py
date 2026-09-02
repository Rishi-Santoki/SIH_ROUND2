from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import Optional
from collections import defaultdict
from app.dependencies import get_db_client, get_current_institution_admin
from app.core.analytics import get_student_readiness

router = APIRouter(prefix="/institution/analytics", tags=["Institution Analytics"])

@router.get("/skill-gaps")
def get_aggregate_skill_gaps(
    department: Optional[str] = None,
    year_of_study: Optional[int] = None,
    admin: dict = Depends(get_current_institution_admin)
):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    query = client.table("student_profiles").select("student_id").eq("institution_id", institution_id)
    if department:
        query = query.eq("department", department)
    if year_of_study:
        query = query.eq("current_year", year_of_study)
        
    students_res = query.execute()
    student_ids = [s["student_id"] for s in students_res.data]
    
    skills_res = client.table("skills").select("skill_id, name").execute()
    skill_map = {s["skill_id"]: s["name"] for s in skills_res.data}
    
    # Reuses the exact same function as Academician Skill Pulse
    student_readiness = get_student_readiness(client, student_ids, skill_map)
    
    return {
        "department": department or "All",
        "year_of_study": year_of_study or "All",
        "total_students": len(student_ids),
        "readiness_distribution": student_readiness
    }

@router.get("/assessments")
def get_assessment_analytics(admin: dict = Depends(get_current_institution_admin)):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    # Trust layer analytics: verified evidence rate
    # Fetch students
    students_res = client.table("student_profiles").select("student_id").eq("institution_id", institution_id).execute()
    student_ids = [s["student_id"] for s in students_res.data]
    
    if not student_ids:
        return {"total_assessments": 0, "verified_rate": 0.0}
        
    # In a full implementation, we'd look at assessments table. 
    # For now, we simulate using student_skills confidence scores or certifications
    skills_res = client.table("student_skills").select("confidence_score, certification_url").in_("student_id", student_ids).execute()
    
    total = len(skills_res.data)
    verified = sum(1 for s in skills_res.data if s.get("certification_url") or s.get("confidence_score", 0) > 80)
    
    verified_rate = (verified / total * 100) if total > 0 else 0
    
    return {
        "total_skills_logged": total,
        "verified_evidence_count": verified,
        "verified_evidence_rate": round(verified_rate, 2)
    }

@router.get("/placements")
def get_placement_outcomes(admin: dict = Depends(get_current_institution_admin)):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    # Aggregates student applications and their status
    students_res = client.table("student_profiles").select("student_id").eq("institution_id", institution_id).execute()
    student_ids = [s["student_id"] for s in students_res.data]
    
    if not student_ids:
        return {"total_applications": 0, "status_distribution": {}}
        
    apps_res = client.table("applications").select("status").in_("student_id", student_ids).execute()
    
    dist = defaultdict(int)
    for a in apps_res.data:
        dist[a["status"]] += 1
        
    return {
        "total_applications": len(apps_res.data),
        "status_distribution": dist,
        "offers_received": dist.get("accepted", 0) + dist.get("offered", 0)
    }

@router.get("/department-comparison")
def get_department_comparison(admin: dict = Depends(get_current_institution_admin)):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    # Get distinct departments for this institution
    students_res = client.table("student_profiles").select("department").eq("institution_id", institution_id).execute()
    departments = {s.get("department") or "Unknown" for s in students_res.data}
    
    comparison = {}
    for dept in departments:
        # Compose the existing single-department logic
        real_dept = None if dept == "Unknown" else dept
        try:
            dept_stats = get_aggregate_skill_gaps(department=real_dept, year_of_study=None, admin=admin)
            comparison[dept] = dept_stats
        except Exception:
            comparison[dept] = {"error": "Could not fetch stats"}
            
    return {
        "department_comparison": comparison
    }
