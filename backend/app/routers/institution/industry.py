from fastapi import APIRouter, Depends, Query
from supabase import Client
from typing import Optional
from app.dependencies import get_db_client, get_current_institution_admin
from app.core.analytics import get_industry_demand

router = APIRouter(prefix="/institution", tags=["Institution Industry Connections"])

@router.get("/industry-connections")
def get_industry_connections(admin: dict = Depends(get_current_institution_admin)):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    # Linked companies based on students' applications
    students_res = client.table("student_profiles").select("student_id").eq("institution_id", institution_id).execute()
    student_ids = [s["student_id"] for s in students_res.data]
    
    connections = []
    
    if student_ids:
        # Find distinct opportunities these students applied to
        apps_res = client.table("applications").select("opportunity_id, status").in_("student_id", student_ids).execute()
        opp_ids = list(set([a["opportunity_id"] for a in apps_res.data]))
        
        if opp_ids:
            # Find the companies for these opportunities
            opps = client.table("opportunities").select("company_id, companies(name, industry)").in_("opportunity_id", opp_ids).execute()
            
            comp_map = {}
            for o in opps.data:
                cid = o["company_id"]
                if cid not in comp_map:
                    comp_map[cid] = {
                        "company_id": cid,
                        "name": o["companies"]["name"],
                        "industry": o["companies"]["industry"],
                        "application_count": 0
                    }
                    
            for a in apps_res.data:
                # Need to map app -> opp -> company
                o_idx = next((x for x in opps.data if x["opportunity_id"] == a["opportunity_id"]), None)
                if o_idx:
                    comp_map[o_idx["company_id"]]["application_count"] += 1
                    
            connections = list(comp_map.values())
            
    return connections

@router.get("/skill-demand-trends")
def get_skill_demand_trends(
    months_window: Optional[int] = Query(None, description="Number of months to look back"),
    admin: dict = Depends(get_current_institution_admin)
):
    client: Client = admin["client"]
    
    skills_res = client.table("skills").select("skill_id, name").execute()
    skill_map = {s["skill_id"]: s["name"] for s in skills_res.data}
    
    # Reuses the exact same function as Academician Skill Pulse
    industry_demand = get_industry_demand(client, months_window=months_window, skill_map=skill_map)
    
    return {
        "time_window_months": months_window or "All Time",
        "demand_trends": industry_demand
    }
