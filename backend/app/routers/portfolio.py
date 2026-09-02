from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_student
from app.models.schemas import ProjectCreate, CertificationCreate

router = APIRouter(prefix="/student/portfolio", tags=["Portfolio"])

@router.post("/projects")
def add_project(req: ProjectCreate, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    data = req.model_dump(exclude_unset=True)
    skill_id = data.pop("skill_id", None)
    data["student_id"] = student["user_id"]
    res = client.table("projects").insert(data).execute()
    
    if res.data and skill_id:
        proj_id = res.data[0]["project_id"]
        # Find the student skill
        ss = client.table("student_skills").select("student_skill_id, confidence_score").eq("student_id", student["user_id"]).eq("skill_id", str(skill_id)).execute()
        if ss.data:
            ss_id = ss.data[0]["student_skill_id"]
            new_conf = min(100, ss.data[0]["confidence_score"] + 15)
            # Insert evidence
            client.table("skill_evidence").insert({
                "student_skill_id": ss_id,
                "evidence_type": "project",
                "evidence_ref_id": proj_id,
                "weight": 1.5
            }).execute()
            # Update confidence
            client.table("student_skills").update({"confidence_score": new_conf}).eq("student_skill_id", ss_id).execute()
            
    return res.data

@router.get("/projects")
def list_projects(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("projects").select("*").eq("student_id", student["user_id"]).execute()
    return res.data

@router.post("/certifications")
def add_certification(req: CertificationCreate, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    data = req.model_dump(exclude_unset=True)
    skill_id = data.pop("skill_id", None)
    data["student_id"] = student["user_id"]
    # Handle date conversion for Supabase
    data["issue_date"] = data["issue_date"].isoformat()
    res = client.table("certifications").insert(data).execute()
    
    if res.data and skill_id:
        cert_id = res.data[0]["certification_id"]
        ss = client.table("student_skills").select("student_skill_id, confidence_score").eq("student_id", student["user_id"]).eq("skill_id", str(skill_id)).execute()
        if ss.data:
            ss_id = ss.data[0]["student_skill_id"]
            new_conf = min(100, ss.data[0]["confidence_score"] + 20)
            client.table("skill_evidence").insert({
                "student_skill_id": ss_id,
                "evidence_type": "certification",
                "evidence_ref_id": cert_id,
                "weight": 2.0
            }).execute()
            client.table("student_skills").update({"confidence_score": new_conf}).eq("student_skill_id", ss_id).execute()
            
    return res.data

@router.get("/certifications")
def list_certifications(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("certifications").select("*").eq("student_id", student["user_id"]).execute()
    return res.data
