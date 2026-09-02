from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from typing import Optional
from app.dependencies import get_current_recruiter, require_verified_company
from app.core.matching import calculate_match_score

router = APIRouter(prefix="/industry", tags=["Industry Candidates"])

@router.get("/opportunities/{opportunity_id}/candidates")
def discover_candidates(opportunity_id: str, recruiter: dict = Depends(require_verified_company)):
    client: Client = recruiter["client"]
    company_id = recruiter["company_id"]
    
    # 1. Verify opp ownership
    opp = client.table("opportunities").select("company_id").eq("opportunity_id", opportunity_id).execute()
    if not opp.data or opp.data[0]["company_id"] != company_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    # 2. Scope the candidate pool (simple filter: students with at least 1 matching skill or already applied)
    # Since we can't easily do a complex cross-join filter in simple Supabase REST without an RPC, 
    # we'll fetch all applications for this opp, and all students. 
    # In a real app, an RPC `get_relevant_candidates` would be used. 
    
    # We will simulate fetching all students for demonstration, but stripping private data
    students_res = client.table("users").select("user_id").eq("role", "student").execute()
    
    # Fetch applications to see who applied
    apps = client.table("applications").select("student_id").eq("opportunity_id", opportunity_id).execute()
    applied_set = {a["student_id"] for a in apps.data}
    
    results = []
    # For each student, calculate score
    # Note: calculate_match_score needs target_career_id, but the industry doesn't care about the student's target career 
    # for the score itself (the function we wrote takes it to calculate readiness, but match_score takes opportunity_id)
    for s in students_res.data:
        student_id = s["user_id"]
        # Dummy target_career_id because the student side needed it, though opportunity match relies on opportunity_skills
        score_data = calculate_match_score(client, student_id, opportunity_id, target_career_id="")
        
        # Privacy filter
        is_applied = student_id in applied_set
        
        # Fetch evidence summary
        # Get student_skills with verification status
        ss = client.table("student_skills").select("skill_id, verification_status, skills(name)").eq("student_id", student_id).execute()
        evidence_summary = []
        for st in ss.data:
            evidence_summary.append({
                "skill": st["skills"]["name"],
                "verified": st["verification_status"] == "verified"
            })
            
        candidate_data = {
            "student_id": student_id,
            "match_score": score_data["match_score"],
            "breakdown": score_data["breakdown"],
            "matched": score_data["matched"],
            "partially_matched": score_data["partially_matched"],
            "missing": score_data["missing"],
            "evidence_summary": evidence_summary,
            "has_applied": is_applied
        }
        
        # If not applied, we don't include bio/resume (which are not in this dict anyway, but ensuring)
        results.append(candidate_data)
        
    results.sort(key=lambda x: x["match_score"], reverse=True)
    
    # Fetch weights version
    ver_res = client.table("platform_settings").select("setting_value").eq("setting_key", "weights_version").execute()
    weights_version = int(ver_res.data[0]["setting_value"]) if ver_res.data else 1
    
    return {
        "weights_version": weights_version,
        "candidates": results
    }

@router.get("/candidates/search")
def search_candidates(
    skill_name: Optional[str] = None, 
    min_proficiency: Optional[int] = None,
    recruiter: dict = Depends(get_current_recruiter)
):
    client: Client = recruiter["client"]
    
    # Without an RPC, searching students by skill name in Supabase REST:
    query = client.table("student_skills").select("student_id, proficiency_level, skills!inner(name)")
    if skill_name:
        query = query.ilike("skills.name", f"%{skill_name}%")
    if min_proficiency:
        query = query.gte("proficiency_level", min_proficiency)
        
    res = query.execute()
    
    # Return distinct student_ids with stripped projection
    students = list({s["student_id"] for s in res.data})
    
    return {"matched_student_ids": students, "privacy_note": "Request applications to view full profiles."}
