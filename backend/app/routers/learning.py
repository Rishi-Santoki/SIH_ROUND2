from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import List
from pydantic import UUID4
from app.dependencies import get_db_client, get_current_student
from app.core.matching import get_skill_gaps
from app.routers.gaps import _get_target_role
from app.models.schemas import LearningProgressUpdate

router = APIRouter(prefix="/student/learning-progress", tags=["Learning"])

@router.get("/recommendations")
def get_learning_recommendations(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    target_role = _get_target_role(client, student["user_id"])
    gaps = get_skill_gaps(client, student["user_id"], target_role)
    
    missing_gaps = [g for g in gaps if g["status"] in ["missing", "partial"]]
    
    recs = []
    # In a real impl, fetch program_skills matching the missing skill_ids
    return recs

@router.get("/available")
def list_available_programs(client: Client = Depends(get_db_client)):
    res = client.table("learning_programs").select("program_id, title, description, duration, mode, url, is_free, is_active").eq("is_active", True).execute()
    return res.data

@router.post("")
def enroll_program(program_id: UUID4, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    existing = client.table("student_learning_progress").select("*").eq("student_id", student["user_id"]).eq("program_id", str(program_id)).execute()
    if existing.data:
        return existing.data
    data = {
        "student_id": student["user_id"],
        "program_id": str(program_id),
        "status": "in_progress",
        "progress_percentage": 0
    }
    res = client.table("student_learning_progress").insert(data).execute()
    return res.data

@router.patch("/{progress_id}")
def update_progress(progress_id: str, update: LearningProgressUpdate, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("student_learning_progress").update(update.model_dump()).eq("progress_id", progress_id).eq("student_id", student["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
        
    response_data = res.data[0]
    if update.status == "completed":
        # USP 10 Closed Loop Validation
        prog_skills = client.table("program_skills").select("skill_id").eq("program_id", response_data["program_id"]).execute()
        skill_ids = [ps["skill_id"] for ps in prog_skills.data]
        return {
            "data": response_data,
            "reassessment_required": True,
            "skill_ids": skill_ids,
            "message": "Course completed! Please take the associated assessment to verify your skills."
        }
    return {"data": response_data}

@router.get("")
def list_progress(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("student_learning_progress").select("*, learning_programs(*)").eq("student_id", student["user_id"]).execute()
    return res.data
