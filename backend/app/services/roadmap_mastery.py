from supabase import Client
from typing import List, Dict, Any, Optional

from app.services.skill_rollup import get_skill_proficiency

def get_mastery_status(client: Client, student_id: str, skill_id: str, target_role_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Module 2: Mastery Filter
    Returns {"status": "missing" | "partial" | "mastered" | "needs_assessment", "current_level": int, "required_level": int, "untested_children": list}
    """
    required_level = 0
    if target_role_id:
        role_res = client.table("role_skills") \
            .select("required_level") \
            .eq("career_role_id", target_role_id) \
            .eq("skill_id", skill_id) \
            .execute()
        if role_res.data:
            required_level = role_res.data[0].get("required_level", 0)

    prof_data = get_skill_proficiency(client, student_id, skill_id)
    current_level = prof_data["proficiency_level"]
    untested_children = prof_data.get("untested_children", [])
    
    status_resp = {
        "status": "missing",
        "current_level": current_level,
        "required_level": required_level,
        "untested_children": untested_children
    }
    
    if current_level == 0:
        status_resp["status"] = "missing"
        return status_resp
        
    if current_level < required_level:
        status_resp["status"] = "partial"
        return status_resp
        
    if prof_data["is_leaf"]:
        skill_res = client.table("student_skills").select("student_skill_id, verification_status").eq("student_id", student_id).eq("skill_id", skill_id).execute()
        if skill_res.data:
            student_skill = skill_res.data[0]
            student_skill_id = student_skill["student_skill_id"]
            evidence_res = client.table("skill_evidence").select("evidence_type").eq("student_skill_id", student_skill_id).execute()
            
            has_verified = any(ev.get("evidence_type") in ["assessment", "certification", "mentor", "internship", "project"] for ev in evidence_res.data)
            if not has_verified and student_skill.get("verification_status") != "verified":
                status_resp["status"] = "partial"
                return status_resp
                
    status_resp["status"] = "mastered"
    return status_resp

def get_known_prerequisite_skills(client: Client, student_id: str, skill_id: str) -> List[str]:
    """
    Module 2: Known Prerequisites
    Traverses parent_skill_id to find foundational skills the student has mastered.
    Returns a list of mastered skill names.
    """
    # Simple recursive CTE to fetch ancestors
    # Supabase Python client doesn't support raw SQL easily unless we use an RPC.
    # Alternative: Fetch all skills into memory, build tree, and trace up.
    # Since skills table is small, we can just fetch all or do a loop.
    
    skills_res = client.table("skills").select("skill_id, parent_skill_id, name").execute()
    skill_dict = {s["skill_id"]: s for s in skills_res.data}
    
    ancestors = []
    current_id = skill_dict.get(skill_id, {}).get("parent_skill_id")
    
    while current_id and current_id in skill_dict:
        ancestors.append(skill_dict[current_id])
        current_id = skill_dict[current_id].get("parent_skill_id")
        
    mastered_ancestors = []
    for ancestor in ancestors:
        status = get_mastery_status(client, student_id, ancestor["skill_id"])
        if status["status"] == "mastered":
            mastered_ancestors.append(ancestor["name"])
            
    return mastered_ancestors
