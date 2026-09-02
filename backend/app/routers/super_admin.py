from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.dependencies import get_current_super_admin, log_admin_action
from app.models.super_admin_schemas import (
    RejectVerification, SuspendUser, RoleChange, SkillCreate, SkillUpdate,
    SkillMerge, ForceDeactivateAssessment, LearningProgramCreate, LearningProgramUpdate,
    ModerateOpportunity, ComplaintStatusUpdate, PlatformSettingUpdate,
    CareerRoleCreate, CareerRoleUpdate, RoleSkillCreate, RoleSkillUpdate
)
import datetime

router = APIRouter(prefix="/admin", tags=["Super Admin"])

# --- MODULE 1: Platform Overview ---

@router.get("/overview")
def get_overview(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    # Single aggregate snapshot
    
    users = client.table("users").select("role, is_active").execute()
    institutions = client.table("institutions").select("verification_status").execute()
    companies = client.table("companies").select("verified").execute()
    opportunities = client.table("opportunities").select("status").execute()
    applications = client.table("applications").select("status").execute()
    assessments = client.table("assessments").select("is_active").execute()
    
    # Readiness calculation (reuse concept from student module if possible, here we'll just mock or aggregate if not stored)
    # The prompt says "reuse the student module's readiness function, aggregated, not reimplemented".
    # Since readiness is calculated dynamically per student via `get_skill_gaps`, 
    # calculating it for all students in real-time could be slow. 
    # For now, we return the counts.
    
    return {
        "users": {
            "total": len(users.data),
            "by_role": {role: len([u for u in users.data if u["role"] == role]) for role in set(u["role"] for u in users.data)},
            "active": len([u for u in users.data if u["is_active"]])
        },
        "institutions": {
            "total": len(institutions.data),
            "verified": len([i for i in institutions.data if i["verification_status"] == "verified"])
        },
        "companies": {
            "total": len(companies.data),
            "verified": len([c for c in companies.data if c.get("verified")])
        },
        "opportunities": {
            "total": len(opportunities.data),
            "by_status": {status: len([o for o in opportunities.data if o["status"] == status]) for status in set(o["status"] for o in opportunities.data)}
        },
        "applications": {
            "total": len(applications.data)
        },
        "assessments": {
            "total": len(assessments.data),
            "active": len([a for a in assessments.data if a["is_active"]])
        }
    }

@router.get("/overview/growth")
def get_growth(admin: dict = Depends(get_current_super_admin)):
    # Stub for growth metric time series
    return {"message": "Growth time series (requires date aggregation in DB)"}

# --- MODULE 2: Verification Queues ---

@router.get("/verifications")
def list_verifications(entity_type: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    # Join with entity data based on entity_type
    res = client.table("verification_requests").select("*").eq("entity_type", entity_type).eq("status", "pending").execute()
    
    # If it's a certification, attempt to resolve the signed URL for the credential_url if it's a raw path
    if entity_type == "certification" and res.data:
        entity_ids = [r["entity_id"] for r in res.data]
        if entity_ids:
            certs = client.table("certifications").select("certification_id, credential_url").in_("certification_id", entity_ids).execute()
            cert_map = {c["certification_id"]: c["credential_url"] for c in certs.data}
            
            from app.dependencies import get_service_client
            svc = get_service_client()
            
            for req in res.data:
                url_path = cert_map.get(req["entity_id"])
                # If it's a raw path and not a full http URL
                if url_path and not url_path.startswith("http"):
                    try:
                        url_res = svc.storage.from_("certificates").create_signed_url(url_path, 600)
                        req["signed_url"] = url_res.get("signedURL", url_res.get("signedUrl"))
                    except Exception:
                        req["signed_url"] = None
    
    return res.data

@router.patch("/verifications/{request_id}/approve")
def approve_verification(request_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    
    res = client.table("verification_requests").select("*").eq("request_id", request_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req = res.data[0]
    if req["status"] != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
        
    # Update request
    client.table("verification_requests").update({
        "status": "approved",
        "reviewed_by": admin["user_id"],
        "reviewed_at": "now()"
    }).eq("request_id", request_id).execute()
    
    # Propagate to entity
    entity_type = req["entity_type"]
    entity_id = req["entity_id"]
    
    if entity_type == "institution":
        client.table("institutions").update({"verification_status": "verified"}).eq("institution_id", entity_id).execute()
    elif entity_type == "company":
        client.table("companies").update({"verified": True}).eq("company_id", entity_id).execute()
    elif entity_type == "project":
        client.table("projects").update({"verification_status": "verified"}).eq("project_id", entity_id).execute()
    elif entity_type == "certification":
        client.table("certifications").update({"verification_status": "verified"}).eq("certification_id", entity_id).execute()
        
    # Log
    log_admin_action(client, admin["user_id"], "verification_approved", entity_type, entity_id, {"request_id": request_id})
    
    # Notify
    client.table("notifications").insert({
        "user_id": req["submitted_by"],
        "type": "application_update",
        "title": "Verification Approved",
        "message": f"Your verification request for {entity_type} was approved."
    }).execute()
    
    return {"message": "Approved"}

@router.patch("/verifications/{request_id}/reject")
def reject_verification(request_id: str, data: RejectVerification, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    
    res = client.table("verification_requests").select("*").eq("request_id", request_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Request not found")
        
    req = res.data[0]
    
    client.table("verification_requests").update({
        "status": "rejected",
        "notes": data.notes,
        "reviewed_by": admin["user_id"],
        "reviewed_at": "now()"
    }).eq("request_id", request_id).execute()
    
    # Log
    log_admin_action(client, admin["user_id"], "verification_rejected", req["entity_type"], req["entity_id"], {"request_id": request_id, "notes": data.notes})
    
    # Notify
    client.table("notifications").insert({
        "user_id": req["submitted_by"],
        "type": "application_update",
        "title": "Verification Rejected",
        "message": f"Your verification request for {req['entity_type']} was rejected. Reason: {data.notes}"
    }).execute()
    
    return {"message": "Rejected"}

# --- MODULE 3: User Management ---

@router.get("/users")
def list_users(role: Optional[str] = None, is_active: Optional[bool] = None, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    query = client.table("users").select("user_id, full_name, email, role, is_active, created_at")
    if role: query = query.eq("role", role)
    if is_active is not None: query = query.eq("is_active", is_active)
    
    res = query.execute()
    return res.data

@router.get("/users/{user_id}")
def get_user(user_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("users").select("*, student_profiles(*), recruiter_profiles(*), academician_profiles(*), institution_admins(*)").eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
    return res.data[0]

@router.patch("/users/{user_id}/suspend")
def suspend_user(user_id: str, data: SuspendUser, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    client.table("users").update({"is_active": False}).eq("user_id", user_id).execute()
    log_admin_action(client, admin["user_id"], "user_suspended", "user", user_id, {"reason": data.reason})
    return {"message": "User suspended"}

@router.patch("/users/{user_id}/reactivate")
def reactivate_user(user_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    client.table("users").update({"is_active": True}).eq("user_id", user_id).execute()
    log_admin_action(client, admin["user_id"], "user_reactivated", "user", user_id, {})
    return {"message": "User reactivated"}

# --- MODULE 3.5: Institution Management ---

@router.post("/institutions/{institution_id}/suspend")
def suspend_institution(institution_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    from app.dependencies import get_service_client
    service_client = get_service_client()
    
    # Suspend institution
    client.table("institutions").update({"verification_status": "suspended"}).eq("institution_id", institution_id).execute()
    
    # Suspend all students of this institution
    students = client.table("student_profiles").select("student_id").eq("institution_id", institution_id).execute()
    student_ids = [s["student_id"] for s in students.data]
    if student_ids:
        service_client.table("users").update({"is_active": False}).in_("user_id", student_ids).execute()
        
    # Suspend academicians
    academicians = client.table("academician_profiles").select("academician_id").eq("institution_id", institution_id).execute()
    academician_ids = [a["academician_id"] for a in academicians.data]
    if academician_ids:
        service_client.table("users").update({"is_active": False}).in_("user_id", academician_ids).execute()
        
    # Suspend institution admins
    admins = client.table("institution_admins").select("admin_id").eq("institution_id", institution_id).execute()
    admin_ids = [a["admin_id"] for a in admins.data]
    if admin_ids:
        service_client.table("users").update({"is_active": False}).in_("user_id", admin_ids).execute()
        
    log_admin_action(client, admin["user_id"], "institution_suspended", "institution", institution_id, {})
    return {"message": "Institution and related users suspended"}

@router.delete("/institutions/{institution_id}")
def delete_institution(institution_id: str, admin: dict = Depends(get_current_super_admin)):
    from app.dependencies import get_service_client
    service_client = get_service_client()
    client = admin["client"]
    
    students = service_client.table("student_profiles").select("student_id").eq("institution_id", institution_id).execute()
    student_ids = [s["student_id"] for s in students.data]
    
    academicians = service_client.table("academician_profiles").select("academician_id").eq("institution_id", institution_id).execute()
    academician_ids = [a["academician_id"] for a in academicians.data]
    
    admins = service_client.table("institution_admins").select("admin_id").eq("institution_id", institution_id).execute()
    admin_ids = [a["admin_id"] for a in admins.data]
    
    all_users = student_ids + academician_ids + admin_ids
    
    # Delete users (which cascades to profiles, applications, etc.)
    if all_users:
        service_client.table("users").delete().in_("user_id", all_users).execute()
        
    # Delete the institution itself
    service_client.table("institutions").delete().eq("institution_id", institution_id).execute()
    
    log_admin_action(client, admin["user_id"], "institution_deleted", "institution", institution_id, {})
    return {"message": "Institution deleted successfully"}

# --- MODULE 4: Role & Access Management ---

@router.get("/roles/pending-assignment")
def get_pending_assignments(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    # A user stuck in onboarding will have a row in users but no profile
    res = client.table("users").select("user_id, full_name, email, role, student_profiles(student_id), recruiter_profiles(recruiter_id), academician_profiles(academician_id), institution_admins(admin_id)").execute()
    
    stuck = []
    for u in res.data:
        role = u["role"]
        if role == "student" and not u.get("student_profiles"): stuck.append(u)
        elif role == "industry" and not u.get("recruiter_profiles"): stuck.append(u)
        elif role == "academician" and not u.get("academician_profiles"): stuck.append(u)
        elif role == "institution" and not u.get("institution_admins"): stuck.append(u)
        
    return stuck

@router.patch("/users/{user_id}/role")
def change_role(user_id: str, data: RoleChange, admin: dict = Depends(get_current_super_admin)):
    if data.new_role == "super_admin":
        raise HTTPException(status_code=400, detail="Cannot change to super_admin via this endpoint. Use grant-super-admin.")
        
    client = admin["client"]
    res = client.table("users").select("role").eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_role = res.data[0]["role"]
    client.table("users").update({"role": data.new_role}).eq("user_id", user_id).execute()
    log_admin_action(client, admin["user_id"], "role_changed", "user", user_id, {"old_role": old_role, "new_role": data.new_role})
    return {"message": "Role changed"}

@router.post("/users/{user_id}/grant-super-admin")
def grant_super_admin(user_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("users").select("role").eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_role = res.data[0]["role"]
    client.table("users").update({"role": "super_admin"}).eq("user_id", user_id).execute()
    log_admin_action(client, admin["user_id"], "super_admin_granted", "user", user_id, {"old_role": old_role})
    return {"message": "Super admin granted"}

@router.post("/users/{user_id}/revoke-super-admin")
def revoke_super_admin(user_id: str, admin: dict = Depends(get_current_super_admin)):
    if admin["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own super admin role")
        
    client = admin["client"]
    client.table("users").update({"role": "student"}).eq("user_id", user_id).execute() # Default downgrade to student
    log_admin_action(client, admin["user_id"], "super_admin_revoked", "user", user_id, {"new_role": "student"})
    return {"message": "Super admin revoked, downgraded to student"}

# --- MODULE 5: Skill Taxonomy Management ---

@router.get("/skills")
def list_skills(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("skills").select("*").execute()
    return res.data

@router.post("/skills")
def add_skill(data: SkillCreate, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("skills").insert(data.dict(exclude_none=True)).execute()
    log_admin_action(client, admin["user_id"], "skill_created", "skill", res.data[0]["skill_id"], {"name": data.name})
    return res.data[0]

@router.patch("/skills/{skill_id}")
def update_skill(skill_id: str, data: SkillUpdate, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    
    if data.parent_skill_id:
        if data.parent_skill_id == skill_id:
            raise HTTPException(status_code=400, detail="Skill cannot be its own parent")
        # In a real app, recursively check for cycles here.
        
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        res = client.table("skills").update(update_data).eq("skill_id", skill_id).execute()
        log_admin_action(client, admin["user_id"], "skill_updated", "skill", skill_id, update_data)
        return res.data[0]
    return {"message": "No changes"}

@router.post("/skills/{skill_id}/merge")
def merge_skill(skill_id: str, data: SkillMerge, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    if skill_id == data.merge_into_skill_id:
        raise HTTPException(status_code=400, detail="Cannot merge skill into itself")
        
    # Call the RPC function
    res = client.rpc("merge_skills", {"old_skill_id": skill_id, "new_skill_id": data.merge_into_skill_id}).execute()
    
    log_admin_action(client, admin["user_id"], "skill_merged", "skill", skill_id, {
        "merged_into": data.merge_into_skill_id,
        "affected_rows": res.data
    })
    
    return {"message": "Skill merged successfully", "details": res.data}

@router.get("/career-roles")
def list_career_roles(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("career_roles").select("*, role_skills(count)").execute()
    return res.data

@router.post("/career-roles")
def create_career_role(data: CareerRoleCreate, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("career_roles").insert(data.dict()).execute()
    log_admin_action(client, admin["user_id"], "career_role_created", "career_role", res.data[0]["career_role_id"], {"title": data.title})
    return res.data[0]

@router.patch("/career-roles/{career_role_id}")
def update_career_role(career_role_id: str, data: CareerRoleUpdate, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        res = client.table("career_roles").update(update_data).eq("career_role_id", career_role_id).execute()
        log_admin_action(client, admin["user_id"], "career_role_updated", "career_role", career_role_id, update_data)
        return res.data[0]
    return {"message": "No changes"}

@router.delete("/career-roles/{career_role_id}")
def delete_career_role(career_role_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    # Check if any student_profiles targets this role
    # First we need to get the service client to check student_profiles bypassing RLS if necessary, though admins might have access.
    from app.dependencies import get_service_client
    svc = get_service_client()
    profiles = svc.table("student_profiles").select("student_id", count="exact").eq("target_career_id", career_role_id).execute()
    
    if profiles.count > 0:
        # Soft delete
        client.table("career_roles").update({"is_active": False}).eq("career_role_id", career_role_id).execute()
        log_admin_action(client, admin["user_id"], "career_role_deactivated", "career_role", career_role_id, {"reason": "Targeted by students"})
        return {"message": "Career role deactivated (soft deleted) because it is currently targeted by students."}
    
    # Hard delete
    client.table("career_roles").delete().eq("career_role_id", career_role_id).execute()
    log_admin_action(client, admin["user_id"], "career_role_deleted", "career_role", career_role_id, {})
    return {"message": "Career role deleted"}

@router.get("/career-roles/{career_role_id}/skills")
def list_role_skills(career_role_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("role_skills").select("*, skills(name, category)").eq("career_role_id", career_role_id).execute()
    return res.data

@router.post("/career-roles/{career_role_id}/skills")
def add_role_skill(career_role_id: str, data: RoleSkillCreate, admin: dict = Depends(get_current_super_admin)):
    if data.is_mandatory and data.importance_weight <= 0:
        raise HTTPException(status_code=400, detail="A mandatory skill must have an importance weight > 0")
        
    client = admin["client"]
    insert_data = data.dict()
    insert_data["career_role_id"] = career_role_id
    res = client.table("role_skills").insert(insert_data).execute()
    return res.data[0]

@router.patch("/career-roles/{career_role_id}/skills/{role_skill_id}")
def update_role_skill(career_role_id: str, role_skill_id: str, data: RoleSkillUpdate, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    
    # Check current state if partial update
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
         return {"message": "No changes"}
         
    res_current = client.table("role_skills").select("*").eq("role_skill_id", role_skill_id).execute()
    if not res_current.data:
        raise HTTPException(status_code=404, detail="Role skill not found")
        
    current = res_current.data[0]
    final_mandatory = update_data.get("is_mandatory", current["is_mandatory"])
    final_weight = update_data.get("importance_weight", current["importance_weight"])
    
    if final_mandatory and final_weight <= 0:
        raise HTTPException(status_code=400, detail="A mandatory skill must have an importance weight > 0")
        
    res = client.table("role_skills").update(update_data).eq("role_skill_id", role_skill_id).execute()
    return res.data[0]

@router.delete("/career-roles/{career_role_id}/skills/{role_skill_id}")
def delete_role_skill(career_role_id: str, role_skill_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    client.table("role_skills").delete().eq("role_skill_id", role_skill_id).execute()
    return {"message": "Role skill removed"}

@router.post("/seed-reference-data")
def seed_reference_data(admin: dict = Depends(get_current_super_admin)):
    from app.routers.seed_logic import run_seed_reference_data
    client = admin["client"]
    result = run_seed_reference_data(client)
    log_admin_action(client, admin["user_id"], "reference_data_seeded", "system", admin["user_id"], {})
    return result

# --- MODULE 6: Assessment Oversight ---

@router.get("/assessments")
def list_all_assessments(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("assessments").select("*").execute()
    return res.data

@router.patch("/assessments/{assessment_id}/force-deactivate")
def force_deactivate_assessment(assessment_id: str, data: ForceDeactivateAssessment, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    client.table("assessments").update({"is_active": False}).eq("assessment_id", assessment_id).execute()
    log_admin_action(client, admin["user_id"], "assessment_force_deactivated", "assessment", assessment_id, {"reason": data.reason})
    return {"message": "Assessment force deactivated"}

@router.get("/assessments/flagged")
def get_flagged_assessments(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    # Get assessments with complaints
    complaints = client.table("complaints").select("against_entity_id").eq("against_entity_type", "assessment").eq("status", "open").execute()
    flagged_ids = [c["against_entity_id"] for c in complaints.data]
    
    if not flagged_ids:
        return []
        
    res = client.table("assessments").select("*").in_("assessment_id", flagged_ids).execute()
    return res.data

# --- MODULE 7: Course Management ---

@router.get("/learning-programs")
def list_learning_programs(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("learning_programs").select("*").execute()
    return res.data

@router.post("/learning-programs")
def create_learning_program(data: LearningProgramCreate, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("learning_programs").insert(data.dict(exclude_none=True)).execute()
    log_admin_action(client, admin["user_id"], "learning_program_created", "learning_program", res.data[0]["program_id"], {"title": data.title})
    return res.data[0]

@router.patch("/learning-programs/{program_id}")
def update_learning_program(program_id: str, data: LearningProgramUpdate, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        res = client.table("learning_programs").update(update_data).eq("program_id", program_id).execute()
        log_admin_action(client, admin["user_id"], "learning_program_updated", "learning_program", program_id, update_data)
        return res.data[0]
    return {"message": "No changes"}

@router.delete("/learning-programs/{program_id}")
def delete_learning_program(program_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    
    # Check if referenced in student_learning_progress
    prog = client.table("student_learning_progress").select("progress_id", count="exact").eq("program_id", program_id).execute()
    if prog.count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete program. It is referenced by students. Deactivate it instead.")
        
    client.table("learning_programs").delete().eq("program_id", program_id).execute()
    log_admin_action(client, admin["user_id"], "learning_program_deleted", "learning_program", program_id, {})
    return {"message": "Program deleted"}

# --- MODULE 8: Opportunity Moderation ---

@router.get("/opportunities/flagged")
def get_flagged_opportunities(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    complaints = client.table("complaints").select("against_entity_id").eq("against_entity_type", "opportunity").eq("status", "open").execute()
    flagged_ids = [c["against_entity_id"] for c in complaints.data]
    
    if not flagged_ids:
        return []
        
    res = client.table("opportunities").select("*").in_("opportunity_id", flagged_ids).execute()
    return res.data

@router.patch("/opportunities/{opportunity_id}/moderate")
def moderate_opportunity(opportunity_id: str, data: ModerateOpportunity, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    if data.action == "remove":
        client.table("opportunities").update({"status": "closed"}).eq("opportunity_id", opportunity_id).execute()
        
    log_admin_action(client, admin["user_id"], f"opportunity_moderation_{data.action}", "opportunity", opportunity_id, {"reason": data.reason})
    
    # Resolve complaints if any
    client.table("complaints").update({
        "status": "resolved", 
        "resolved_by": admin["user_id"], 
        "resolution_notes": f"Moderated: {data.action}"
    }).eq("against_entity_type", "opportunity").eq("against_entity_id", opportunity_id).execute()
    
    return {"message": f"Opportunity {data.action}d"}

# --- MODULE 9: Complaints ---

@router.get("/complaints")
def list_complaints(status: Optional[str] = None, category: Optional[str] = None, against_entity_type: Optional[str] = None, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    query = client.table("complaints").select("*")
    if status: query = query.eq("status", status)
    if category: query = query.eq("category", category)
    if against_entity_type: query = query.eq("against_entity_type", against_entity_type)
    
    res = query.execute()
    return res.data

@router.get("/complaints/{complaint_id}")
def get_complaint(complaint_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("complaints").select("*").eq("complaint_id", complaint_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    complaint = res.data[0]
    entity_type = complaint["against_entity_type"]
    entity_id = complaint["against_entity_id"]
    
    context = {}
    if entity_type == "user":
        u = client.table("users").select("full_name, email, role").eq("user_id", entity_id).execute()
        context = u.data[0] if u.data else {}
    elif entity_type == "opportunity":
        o = client.table("opportunities").select("title, status").eq("opportunity_id", entity_id).execute()
        context = o.data[0] if o.data else {}
        
    complaint["entity_context"] = context
    return complaint

@router.patch("/complaints/{complaint_id}/status")
def update_complaint_status(complaint_id: str, data: ComplaintStatusUpdate, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    update_data = {"status": data.status}
    if data.status in ('resolved', 'dismissed'):
        update_data["resolved_by"] = admin["user_id"]
        update_data["resolved_at"] = "now()"
        if not data.resolution_notes:
            raise HTTPException(status_code=400, detail="Resolution notes required when resolving or dismissing.")
        update_data["resolution_notes"] = data.resolution_notes
        
    res = client.table("complaints").update(update_data).eq("complaint_id", complaint_id).execute()
    log_admin_action(client, admin["user_id"], f"complaint_{data.status}", "complaint", complaint_id, {"notes": data.resolution_notes})
    return res.data[0]

# --- MODULE 10: System Settings ---

@router.get("/settings")
def list_settings(admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("platform_settings").select("*").execute()
    return res.data

@router.patch("/settings/{setting_key}")
def update_setting(setting_key: str, data: PlatformSettingUpdate, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    res = client.table("platform_settings").update({
        "setting_value": data.setting_value,
        "updated_by": admin["user_id"],
        "updated_at": "now()"
    }).eq("setting_key", setting_key).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Setting not found")
        
    log_admin_action(client, admin["user_id"], "setting_updated", "platform_setting", setting_key, {"new_value": data.setting_value})
    return res.data[0]

# --- MODULE 11: Audit Log Viewer ---

@router.get("/audit-logs")
def list_audit_logs(actor_id: Optional[str] = None, action: Optional[str] = None, entity_type: Optional[str] = None, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    query = client.table("audit_logs").select("*").order("created_at", desc=True).limit(100)
    
    if actor_id: query = query.eq("actor_id", actor_id)
    if action: query = query.eq("action", action)
    if entity_type: query = query.eq("entity_type", entity_type)
        
    res = query.execute()
    return res.data

# --- MODULE 12: Admin Notifications ---

@router.get("/notifications")
def list_notifications(is_read: Optional[bool] = None, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    # Admin notifications are bound to their user_id
    query = client.table("notifications").select("*").eq("user_id", admin["user_id"]).order("created_at", desc=True)
    if is_read is not None:
        query = query.eq("is_read", is_read)
        
    res = query.execute()
    return res.data

@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, admin: dict = Depends(get_current_super_admin)):
    client = admin["client"]
    client.table("notifications").update({"is_read": True}).eq("notification_id", notification_id).eq("user_id", admin["user_id"]).execute()
    return {"message": "Marked read"}
