def get_skill_proficiency(client, student_id: str, skill_id: str) -> dict:
    """
    Dynamically computes the proficiency of a skill for a student.
    If the skill is a leaf node (no children in skill_topic_weights), it returns the student_skills record directly.
    If it has children, it recursively computes the proficiency of each child,
    classifies them as untested/weak/strong, and rolls up a weighted average.
    
    Returns:
    {
        "skill_id": str,
        "proficiency_level": float,
        "coverage": float, # percentage of children tested (weighted)
        "untested_children": list,
        "weak_children": list,
        "strong_children": list,
        "is_leaf": bool
    }
    """
    # Fetch children weights
    res = client.table("skill_topic_weights").select("child_skill_id, weight, is_mandatory, skills!child_skill_id(name)").eq("parent_skill_id", skill_id).execute()
    children = res.data
    
    if not children:
        # Leaf node (or legacy node without children)
        # Fetch from student_skills
        sk_res = client.table("student_skills").select("proficiency_level, confidence_score, verification_status").eq("student_id", student_id).eq("skill_id", skill_id).execute()
        
        prof = sk_res.data[0].get("proficiency_level", 0) if sk_res.data else 0
        return {
            "skill_id": skill_id,
            "proficiency_level": float(prof),
            "coverage": 100.0 if sk_res.data else 0.0,
            "untested_children": [],
            "weak_children": [],
            "strong_children": [],
            "is_leaf": True
        }
    
    # It has children, so we must roll up
    untested_children = []
    weak_children = []
    strong_children = []
    
    total_weight = 0.0
    tested_weight = 0.0
    weighted_prof_sum = 0.0
    
    mandatory_untested_or_weak = False
    
    for child in children:
        c_id = child["child_skill_id"]
        c_name = child["skills"]["name"]
        weight = float(child["weight"])
        is_mand = child["is_mandatory"]
        
        total_weight += weight
        
        # Recursively get child proficiency
        c_prof_data = get_skill_proficiency(client, student_id, c_id)
        
        c_prof = c_prof_data["proficiency_level"]
        c_cov = c_prof_data["coverage"]
        
        child_info = {
            "skill_id": c_id,
            "name": c_name,
            "weight": weight,
            "is_mandatory": is_mand,
            "proficiency_level": c_prof
        }
        
        # Define thresholds. If coverage is 0, it's untested.
        if c_cov == 0:
            untested_children.append(child_info)
            if is_mand:
                mandatory_untested_or_weak = True
        elif c_prof < 3.0: # arbitrary 'weak' threshold (out of 5 usually)
            weak_children.append(child_info)
            tested_weight += weight
            weighted_prof_sum += (c_prof * weight)
            if is_mand:
                mandatory_untested_or_weak = True
        else:
            strong_children.append(child_info)
            tested_weight += weight
            weighted_prof_sum += (c_prof * weight)
            
    # Calculate rollup
    coverage = (tested_weight / total_weight) * 100.0 if total_weight > 0 else 0.0
    
    final_prof = 0.0
    if tested_weight > 0:
        final_prof = weighted_prof_sum / tested_weight
        
    # Cap if mandatory is missing/weak
    if mandatory_untested_or_weak and final_prof > 2.0:
        final_prof = 2.0 # Cap at weak if a mandatory sub-topic is missing/weak
        
    return {
        "skill_id": skill_id,
        "proficiency_level": round(final_prof, 2),
        "coverage": round(coverage, 2),
        "untested_children": untested_children,
        "weak_children": weak_children,
        "strong_children": strong_children,
        "is_leaf": False
    }
