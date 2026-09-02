from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_current_alumni
from app.models.alumni_schemas import AlumniSkillAdd, AlumniSkillMentorshipUpdate

router = APIRouter(prefix="/alumni/skills", tags=["Alumni Skills"])

@router.get("")
def get_my_skills(alumni: dict = Depends(get_current_alumni)):
    client: Client = alumni["client"]
    res = client.table("alumni_skills").select("alumni_skill_id, proficiency_level, skills(skill_id, name, category)").eq("alumni_id", alumni["user_id"]).execute()
    return res.data

@router.post("")
def add_skill(skill: AlumniSkillAdd, alumni: dict = Depends(get_current_alumni)):
    client: Client = alumni["client"]
    
    # Validate skill exists
    check = client.table("skills").select("skill_id").eq("skill_id", skill.skill_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Skill not found in platform taxonomy")
        
    try:
        res = client.table("alumni_skills").insert({
            "alumni_id": alumni["user_id"],
            "skill_id": skill.skill_id,
            "proficiency_level": skill.proficiency_level,
            "willing_to_mentor": skill.willing_to_mentor,
            "found_challenging": skill.found_challenging
        }).execute()
        return res.data[0]
    except Exception as e:
        if "duplicate key value violates unique constraint" in str(e).lower() or "23505" in str(e):
            raise HTTPException(status_code=409, detail="Skill already added to your profile")
        raise e

@router.delete("/{skill_id}")
def remove_skill(skill_id: str, alumni: dict = Depends(get_current_alumni)):
    client: Client = alumni["client"]
    res = client.table("alumni_skills").delete().eq("alumni_id", alumni["user_id"]).eq("skill_id", skill_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Skill not found in your profile")
    return {"message": "Skill removed"}

@router.patch("/{skill_id}/mentorship")
def update_mentorship_signal(skill_id: str, update: AlumniSkillMentorshipUpdate, alumni: dict = Depends(get_current_alumni)):
    client: Client = alumni["client"]
    data = update.model_dump(exclude_unset=True)
    if not data:
        return {"message": "No fields to update"}
        
    data["updated_at"] = "now()"
    res = client.table("alumni_skills").update(data).eq("alumni_id", alumni["user_id"]).eq("skill_id", skill_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Skill not found in your profile")
        
    return res.data[0]
