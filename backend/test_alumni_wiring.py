import requests
import json
from app.dependencies import get_service_client

from app.core.config import get_settings
from supabase import create_client

BASE_URL = "http://localhost:8000"
settings = get_settings()
supa = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def login(email, password="Test@12345"):
    auth_res = supa.auth.sign_in_with_password({"email": email, "password": password})
    token = auth_res.session.access_token
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def test_alumni_wiring():
    print("\n" + "=" * 60)
    print("STARTING ALUMNI DASHBOARD WIRING & DB VERIFICATION TEST")
    print("=" * 60)
    
    db = get_service_client()
    
    # Target Alumni: Meera Joshi
    alumni_email = "meera.joshi@ldrp.test"
    headers = login(alumni_email)
    
    # 1. Profile Verification: Get & Patch
    print("\n--- 1. Testing Edit Profile & Persistence ---")
    get_res = requests.get(f"{BASE_URL}/alumni/profile", headers=headers)
    assert get_res.status_code == 200, f"GET profile failed: {get_res.text}"
    profile_data = get_res.json()
    alumni_id = profile_data["alumni_id"]
    print(f"Alumni ID: {alumni_id}, Current Company: {profile_data.get('current_company')}")
    
    update_payload = {
        "current_designation": "Lead Cloud Engineer",
        "current_company": "Infosys Cloud Labs",
        "bio": "Specialist in enterprise cloud transformations and mentoring junior developers.",
        "graduation_year": 2024,
        "degree": "B.Tech",
        "department": "CSE"
    }
    patch_res = requests.patch(f"{BASE_URL}/alumni/profile", json=update_payload, headers=headers)
    assert patch_res.status_code == 200, f"PATCH profile failed: {patch_res.text}"
    
    # DB Spot-check
    db_profile = db.table("alumni_profiles").select("*").eq("alumni_id", alumni_id).execute()
    assert db_profile.data, "DB alumni profile not found"
    assert db_profile.data[0]["current_designation"] == "Lead Cloud Engineer"
    assert db_profile.data[0]["current_company"] == "Infosys Cloud Labs"
    print("[PASS] Profile update persisted directly in DB alumni_profiles!")

    # 2. Mentorship & Skills Toggles
    print("\n--- 2. Testing Skills & Mentorship Toggles ---")
    # Add a skill
    add_skill_res = requests.post(f"{BASE_URL}/alumni/skills", json={
        "skill_name": "Cloud Architecture",
        "willing_to_mentor": True,
        "found_challenging": False
    }, headers=headers)
    assert add_skill_res.status_code in [200, 409], f"Add skill failed: {add_skill_res.text}"
    
    # Get skills
    skills_res = requests.get(f"{BASE_URL}/alumni/skills", headers=headers)
    assert skills_res.status_code == 200, f"GET skills failed: {skills_res.text}"
    skills = skills_res.json()
    assert len(skills) > 0, "No skills returned"
    target_skill = skills[0]
    target_skill_id = target_skill["skill_id"]
    print(f"Testing skill: {target_skill.get('skills', {}).get('name') or target_skill_id}")
    
    # Toggle mentorship flags
    toggle_res = requests.patch(f"{BASE_URL}/alumni/skills/{target_skill_id}/mentorship", json={
        "willing_to_mentor": True,
        "found_challenging": False
    }, headers=headers)
    assert toggle_res.status_code == 200, f"Toggle mentorship failed: {toggle_res.text}"
    
    # DB Spot-check
    db_skill = db.table("alumni_skills").select("*").eq("alumni_id", alumni_id).eq("skill_id", target_skill_id).execute()
    assert db_skill.data, "Skill not in DB"
    assert db_skill.data[0]["willing_to_mentor"] is True
    print("[PASS] Mentorship flags persisted directly in DB alumni_skills!")

    # 3. Verification Request
    print("\n--- 3. Testing Submit for Verification ---")
    # First check status
    v_status_res = requests.get(f"{BASE_URL}/alumni/verification", headers=headers)
    assert v_status_res.status_code == 200, f"GET verification failed: {v_status_res.text}"
    print(f"Current verification status from API: {v_status_res.json()}")
    
    # Clear any pending request for clean testing
    db.table("verification_requests").delete().eq("entity_type", "alumni").eq("entity_id", alumni_id).execute()
    # Temporarily set is_verified to false to test submit request
    db.table("alumni_profiles").update({"is_verified": False}).eq("alumni_id", alumni_id).execute()
    
    # Re-login with updated status
    headers = login(alumni_email)
    
    sub_res = requests.post(f"{BASE_URL}/alumni/verification", json={
        "graduation_year": "2024",
        "roll_number": "LDRP2020CSE045",
        "document_name": "degree_certificate.pdf"
    }, headers=headers)
    assert sub_res.status_code == 200, f"Submit verification failed: {sub_res.text}"
    req_data = sub_res.json()
    assert req_data["status"] == "pending"
    print(f"Created verification request ID: {req_data.get('request_id')}")
    
    # DB Spot-check
    db_v = db.table("verification_requests").select("*").eq("entity_type", "alumni").eq("entity_id", alumni_id).execute()
    assert db_v.data, "Verification request not found in DB"
    assert db_v.data[0]["status"] == "pending"
    print("[PASS] Verification request persisted directly in DB verification_requests!")
    
    # Restore verified status for Meera Joshi so she remains verified for other features
    db.table("alumni_profiles").update({"is_verified": True}).eq("alumni_id", alumni_id).execute()
    db.table("verification_requests").update({"status": "approved"}).eq("request_id", req_data["request_id"]).execute()
    headers = login(alumni_email)

    # 4. Reply to a Message
    print("\n--- 4. Testing Reply to a Message ---")
    student_email = "rohan.mehta@ldrp.test"
    student_headers = login(student_email)
    
    # Student starts conversation with alumni
    start_res = requests.post(f"{BASE_URL}/community/conversations", json={"alumni_id": alumni_id}, headers=student_headers)
    assert start_res.status_code == 200, f"Student start conversation failed: {start_res.text}"
    convo_id = start_res.json()["conversation_id"]
    print(f"Active Conversation ID: {convo_id}")
    
    # Student sends initial question
    requests.post(f"{BASE_URL}/community/conversations/{convo_id}/messages", json={
        "message": "Hi Meera! Can you share tips on cloud architecture preparation?"
    }, headers=student_headers)
    
    # Alumni lists conversations
    convos_res = requests.get(f"{BASE_URL}/community/conversations", headers=headers)
    assert convos_res.status_code == 200, f"GET conversations failed: {convos_res.text}"
    convo_list = convos_res.json()
    assert any(c["conversation_id"] == convo_id for c in convo_list), "Conversation not in alumni list"
    
    # Alumni posts a reply!
    reply_text = "Hi Rahul! Absolutely. Focus on foundational distributed system concepts, AWS VPC networking, and containerization."
    reply_res = requests.post(f"{BASE_URL}/community/conversations/{convo_id}/messages", json={
        "message": reply_text
    }, headers=headers)
    assert reply_res.status_code == 200, f"Reply message failed: {reply_res.text}"
    reply_data = reply_res.json()
    message_id = reply_data["message_id"]
    print(f"Alumni reply created. Message ID: {message_id}")
    
    # DB Spot-check
    db_msg = db.table("messages").select("*").eq("message_id", message_id).execute()
    assert db_msg.data, "Message not found in DB messages"
    assert db_msg.data[0]["message"] == reply_text
    assert db_msg.data[0]["sender_id"] == alumni_id
    print("[PASS] Alumni reply persisted directly in DB messages!")

    # 5. Confirm specifically there is NO working "start conversation" capability for alumni
    print("\n--- 5. Confirming Alumni CANNOT Start Conversations (403 Forbidden Enforced) ---")
    alumni_start_res = requests.post(f"{BASE_URL}/community/conversations", json={
        "alumni_id": alumni_id
    }, headers=headers)
    assert alumni_start_res.status_code == 403, f"Expected 403 for alumni start conversation, got: {alumni_start_res.status_code}"
    print(f"[PASS] Backend properly rejected alumni start conversation with 403 Forbidden: {alumni_start_res.json().get('detail')}")

    print("\n" + "=" * 60)
    print("ALL ALUMNI DASHBOARD WIRING & DB TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_alumni_wiring()
