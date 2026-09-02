from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
import uuid
from app.dependencies import get_db_client, get_current_institution_admin
from app.core.analytics import get_industry_demand, get_student_readiness, generate_insights
from app.models.institution_schemas import InterventionCreate, InterventionResponse

router = APIRouter(prefix="/institution/interventions", tags=["Institution Interventions"])

@router.get("/recommended")
def get_recommended_interventions(admin: dict = Depends(get_current_institution_admin)):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    skills_res = client.table("skills").select("skill_id, name").execute()
    skill_map = {s["skill_id"]: s["name"] for s in skills_res.data}
    
    industry_demand = get_industry_demand(client, skill_map=skill_map)
    
    students_res = client.table("student_profiles").select("student_id").eq("institution_id", institution_id).execute()
    student_ids = [s["student_id"] for s in students_res.data]
    
    student_readiness = get_student_readiness(client, student_ids, skill_map)
    
    # Reuses the exact same function as Academician Skill Pulse
    insights = generate_insights(industry_demand, student_readiness)
    
    return insights

@router.post("/{recommendation_id}/act", response_model=InterventionResponse)
def act_on_intervention(recommendation_id: str, intervention: InterventionCreate, admin: dict = Depends(get_current_institution_admin)):
    client: Client = admin["client"]
    institution_id = admin["institution_id"]
    
    # Take a readiness snapshot for history
    skills_res = client.table("skills").select("skill_id, name").execute()
    skill_map = {s["skill_id"]: s["name"] for s in skills_res.data}
    
    students_res = client.table("student_profiles").select("student_id").eq("institution_id", institution_id).execute()
    student_ids = [s["student_id"] for s in students_res.data]
    
    snapshot = get_student_readiness(client, student_ids, skill_map)
    
    if intervention.mode == "notification" and intervention.target_student_ids:
        notifications = []
        for sid in intervention.target_student_ids:
            notifications.append({
                "user_id": sid,
                "title": "Action Required: Skill Gap Identified",
                "message": intervention.action,
                "type": "intervention"
            })
        if notifications:
            client.table("notifications").insert(notifications).execute()
            
    elif intervention.mode == "collaboration" and intervention.proposed_collaboration_type:
        # Create a faculty collaboration draft without an academician yet
        client.table("faculty_collaborations").insert({
            "collaboration_type": intervention.proposed_collaboration_type,
            "title": f"Institution Initiative: {intervention.proposed_collaboration_type.capitalize()}",
            "description": intervention.action,
            "status": "proposed"
        }).execute()
        
    # Record intervention in DB
    res = client.table("institution_interventions").insert({
        "institution_id": institution_id,
        "admin_id": admin["user_id"],
        "action_type": intervention.mode,
        "target_students": intervention.target_student_ids or [],
        "readiness_snapshot": snapshot,
        "notes": intervention.action
    }).execute()
    
    return InterventionResponse(
        intervention_id=res.data[0]["intervention_id"],
        status="success",
        message=f"Intervention triggered: {intervention.action}"
    )

@router.get("/history")
def get_intervention_history(admin: dict = Depends(get_current_institution_admin)):
    client: Client = admin["client"]
    res = client.table("institution_interventions").select("*").eq("institution_id", admin["institution_id"]).order("created_at", desc=True).execute()
    return res.data
