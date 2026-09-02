from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_student
from app.core.matching import get_skill_gaps, get_skill_gap_summary

router = APIRouter(prefix="/student/skill-gap", tags=["Skill Gap"])

def _get_target_role(client: Client, student_id: str):
    res = client.table("student_profiles").select("target_career_id").eq("student_id", student_id).execute()
    if not res.data or not res.data[0].get("target_career_id"):
        raise HTTPException(status_code=400, detail="Target career role not set")
    return res.data[0]["target_career_id"]

@router.get("")
def get_gaps(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    target_role = _get_target_role(client, student["user_id"])
    return get_skill_gaps(client, student["user_id"], target_role)

@router.get("/summary")
def get_gap_summary(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    target_role = _get_target_role(client, student["user_id"])
    gaps = get_skill_gaps(client, student["user_id"], target_role)
    return get_skill_gap_summary(gaps)
