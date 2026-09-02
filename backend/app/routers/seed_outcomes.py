from fastapi import APIRouter, Depends
from supabase import Client
import uuid
import random
from app.dependencies import get_current_super_admin

router = APIRouter(prefix="/admin/matching", tags=["Matching Outcomes"])

@router.post("/seed-outcomes")
def seed_outcomes(admin: dict = Depends(get_current_super_admin)):
    client: Client = admin["client"]
    
    # 1. Fetch an opportunity and some students (or we can just mock the applications without students if foreign keys allow, 
    # but let's fetch real ones to be safe)
    students_res = client.table("users").select("user_id").eq("role", "student").limit(60).execute()
    opps_res = client.table("opportunities").select("opportunity_id").limit(1).execute()
    
    if not students_res.data or not opps_res.data:
        return {"error": "Need at least 1 student and 1 opportunity seeded to run this."}
        
    opp_id = opps_res.data[0]["opportunity_id"]
    students = students_res.data
    
    # Generate 60 mock applications
    count = 0
    for s in students:
        student_id = s["user_id"]
        is_positive = count < 30
        
        # We want to skew the assessment_evidence to be much higher for positive outcomes
        if is_positive:
            assessment_evidence = random.uniform(15.0, 20.0) # High assessment evidence (out of 20 max in default weights)
            skill_comp = random.uniform(20.0, 30.0)
        else:
            assessment_evidence = random.uniform(2.0, 8.0) # Low assessment evidence
            skill_comp = random.uniform(25.0, 35.0) # Maybe skills were slightly higher, so skills isn't the primary driver
            
        projects_exp = random.uniform(5.0, 15.0)
        eligibility = 10.0
        career_interest = random.uniform(5.0, 15.0)
        
        total = assessment_evidence + skill_comp + projects_exp + eligibility + career_interest
        
        breakdown = {
            "skill_compatibility": skill_comp,
            "assessment_evidence": assessment_evidence,
            "projects_experience": projects_exp,
            "eligibility": eligibility,
            "career_interest": career_interest
        }
        
        app_res = client.table("applications").insert({
            "student_id": student_id,
            "opportunity_id": opp_id,
            "status": "selected" if is_positive else "rejected",
            "match_score": total,
            "match_score_breakdown": breakdown
        }).execute()
        
        app_id = app_res.data[0]["application_id"]
        
        # Insert audit log
        client.table("audit_logs").insert({
            "actor_id": admin["user_id"],
            "action": "candidate_selected" if is_positive else "candidate_rejected",
            "entity_type": "application",
            "entity_id": app_id,
            "details": {"reason": "Seeded data"}
        }).execute()
        
        count += 1
        
    return {"status": "success", "message": f"Seeded {count} applications and outcome signals (skewed on assessment_evidence)"}
