from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_student
from app.models.schemas import StudentSkillResponse, SkillDeclareRequest

router = APIRouter(prefix="/student/skills", tags=["Skills"])

def recalculate_confidence_score(client: Client, student_skill_id: str):
    # Fetch all evidence
    evidence = client.table("skill_evidence").select("weight").eq("student_skill_id", student_skill_id).execute()
    # Calculate sum of weights (could cap at 1.0 or whatever formula desired)
    new_score = min(sum(e["weight"] for e in evidence.data), 1.0) if evidence.data else 0.0
    client.table("student_skills").update({"confidence_score": new_score}).eq("student_skill_id", student_skill_id).execute()

@router.get("")
def get_skills(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("student_skills").select("*, skills(name), skill_evidence(*)").eq("student_id", student["user_id"]).execute()
    out = []
    for row in res.data:
        out.append({
            "skill_id": row["skill_id"],
            "skill_name": row["skills"]["name"],
            "proficiency_level": row["proficiency_level"],
            "confidence_score": row["confidence_score"],
            "verification_status": row["verification_status"],
            "evidence": row["skill_evidence"]
        })
    return out

@router.post("")
def declare_skill(req: SkillDeclareRequest, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    data = {
        "student_id": student["user_id"],
        "skill_id": str(req.skill_id),
        "proficiency_level": req.proficiency_level,
        "confidence_score": 0.0,
        "verification_status": "unverified",
        "source": "self_declared"
    }
    res = client.table("student_skills").insert(data).execute()
    return res.data

@router.get("/dna/{skill_id}")
def get_skill_dna(skill_id: str, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # Find student_skill_id
    ss = client.table("student_skills").select("student_skill_id").eq("student_id", student["user_id"]).eq("skill_id", skill_id).execute()
    if not ss.data:
        raise HTTPException(status_code=404, detail="Skill not found for student")
        
    res = client.table("skill_evidence").select("*").eq("student_skill_id", ss.data[0]["student_skill_id"]).execute()
    return res.data
