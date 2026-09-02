from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import Optional
from app.dependencies import get_db_client, get_current_institution_admin
from app.core.matching import get_skill_gaps, calculate_readiness_percentage

router = APIRouter(prefix="/institution/students", tags=["Institution Students"])

@router.get("")
def list_students(
    department: Optional[str] = None,
    year_of_study: Optional[int] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
    admin: dict = Depends(get_current_institution_admin)
):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    query = client.table("student_profiles").select("student_id, target_career_role_id, department, current_year, users(full_name, email)").eq("institution_id", institution_id)
    
    if department:
        query = query.eq("department", department)
    if year_of_study:
        query = query.eq("current_year", year_of_study)
        
    res = query.range(offset, offset + limit - 1).execute()
    
    # Calculate readiness for each student
    students = []
    for s in res.data:
        readiness = 0.0
        if s.get("target_career_role_id"):
            gaps = get_skill_gaps(client, s["student_id"], s["target_career_role_id"])
            readiness = calculate_readiness_percentage(gaps)
            
        students.append({
            "student_id": s["student_id"],
            "full_name": s["users"]["full_name"],
            "email": s["users"]["email"],
            "department": s["department"],
            "current_year": s["current_year"],
            "readiness_percentage": round(readiness, 2),
            "target_career_role_id": s.get("target_career_role_id")
        })
        
    return students

@router.get("/at-risk")
def get_at_risk_students(admin: dict = Depends(get_current_institution_admin)):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    settings = client.table("platform_settings").select("readiness_at_risk_threshold").limit(1).execute()
    threshold = settings.data[0]["readiness_at_risk_threshold"] if settings.data else 40.0
    
    # Simple heuristic for at-risk
    res = client.table("student_profiles").select("student_id, target_career_role_id, department, current_year, users(full_name, email)").eq("institution_id", institution_id).in_("current_year", [3, 4]).execute()
    
    at_risk = []
    for s in res.data:
        if s.get("target_career_role_id"):
            gaps = get_skill_gaps(client, s["student_id"], s["target_career_role_id"])
            readiness = calculate_readiness_percentage(gaps)
            if readiness < threshold:
                at_risk.append({
                    "student_id": s["student_id"],
                    "full_name": s["users"]["full_name"],
                    "department": s["department"],
                    "current_year": s["current_year"],
                    "readiness_percentage": round(readiness, 2),
                    "reason": "Low readiness in final years"
                })
                
    return at_risk

@router.get("/{student_id}")
def get_student_detail(student_id: str, admin: dict = Depends(get_current_institution_admin)):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    res = client.table("student_profiles").select("student_id, target_career_role_id, department, current_year, users(full_name, email)").eq("student_id", student_id).eq("institution_id", institution_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Student not found or not in your institution")
        
    student = res.data[0]
    
    gaps = []
    readiness = 0.0
    if student.get("target_career_role_id"):
        gaps = get_skill_gaps(client, student["student_id"], student["target_career_role_id"])
        readiness = calculate_readiness_percentage(gaps)
        
    student["readiness_percentage"] = round(readiness, 2)
    student["skill_gaps"] = gaps
    
    # Optionally add internships or projects
    projects_res = client.table("projects").select("project_id, title").eq("student_id", student_id).execute()
    student["projects"] = projects_res.data
    
    return student
