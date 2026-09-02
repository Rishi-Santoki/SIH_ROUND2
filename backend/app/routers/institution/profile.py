from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_institution_admin
from app.models.institution_schemas import InstitutionProfileUpdate, AdminInvite, VerificationRequestCreate

router = APIRouter(prefix="/institution", tags=["Institution Profile"])

@router.get("/profile")
def get_profile(admin: dict = Depends(get_current_institution_admin)):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    inst_res = client.table("institutions").select("*").eq("institution_id", institution_id).execute()
    if not inst_res.data:
        raise HTTPException(status_code=404, detail="Institution not found")
        
    institution = inst_res.data[0]
    
    # Check verification status
    ver_res = client.table("verification_requests").select("status").eq("entity_id", institution_id).eq("entity_type", "institution").order("created_at", desc=True).limit(1).execute()
    
    institution["verification_status"] = ver_res.data[0]["status"] if ver_res.data else "none"
    institution["is_primary_contact"] = admin["is_primary_contact"]
    
    return institution

@router.patch("/profile")
def update_profile(profile_data: InstitutionProfileUpdate, admin: dict = Depends(get_current_institution_admin)):
    if not admin["is_primary_contact"]:
        raise HTTPException(status_code=403, detail="Only the primary contact can update the institution profile")
        
    update_dict = {k: v for k, v in profile_data.dict(exclude_unset=True).items() if v is not None}
    if not update_dict:
        return {"message": "No fields to update"}
        
    # url conversion
    if "website" in update_dict:
        update_dict["website"] = str(update_dict["website"])
        
    client: Client = admin["client"]
    client.table("institutions").update(update_dict).eq("institution_id", admin["institution_id"]).execute()
    
    return {"message": "Profile updated successfully"}

@router.post("/verify")
def request_verification(req: VerificationRequestCreate, admin: dict = Depends(get_current_institution_admin)):
    client: Client = admin["client"]
    
    payload = {
        "entity_id": admin["institution_id"],
        "entity_type": "institution",
        "requested_by": admin["user_id"],
        "document_url": str(req.document_url),
        "comments": req.comments
    }
    
    try:
        client.table("verification_requests").insert(payload).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    return {"message": "Verification requested successfully"}

@router.post("/admins/invite")
def invite_admin(invite: AdminInvite, admin: dict = Depends(get_current_institution_admin)):
    if not admin["is_primary_contact"]:
        raise HTTPException(status_code=403, detail="Only the primary contact can invite other admins")
        
    # In a real system, this would generate an invite link or trigger an email.
    return {"message": f"Invite sent to {invite.email} for role {invite.designation}"}

from app.models.institution_schemas import InstitutionOnboarding
from app.dependencies import get_authenticated_user

@router.post("/profile/onboarding")
def onboard_institution(data: InstitutionOnboarding, user: dict = Depends(get_authenticated_user), client: Client = Depends(get_db_client)):
    if user["role"] != "institution":
        raise HTTPException(status_code=403, detail="Not authorized as institution")
        
    existing = client.table("institution_admins").select("admin_id").eq("admin_id", user["user_id"]).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Profile already exists")
        
    institution_id = data.institution_id
    is_primary = False
    
    if data.new_institution_name:
        # Create new institution
        i_res = client.table("institutions").insert({"name": data.new_institution_name}).execute()
        institution_id = i_res.data[0]["institution_id"]
        is_primary = True # First admin is primary
        
    if not institution_id:
        raise HTTPException(status_code=400, detail="Must provide institution_id or new_institution_name")
        
    # Create profile
    res = client.table("institution_admins").insert({
        "admin_id": user["user_id"],
        "institution_id": str(institution_id),
        "designation": data.designation,
        "is_primary_contact": is_primary
    }).execute()
    
    return res.data
