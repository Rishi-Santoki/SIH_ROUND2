from supabase import Client

def get_skill_gaps(client: Client, student_id: str, target_career_id: str):
    # Fetch student skills
    student_skills_resp = client.table("student_skills").select("skill_id, proficiency_level").eq("student_id", student_id).execute()
    student_skills_map = {s["skill_id"]: s["proficiency_level"] for s in student_skills_resp.data}
    
    # Fetch role skills
    role_skills_resp = client.table("role_skills").select("skill_id, required_level, is_mandatory, importance_weight, skills(name)").eq("career_role_id", target_career_id).execute()
    
    gaps = []
    for rs in role_skills_resp.data:
        skill_id = rs["skill_id"]
        req_level = rs["required_level"]
        cur_level = student_skills_map.get(skill_id, 0)
        gap_val = max(0, req_level - cur_level)
        
        status = "met"
        if gap_val > 0:
            status = "missing" if cur_level == 0 else "partial"
            
        gaps.append({
            "skill_name": rs["skills"]["name"],
            "skill_id": skill_id,
            "required_level": req_level,
            "current_level": cur_level,
            "gap": gap_val,
            "is_mandatory": rs["is_mandatory"],
            "importance_weight": rs["importance_weight"],
            "status": status
        })
        
    # Sort by importance DESC, gap DESC
    gaps.sort(key=lambda x: (x["importance_weight"], x["gap"]), reverse=True)
    return gaps

def get_skill_gap_summary(gaps: list) -> dict:
    met = sum(1 for g in gaps if g["status"] == "met")
    partial = sum(1 for g in gaps if g["status"] == "partial")
    missing = sum(1 for g in gaps if g["status"] == "missing")
    
    total_weight = sum(g["importance_weight"] for g in gaps)
    if total_weight == 0:
        return {"met": met, "partial": partial, "missing": missing, "completion_percentage": 0}
        
    weighted_completion = sum(g["importance_weight"] * (min(g["current_level"] / g["required_level"], 1.0) if g["required_level"] > 0 else 1.0) for g in gaps)
    return {
        "met": met,
        "partial": partial,
        "missing": missing,
        "completion_percentage": (weighted_completion / total_weight) * 100
    }

def calculate_readiness_percentage(gaps: list) -> float:
    if not gaps:
        return 0.0
    
    # Check mandatory missing
    mandatory_missing = any(g["is_mandatory"] and g["status"] == "missing" for g in gaps)
    
    total_weight = sum(g["importance_weight"] for g in gaps)
    if total_weight == 0:
        return 0.0
        
    weighted_score = sum(g["importance_weight"] * (min(g["current_level"] / g["required_level"], 1.0) if g["required_level"] > 0 else 1.0) for g in gaps)
    percentage = (weighted_score / total_weight) * 100
    
    # Boost-to-zero or severe cap if mandatory is missing
    # The prompt says: "boosted-to-zero-if-missing for any is_mandatory = true skill still at gap.status == 'missing' (mandatory gaps should visibly cap readiness - do not let strong optional skills mask a missing mandatory one)."
    if mandatory_missing:
        # Heavily cap it, e.g. cap at 20% or multiply by 0
        # The prompt says "boosted-to-zero-if-missing" meaning if mandatory missing, readiness is basically capped or zeroed. Let's cap at 0 for strictness or just multiply by 0. Let's cap at 0 to be literal, or cap at max 20%. Let's set to 0.
        percentage = 0.0
        
    return min(percentage, 100.0)

def calculate_match_score(client: Client, student_id: str, opportunity_id: str, target_career_id: str) -> dict:
    settings = client.table("platform_settings").select("match_score_weights").limit(1).execute()
    weights = settings.data[0]["match_score_weights"] if settings.data else {
        "skills": 0.40,
        "assessments": 0.20,
        "projects": 0.15,
        "eligibility": 0.10,
        "career_interest": 0.15
    }
    
    # Fetch opportunity skills
    opp_skills = client.table("opportunity_skills").select("skill_id, required_level, is_mandatory, skills(name)").eq("opportunity_id", opportunity_id).execute().data
    # Fetch student skills
    student_skills = client.table("student_skills").select("skill_id, proficiency_level, confidence_score").eq("student_id", student_id).execute().data
    
    ss_map = {s["skill_id"]: s for s in student_skills}
    
    skill_comp = 0
    matched = []
    partially_matched = []
    missing = []
    
    mandatory_missing = False
    
    if opp_skills:
        score_sum = 0
        for os in opp_skills:
            req = os["required_level"]
            sid = os["skill_id"]
            sname = os["skills"]["name"]
            st = ss_map.get(sid)
            if not st:
                missing.append(sname)
                if os["is_mandatory"]: mandatory_missing = True
                continue
                
            cur = st["proficiency_level"]
            if cur >= req:
                score_sum += 1.0
                matched.append(sname)
            else:
                score_sum += (cur / req)
                partially_matched.append(sname)
        skill_comp = (score_sum / len(opp_skills)) * (weights.get("skills", 0.40) * 100)
        if mandatory_missing:
            skill_comp *= 0.5 # penalty
            
    # Assessments (dummy calculation based on average confidence)
    avg_conf = sum(s["confidence_score"] for s in student_skills) / len(student_skills) if student_skills else 0
    assessment_evidence = avg_conf * (weights.get("assessments", 0.20) * 100)
    
    # Projects
    proj_count = len(client.table("projects").select("project_id").eq("student_id", student_id).execute().data)
    projects_experience = min((weights.get("projects", 0.15) * 100), proj_count * 5)
    
    # Eligibility
    eligibility = 0 if mandatory_missing else (weights.get("eligibility", 0.10) * 100)
    
    # Career Interest
    career_interest = (weights.get("career_interest", 0.15) * 100)
    
    total = skill_comp + assessment_evidence + projects_experience + eligibility + career_interest
    
    next_action = None
    if missing:
        next_action = f"Learn {missing[0]} to meet mandatory requirements."
    elif partially_matched:
        next_action = f"Improve {partially_matched[0]} to increase compatibility."
        
    return {
        "opportunity_id": opportunity_id,
        "match_score": total,
        "breakdown": {
            "skill_compatibility": skill_comp,
            "assessment_evidence": assessment_evidence,
            "projects_experience": projects_experience,
            "eligibility": eligibility,
            "career_interest": career_interest
        },
        "matched": matched,
        "partially_matched": partially_matched,
        "missing": missing,
        "next_best_action": next_action
    }
