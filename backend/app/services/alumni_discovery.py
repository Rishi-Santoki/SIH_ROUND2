from fastapi import HTTPException
from supabase import Client

def _get_requester_institution_id(client: Client, user_id: str, role: str) -> str:
    if role == "student":
        res = client.table("student_profiles").select("institution_id").eq("student_id", user_id).execute()
    elif role == "academician":
        res = client.table("academician_profiles").select("institution_id").eq("academician_id", user_id).execute()
    else:
        raise HTTPException(status_code=403, detail="Invalid role for directory access")
        
    if not res.data or not res.data[0].get("institution_id"):
        raise HTTPException(status_code=403, detail="User is not associated with any institution")
    return res.data[0]["institution_id"]

def get_visible_alumni(client: Client, requesting_user: dict, search: str = None, department: str = None, graduation_year: int = None, current_profession: str = None, current_company: str = None, skill_id: str = None):
    inst_id = _get_requester_institution_id(client, requesting_user["user_id"], requesting_user["role"])
    
    query = client.table("alumni_profiles").select(
        "alumni_id, graduation_year, degree, department, current_profession, current_company, current_designation, previous_experience, expertise, bio, linkedin_url, profile_image, is_verified, users(full_name)"
    ).eq("is_verified", True).eq("institution_id", inst_id)
    
    if search:
        query = query.ilike("users.full_name", f"%{search}%")
    if department:
        query = query.ilike("department", f"%{department}%")
    if graduation_year:
        query = query.eq("graduation_year", graduation_year)
    if current_profession:
        query = query.ilike("current_profession", f"%{current_profession}%")
    if current_company:
        query = query.ilike("current_company", f"%{current_company}%")
        
    res = query.execute()
    results = res.data
    
    if skill_id and results:
        # Filter by skill_id
        a_ids = [r["alumni_id"] for r in results]
        s_res = client.table("alumni_skills").select("alumni_id").in_("alumni_id", a_ids).eq("skill_id", skill_id).execute()
        valid_a_ids = {s["alumni_id"] for s in s_res.data}
        results = [r for r in results if r["alumni_id"] in valid_a_ids]
        
    # Project to hide other fields
    output = []
    for r in results:
        user_data = r.pop("users", None)
        full_name = user_data.get("full_name") if user_data else "Unknown"
        r["full_name"] = full_name
        output.append(r)
        
    return output

def assert_same_institution(client: Client, requesting_user: dict, alumni_id: str) -> None:
    inst_id = _get_requester_institution_id(client, requesting_user["user_id"], requesting_user["role"])
    
    res = client.table("alumni_profiles").select("institution_id, is_verified").eq("alumni_id", alumni_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Alumni not found")
        
    ap = res.data[0]
    if not ap.get("is_verified"):
        raise HTTPException(status_code=404, detail="Alumni not found") # 404 to obscure existence
        
    if ap.get("institution_id") != inst_id:
        raise HTTPException(status_code=404, detail="Alumni not found") # 404 to obscure existence

def get_alumni_profile_for_user(client: Client, requesting_user: dict, alumni_id: str):
    assert_same_institution(client, requesting_user, alumni_id)
    
    res = client.table("alumni_profiles").select(
        "alumni_id, graduation_year, degree, department, current_profession, current_company, current_designation, previous_experience, expertise, bio, linkedin_url, profile_image, is_verified, users(full_name)"
    ).eq("alumni_id", alumni_id).execute()
    
    data = res.data[0]
    user_data = data.pop("users", None)
    data["full_name"] = user_data.get("full_name") if user_data else "Unknown"
    
    # fetch skills
    skills_res = client.table("alumni_skills").select("proficiency_level, skills(skill_id, name, category)").eq("alumni_id", alumni_id).execute()
    data["skills"] = skills_res.data
    
    return data
