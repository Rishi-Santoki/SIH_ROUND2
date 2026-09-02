from supabase import Client
from typing import List, Dict, Any, Optional
from app.core.matching import get_skill_gaps
from app.services.alumni_discovery import get_visible_alumni
from fastapi import HTTPException

def get_verified_mentor_signal(alumni_id: str, skill_id: str) -> Optional[Dict[str, Any]]:
    # --------------------------------------------------------------------------------
    # FUTURE SEAM: This function is currently a placeholder that returns None.
    # When the graduation/role-conversion feature is built, alumni will carry forward 
    # their `skill_evidence` history from when they were students. This function can 
    # then be implemented to return real verified history (e.g. "they struggled with 
    # this skill and closed the gap") without rewriting the ranking function's structure.
    # --------------------------------------------------------------------------------
    return None

def get_recommended_mentors(client: Client, student: dict, limit: int = 5) -> List[dict]:
    student_id = student["user_id"]
    
    # 1. Get the student's target role to find gaps
    sp_res = client.table("student_profiles").select("target_role_id").eq("student_id", student_id).execute()
    if not sp_res.data or not sp_res.data[0].get("target_role_id"):
        return [] # No target role, no gaps to match on
    
    target_role_id = sp_res.data[0]["target_role_id"]
    
    # 2. Get gaps (already sorted by importance_weight DESC, gap size DESC)
    gaps = get_skill_gaps(client, student_id, target_role_id)
    active_gaps = [g for g in gaps if g["status"] in ("missing", "partial")]
    
    if not active_gaps:
        return []
        
    gap_skill_ids = [g["skill_id"] for g in active_gaps]
    gap_map = {g["skill_id"]: g for g in active_gaps}
    
    # 3. Get the pool of visible, verified, same-institution alumni
    # We pass the student object which contains user_id and role
    visible_alumni = get_visible_alumni(client, requesting_user=student)
    if not visible_alumni:
        return []
        
    alumni_map = {a["alumni_id"]: a for a in visible_alumni}
    alumni_ids = list(alumni_map.keys())
    
    # 4. Fetch skills for these alumni that match the gap skills
    skills_res = client.table("alumni_skills").select(
        "alumni_id, skill_id, proficiency_level, willing_to_mentor, found_challenging"
    ).in_("alumni_id", alumni_ids).in_("skill_id", gap_skill_ids).execute()
    
    candidates = []
    
    for askill in skills_res.data:
        aid = askill["alumni_id"]
        sid = askill["skill_id"]
        gap_info = gap_map[sid]
        
        prof = askill.get("proficiency_level") or 1
        will_mentor = askill.get("willing_to_mentor") or False
        found_chal = askill.get("found_challenging") or False
        
        # Base relevance
        score = prof * 10
        
        # Boosts
        if will_mentor:
            score += 50
        if found_chal:
            score += 5
            
        # Check future verified signal
        ver_sig = get_verified_mentor_signal(aid, sid)
        if ver_sig:
            score += ver_sig.get("boost", 0)
            
        candidates.append({
            "alumni": alumni_map[aid],
            "skill_id": sid,
            "skill_name": gap_info["skill_name"],
            "gap_name": gap_info["skill_name"],
            "gap_importance": gap_info["importance_weight"],
            "prof": prof,
            "will_mentor": will_mentor,
            "found_chal": found_chal,
            "ver_sig": ver_sig,
            "score": score
        })
        
    # Rank combined candidates: first by the gap's importance weight, then by alumni score
    candidates.sort(key=lambda x: (x["gap_importance"], x["score"]), reverse=True)
    
    # Deduplicate: only show an alumni once for their best matched gap
    seen_alumni = set()
    final_results = []
    
    for c in candidates:
        aid = c["alumni"]["alumni_id"]
        if aid in seen_alumni:
            continue
            
        seen_alumni.add(aid)
        
        # Generate honest reason string
        reason = ""
        name = c["alumni"]["full_name"]
        skill_name = c["skill_name"]
        
        if c["ver_sig"] and c["ver_sig"].get("reason"):
            reason = c["ver_sig"]["reason"]
        elif c["will_mentor"] and c["found_chal"]:
            reason = f"{name} opted in as a mentor for {skill_name} and mentioned finding it challenging when they first learned it."
        elif c["will_mentor"]:
            reason = f"{name} opted in as a mentor for {skill_name}."
        else:
            reason = f"{name} is currently proficient in {skill_name} — one of your top gaps."
            
        final_results.append({
            "alumni_id": aid,
            "full_name": name,
            "current_profession": c["alumni"].get("current_profession"),
            "current_company": c["alumni"].get("current_company"),
            "is_verified": c["alumni"].get("is_verified", False),
            "matched_skill": skill_name,
            "gap_name": skill_name,
            "reason": reason
        })
        
        if len(final_results) >= limit:
            break
            
    return final_results
