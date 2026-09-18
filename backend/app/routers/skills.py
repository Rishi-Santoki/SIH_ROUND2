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
    known_skills = {
        "5c92c843-1c11-4660-973f-4ddc1c45517d": "Python",
        "a6a2d9b3-7be4-42b8-b304-49516c9313ae": "Distributed Systems",
        "e2c3c361-a47a-484f-8724-25acf91184e8": "Machine Learning",
        "e1b0937e-5bda-4ba3-9feb-0d837392d08c": "Deep Learning",
        "b5c4c7d4-9b4b-4f5a-ab69-ad4f728542d5": "SQL",
        "8668df4c-3c55-44a4-a691-927635a73d60": "Docker",
        "0b53163f-585c-4a45-a888-7584331c2625": "Data Structures",
        "008bc456-d8e4-4267-baeb-1242b45a6b8a": "Kubernetes",
        "2cbda795-e600-4b1b-bde3-c629664493d2": "CI/CD",
        "af96495d-f8a7-4dda-9303-acf60fa24595": "Natural Language Processing"
    }
    out = []
    for row in (res.data or []):
        skill_id = row["skill_id"]
        skill_name = known_skills.get(skill_id)
        if not skill_name and row.get("skills"):
            if isinstance(row["skills"], dict):
                skill_name = row["skills"].get("name")
            elif isinstance(row["skills"], list) and len(row["skills"]) > 0:
                skill_name = row["skills"][0].get("name")
        if not skill_name:
            skill_name = f"Skill {skill_id[:8]}"

        out.append({
            "skill_id": skill_id,
            "skill_name": skill_name,
            "proficiency_level": row.get("proficiency_level", 1),
            "confidence_score": row.get("confidence_score", 0.0),
            "verification_status": row.get("verification_status", "unverified"),
            "evidence": row.get("skill_evidence", [])
        })
    return out

@router.get("/available")
def get_available_skills(client: Client = Depends(get_db_client)):
    return [
        {"skill_id": "5c92c843-1c11-4660-973f-4ddc1c45517d", "name": "Python", "category": "Programming Languages"},
        {"skill_id": "a6a2d9b3-7be4-42b8-b304-49516c9313ae", "name": "Distributed Systems", "category": "Systems"},
        {"skill_id": "e2c3c361-a47a-484f-8724-25acf91184e8", "name": "Machine Learning", "category": "Data & AI"},
        {"skill_id": "e1b0937e-5bda-4ba3-9feb-0d837392d08c", "name": "Deep Learning", "category": "Data & AI"},
        {"skill_id": "b5c4c7d4-9b4b-4f5a-ab69-ad4f728542d5", "name": "SQL", "category": "Databases"},
        {"skill_id": "8668df4c-3c55-44a4-a691-927635a73d60", "name": "Docker", "category": "Cloud & DevOps"},
        {"skill_id": "0b53163f-585c-4a45-a888-7584331c2625", "name": "Data Structures", "category": "Computer Science"},
        {"skill_id": "008bc456-d8e4-4267-baeb-1242b45a6b8a", "name": "Kubernetes", "category": "Cloud & DevOps"},
        {"skill_id": "2cbda795-e600-4b1b-bde3-c629664493d2", "name": "CI/CD", "category": "Cloud & DevOps"},
        {"skill_id": "af96495d-f8a7-4dda-9303-acf60fa24595", "name": "Natural Language Processing", "category": "Data & AI"}
    ]

@router.post("")
def declare_skill(req: SkillDeclareRequest, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    target_skill_id = str(req.skill_id) if req.skill_id else None
    
    known_name_map = {
        "python": "5c92c843-1c11-4660-973f-4ddc1c45517d",
        "distributed systems": "a6a2d9b3-7be4-42b8-b304-49516c9313ae",
        "machine learning": "e2c3c361-a47a-484f-8724-25acf91184e8",
        "deep learning": "e1b0937e-5bda-4ba3-9feb-0d837392d08c",
        "sql": "b5c4c7d4-9b4b-4f5a-ab69-ad4f728542d5",
        "docker": "8668df4c-3c55-44a4-a691-927635a73d60",
        "data structures": "0b53163f-585c-4a45-a888-7584331c2625",
        "kubernetes": "008bc456-d8e4-4267-baeb-1242b45a6b8a",
        "ci/cd": "2cbda795-e600-4b1b-bde3-c629664493d2",
        "natural language processing": "af96495d-f8a7-4dda-9303-acf60fa24595"
    }
    
    if not target_skill_id and req.skill_name:
        name_clean = req.skill_name.strip().lower()
        target_skill_id = known_name_map.get(name_clean, "a6a2d9b3-7be4-42b8-b304-49516c9313ae")
        
    if not target_skill_id:
        target_skill_id = "a6a2d9b3-7be4-42b8-b304-49516c9313ae"

    # Check if already declared
    already = client.table("student_skills").select("*").eq("student_id", student["user_id"]).eq("skill_id", target_skill_id).execute()
    if already.data:
        client.table("student_skills").update({
            "proficiency_level": req.proficiency_level,
            "source": "self_declared",
            "verification_status": "unverified"
        }).eq("student_id", student["user_id"]).eq("skill_id", target_skill_id).execute()
        return already.data[0]

    data = {
        "student_id": student["user_id"],
        "skill_id": target_skill_id,
        "proficiency_level": req.proficiency_level,
        "confidence_score": 0.0,
        "verification_status": "unverified",
        "source": "self_declared"
    }
    res = client.table("student_skills").insert(data).execute()
    return res.data[0] if res.data else {"status": "success"}

@router.get("/dna/{skill_id}")
def get_skill_dna(skill_id: str, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # Find student_skill_id
    ss = client.table("student_skills").select("student_skill_id").eq("student_id", student["user_id"]).eq("skill_id", skill_id).execute()
    if not ss.data:
        raise HTTPException(status_code=404, detail="Skill not found for student")
        
    res = client.table("skill_evidence").select("*").eq("student_skill_id", ss.data[0]["student_skill_id"]).execute()
    return res.data
