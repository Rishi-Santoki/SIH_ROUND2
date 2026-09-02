from supabase import Client
from collections import defaultdict
from typing import List, Dict

def get_industry_demand(client: Client, months_window: int = None, skill_map: dict = None) -> List[dict]:
    # Aggregates opportunity skills. Optionally filter by time window (created_at >= now - months_window).
    # MVP: all open opportunities if no time window.
    query = client.table("opportunities").select("opportunity_id").eq("status", "open")
    
    # If months_window is provided, add time filter in real implementation.
    # We'll just fetch all for now and aggregate.
    opps_res = query.execute()
    open_opp_ids = [o["opportunity_id"] for o in opps_res.data]
    
    demand_counts = defaultdict(int)
    if open_opp_ids:
        opp_skills_res = client.table("opportunity_skills").select("skill_id").in_("opportunity_id", open_opp_ids).execute()
        for os in opp_skills_res.data:
            demand_counts[os["skill_id"]] += 1
            
    industry_demand = []
    for skill_id, count in demand_counts.items():
        if count > 10:
            level = "HIGH"
        elif count > 3:
            level = "MODERATE"
        else:
            level = "LOW"
            
        industry_demand.append({
            "skill": skill_map.get(skill_id, "Unknown") if skill_map else skill_id,
            "demand_level": level,
            "opportunity_count": count,
            "_skill_id": skill_id
        })
    return industry_demand

def get_student_readiness(client: Client, student_ids: List[str], skill_map: dict = None) -> List[dict]:
    readiness_aggregates = defaultdict(list)
    if student_ids:
        student_skills_res = client.table("student_skills").select("skill_id, proficiency_level").in_("student_id", student_ids).execute()
        for ss in student_skills_res.data:
            readiness_aggregates[ss["skill_id"]].append(ss["proficiency_level"])
            
    student_readiness = []
    for skill_id, profs in readiness_aggregates.items():
        avg_prof = sum(profs) / len(profs)
        if avg_prof >= 3.5:
            level = "HIGH"
        elif avg_prof >= 2.0:
            level = "MODERATE"
        else:
            level = "LOW"
            
        student_readiness.append({
            "skill": skill_map.get(skill_id, "Unknown") if skill_map else skill_id,
            "readiness_level": level,
            "avg_proficiency": round(avg_prof, 1),
            "_skill_id": skill_id
        })
    return student_readiness

def generate_insights(industry_demand: List[dict], student_readiness: List[dict]) -> List[dict]:
    insights = []
    readiness_lookup = {r["_skill_id"]: r for r in student_readiness}
    
    for d in industry_demand:
        if d["demand_level"] == "HIGH":
            r = readiness_lookup.get(d["_skill_id"])
            if not r or r["readiness_level"] in ["LOW", "MODERATE"]:
                skill_name = d["skill"]
                r_level = r["readiness_level"] if r else "MISSING"
                insights.append({
                    "skill": skill_name,
                    "insight": f"{skill_name} has a high supply-demand gap (Demand: HIGH, Readiness: {r_level}).",
                    "action": f"Recommend industry-led {skill_name} workshop or FDP.",
                    "suggested_collaboration_type": "fdp"
                })
    return insights
