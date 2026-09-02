from supabase import Client
from typing import Optional
from app.routers.skills import recalculate_confidence_score
from app.core.matching import get_skill_gaps, calculate_readiness_percentage
from fastapi import HTTPException

def record_assessment_evidence(client: Client, result_id: str) -> None:
    """
    Closes the loop (USP 10) by taking a finalized assessment_results row, 
    generating skill_evidence, updating student_skills, resolving reassessment flags,
    and recalculating the career readiness (Career Digital Twin).
    """
    
    # 1. Fetch the result and the linked assessment
    res = client.table("assessment_results").select("*, assessments(skill_id, title)").eq("result_id", result_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Assessment result not found")
        
    result = res.data[0]
    assessment = result.get("assessments", {})
    skill_id = assessment.get("skill_id")
    student_id = result.get("student_id")
    percentage = result.get("percentage") or 0.0
    
    # If there is no skill_id, this is a general aptitude test — no specific skill DNA update.
    if not skill_id:
        return
        
    # 2. Find or create the student_skills row for this skill_id
    student_skill_res = client.table("student_skills").select("*").eq("student_id", student_id).eq("skill_id", skill_id).execute()
    
    # Simple banding 1-5 scale based on percentage for first-time creation
    banding_level = 1
    if percentage >= 80: banding_level = 5
    elif percentage >= 60: banding_level = 4
    elif percentage >= 40: banding_level = 3
    elif percentage >= 20: banding_level = 2
    
    if student_skill_res.data:
        student_skill_id = student_skill_res.data[0]["student_skill_id"]
    else:
        # Create student_skill row
        insert_res = client.table("student_skills").insert({
            "student_id": student_id,
            "skill_id": skill_id,
            "proficiency_level": banding_level,
            "source": "assessment",
            "confidence_score": 0 # Will be recalculated
        }).execute()
        student_skill_id = insert_res.data[0]["student_skill_id"]
        
    # 3. Insert skill_evidence row
    # Weight logic: simple linear map from percentage, e.g. 1.0 to 3.0
    weight = max(1.0, (percentage / 100.0) * 3.0)
    
    client.table("skill_evidence").insert({
        "student_skill_id": student_skill_id,
        "evidence_type": "assessment",
        "evidence_ref_id": result_id,
        "weight": weight,
        "verified_by": None # Auto-verified
    }).execute()
    
    # 4. Call student module's existing recalculate_confidence_score
    recalculate_confidence_score(client, student_skill_id)
    
    # 5. Call readiness recalculation (Career Digital Twin)
    # To do this, we need the student's target_career_id.
    profile_res = client.table("student_profiles").select("target_career_id").eq("student_id", student_id).execute()
    if profile_res.data and profile_res.data[0].get("target_career_id"):
        target_career_id = profile_res.data[0]["target_career_id"]
        # Readiness recalculation happens implicitly when queried, but if we need to store it:
        # In this backend, readiness is calculated on the fly via get_skill_gaps -> calculate_readiness_percentage
        # We don't store an aggregated readiness score in the DB to avoid drift.
        # But we verify it works by calling it.
        gaps = get_skill_gaps(client, student_id, target_career_id)
        readiness = calculate_readiness_percentage(gaps)
        # We can update the target_career_id timestamp or log it, but since it's on the fly, 
        # the requirement "recalculate readiness" is satisfied by updating the underlying confidence_score/proficiency.
    
    # 6. Resolve reassessment flags in learning_progress
    # If the student had a learning_progress row requiring reassessment for this skill
    # we mark it resolved.
    prog_res = client.table("student_learning_progress").select("progress_id").eq("student_id", student_id).eq("skill_id", skill_id).eq("reassessment_required", True).execute()
    for prog in prog_res.data:
        client.table("student_learning_progress").update({
            "reassessment_required": False
        }).eq("progress_id", prog["progress_id"]).execute()
        
    # 7. Emit a notification to the student
    assessment_title = assessment.get("title", "Assessment")
    client.table("notifications").insert({
        "user_id": student_id,
        "type": "feedback",
        "title": "Skill Verified via Assessment",
        "message": f"Your score of {percentage}% on '{assessment_title}' has verified your skill and updated your Career Digital Twin.",
        "is_read": False
    }).execute()
