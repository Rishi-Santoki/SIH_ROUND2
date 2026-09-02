from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.core.config import get_settings
import jwt

security = HTTPBearer()

def get_supabase_client(token: str) -> Client:
    settings = get_settings()
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    # Set the auth token for the postgrest client to enforce RLS
    supabase.postgrest.auth(token)
    return supabase

def get_service_client() -> Client:
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def get_db_client(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Client:
    return get_supabase_client(credentials.credentials)

def get_authenticated_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    settings = get_settings()
    try:
        # Decode JWT to get user_id (sub). 
        # Verify signature using SUPABASE_JWT_SECRET
        payload = jwt.decode(
            token, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"], 
            audience="authenticated"
        )
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            
        client = get_supabase_client(token)
        response = client.table("users").select("*").eq("user_id", user_id).execute()
        
        if not response.data:
            # Token is valid but user profile doesn't exist yet (Registration incomplete)
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Registration incomplete")
            
        user_data = response.data[0]
        if not user_data.get("is_active"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended")
            
        return {
            "user_id": user_id, 
            "email": email,
            "role": user_data.get("role"),
            "is_active": user_data.get("is_active"),
            "full_name": user_data.get("full_name"),
            "token": token, 
            "client": client
        }
    except jwt.DecodeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

def get_current_student(user: dict = Depends(get_authenticated_user)) -> dict:
    if user["role"] != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as student")
    return user

def get_current_recruiter(user: dict = Depends(get_authenticated_user)) -> dict:
    if user["role"] != "industry":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as industry")
        
    client = user["client"]
    response = client.table("recruiter_profiles").select("company_id, is_primary_contact").eq("recruiter_id", user["user_id"]).execute()
    
    rp = response.data
    user["company_id"] = rp[0].get("company_id") if rp else None
    user["is_primary_contact"] = rp[0].get("is_primary_contact") if rp else False
    
    return user

def require_verified_company(recruiter: dict = Depends(get_current_recruiter)) -> dict:
    if not recruiter.get("company_id"):
        raise HTTPException(status_code=403, detail="No company associated")
        
    client = recruiter["client"]
    res = client.table("companies").select("verified").eq("company_id", recruiter["company_id"]).execute()
    
    if not res.data or not res.data[0].get("verified"):
        raise HTTPException(status_code=403, detail="Company must be verified to perform this action")
        
    return recruiter

def get_current_academician(user: dict = Depends(get_authenticated_user)) -> dict:
    if user["role"] != "academician":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as academician")
        
    client = user["client"]
    response = client.table("academician_profiles").select("institution_id").eq("academician_id", user["user_id"]).execute()
    
    ap = response.data
    user["institution_id"] = ap[0].get("institution_id") if ap else None
    
    return user

def get_current_alumni(user: dict = Depends(get_authenticated_user)) -> dict:
    if user["role"] != "alumni":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as alumni")
        
    client = user["client"]
    response = client.table("alumni_profiles").select("institution_id, is_verified").eq("alumni_id", user["user_id"]).execute()
    
    ap = response.data
    user["institution_id"] = ap[0].get("institution_id") if ap else None
    user["is_verified"] = ap[0].get("is_verified") if ap else False
    
    return user

def get_current_institution_admin(user: dict = Depends(get_authenticated_user)) -> dict:
    if user["role"] != "institution":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as institution admin")
        
    client = user["client"]
    response = client.table("institution_admins").select("institution_id, is_primary_contact").eq("admin_id", user["user_id"]).execute()
    
    ia = response.data
    user["institution_id"] = ia[0].get("institution_id") if ia else None
    user["is_primary_contact"] = ia[0].get("is_primary_contact") if ia else False
    
    return user

def get_current_assessment_staff(user: dict = Depends(get_authenticated_user)) -> dict:
    if user["role"] not in ('institution', 'super_admin'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage assessments")
    return user

def get_current_user(user: dict = Depends(get_authenticated_user)) -> dict:
    return user

def get_current_super_admin(user: dict = Depends(get_authenticated_user)) -> dict:
    if user["role"] != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized as super admin")
    return user

def get_admin_or_institution_admin(user: dict = Depends(get_authenticated_user)) -> dict:
    if user["role"] == "super_admin":
        return user
    if user["role"] == "institution":
        client = user["client"]
        response = client.table("institution_admins").select("institution_id").eq("admin_id", user["user_id"]).execute()
        ia = response.data
        user["institution_id"] = ia[0].get("institution_id") if ia else None
        return user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized. Must be super admin or institution admin.")

def log_admin_action(client: Client, actor_id: str, action: str, entity_type: str, entity_id: str = None, metadata: dict = None):
    client.table("audit_logs").insert({
        "actor_id": actor_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "metadata": metadata or {}
    }).execute()
