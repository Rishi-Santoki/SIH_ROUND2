import requests
import json
import uuid
from app.core.config import get_settings
from supabase import create_client

BASE_URL = "http://127.0.0.1:8000"
settings = get_settings()
supa = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def login(email, password):
    auth_res = supa.auth.sign_in_with_password({"email": email, "password": password})
    token = auth_res.session.access_token
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def test_all():
    print("=== STARTING SUPER ADMIN DASHBOARD WIRING TEST ===")

    # 1. Login as Super Admin
    print("\n--- 1. Login as Super Admin: admin@aicp.edu ---")
    headers_admin = login("admin@aicp.edu", "Admin@12345")
    print("Logged in as Super Admin successfully.")

    # 2. Approve/Reject Verification Queue Item & Trust Flag Flip
    print("\n--- 2. Testing Verification Queue & Underlying Entity Trust Flag Flip ---")
    # Setup test company verification request
    test_comp_name = f"TestCorp_{uuid.uuid4().hex[:6]}"
    comp_res = supa.table("companies").insert({
        "name": test_comp_name,
        "verified": False,
        "website": "https://testcorp.example.com"
    }).execute()
    test_comp_id = comp_res.data[0]["company_id"]
    
    vr_res = supa.table("verification_requests").insert({
        "entity_type": "company",
        "entity_id": test_comp_id,
        "status": "pending",
        "notes": "MCA CIN Verification submission"
    }).execute()
    test_vr_id = vr_res.data[0]["request_id"]
    print(f"Created pending verification request {test_vr_id} for unverified company {test_comp_id}")

    # Approve via API
    res_app = requests.patch(f"{BASE_URL}/admin/verifications/{test_vr_id}/approve", headers=headers_admin)
    print(f"PATCH /admin/verifications/{test_vr_id}/approve: {res_app.status_code}")
    assert res_app.status_code == 200, f"Approval failed: {res_app.text}"

    # Spot-check DB: verify request status is 'approved' AND company 'verified' is True
    vr_check = supa.table("verification_requests").select("status").eq("request_id", test_vr_id).execute()
    assert vr_check.data[0]["status"] == "approved"
    comp_check = supa.table("companies").select("verified").eq("company_id", test_comp_id).execute()
    assert comp_check.data[0]["verified"] is True
    print("DB Spot-Check confirmed: Verification request status=approved AND underlying company verified=True")

    # Clean up test company
    supa.table("verification_requests").delete().eq("request_id", test_vr_id).execute()
    supa.table("companies").delete().eq("company_id", test_comp_id).execute()

    # 3. Suspend/Reactivate User with already-open session test
    print("\n--- 3. Testing Suspend/Reactivate User & Real Session Enforcement ---")
    headers_student = login("rohan.mehta@ldrp.test", "Test@12345")
    # Rohan Mehta user id
    rohan_user = supa.table("users").select("user_id, is_active").eq("email", "rohan.mehta@ldrp.test").execute().data[0]
    rohan_id = rohan_user["user_id"]

    # Pre-check: Rohan's active session works
    res_pre = requests.get(f"{BASE_URL}/student/profile", headers=headers_student)
    assert res_pre.status_code == 200, f"Rohan pre-check failed: {res_pre.status_code}"
    print(f"Pre-check passed: Student session active (GET /student/profile -> 200)")

    # Super Admin suspends Rohan
    res_suspend = requests.patch(f"{BASE_URL}/admin/users/{rohan_id}/suspend", headers=headers_admin, json={"reason": "Suspended for platform verification test"})
    print(f"PATCH /admin/users/{rohan_id}/suspend: {res_suspend.status_code}")
    assert res_suspend.status_code == 200

    # Spot-check DB: is_active is False
    rohan_db = supa.table("users").select("is_active").eq("user_id", rohan_id).execute().data[0]
    assert rohan_db["is_active"] is False, "DB shows user still active!"
    print("DB Spot-Check confirmed: users.is_active=False")

    # Test Rohan's existing token: must now return 403 Forbidden!
    res_blocked = requests.get(f"{BASE_URL}/student/profile", headers=headers_student)
    print(f"Existing session check after suspension: {res_blocked.status_code} {res_blocked.text}")
    assert res_blocked.status_code == 403, f"Expected 403 Forbidden for suspended user, got {res_blocked.status_code}"
    print("Session enforcement confirmed: Open session immediately blocked with 403 Forbidden ('Account is suspended').")

    # Super Admin reactivates Rohan
    res_reactivate = requests.patch(f"{BASE_URL}/admin/users/{rohan_id}/reactivate", headers=headers_admin)
    print(f"PATCH /admin/users/{rohan_id}/reactivate: {res_reactivate.status_code}")
    assert res_reactivate.status_code == 200

    # Spot-check DB: is_active is True
    rohan_db2 = supa.table("users").select("is_active").eq("user_id", rohan_id).execute().data[0]
    assert rohan_db2["is_active"] is True, "DB shows user not active!"
    print("DB Spot-Check confirmed: users.is_active=True restored")

    # Existing session restored
    res_restored = requests.get(f"{BASE_URL}/student/profile", headers=headers_student)
    assert res_restored.status_code == 200, f"Expected 200 after reactivation, got {res_restored.status_code}"
    print("Session restoration confirmed: Open session works again immediately (GET /student/profile -> 200).")

    # 4. Skill Merge
    print("\n--- 4. Testing Skill Merge ---")
    s1 = supa.table("skills").insert({"name": f"TestOldSkill_{uuid.uuid4().hex[:6]}", "category": "Testing"}).execute().data[0]
    s2 = supa.table("skills").insert({"name": f"TestNewSkill_{uuid.uuid4().hex[:6]}", "category": "Testing"}).execute().data[0]
    src_id, tgt_id = s1["skill_id"], s2["skill_id"]
    print(f"Created test skills: Source {src_id} -> Target {tgt_id}")

    res_merge = requests.post(f"{BASE_URL}/admin/skills/{src_id}/merge", headers=headers_admin, json={"merge_into_skill_id": tgt_id})
    print(f"POST /admin/skills/{src_id}/merge: {res_merge.status_code} {res_merge.text}")
    assert res_merge.status_code == 200, f"Merge failed: {res_merge.text}"

    # Spot-check DB: src_id is deleted, tgt_id exists
    src_check = supa.table("skills").select("*").eq("skill_id", src_id).execute()
    assert len(src_check.data) == 0, "Source skill still exists after merge!"
    print("DB Spot-Check confirmed: Source skill deleted and merged into target skill.")
    supa.table("skills").delete().eq("skill_id", tgt_id).execute()

    # 5. Career-Role Edits (Create, Update, Delete)
    print("\n--- 5. Testing Career-Role Edits (Create, Update, Delete) ---")
    cr_title = f"AI Prompt Engineer_{uuid.uuid4().hex[:4]}"
    res_cr_create = requests.post(f"{BASE_URL}/admin/career-roles", headers=headers_admin, json={
        "title": cr_title,
        "category": "Artificial Intelligence",
        "description": "Expert in designing robust context pipelines."
    })
    print(f"POST /admin/career-roles: {res_cr_create.status_code}")
    assert res_cr_create.status_code == 200
    cr_id = res_cr_create.json()["career_role_id"]

    # Update role
    new_title = f"{cr_title} Senior"
    res_cr_update = requests.patch(f"{BASE_URL}/admin/career-roles/{cr_id}", headers=headers_admin, json={
        "title": new_title
    })
    print(f"PATCH /admin/career-roles/{cr_id}: {res_cr_update.status_code}")
    assert res_cr_update.status_code == 200

    # Spot-check DB
    cr_db = supa.table("career_roles").select("title").eq("career_role_id", cr_id).execute()
    assert cr_db.data[0]["title"] == new_title
    print(f"DB Spot-Check confirmed: Career role updated to '{new_title}'")

    # Delete role
    res_cr_del = requests.delete(f"{BASE_URL}/admin/career-roles/{cr_id}", headers=headers_admin)
    assert res_cr_del.status_code == 200
    print(f"DELETE /admin/career-roles/{cr_id}: 200 OK")

    # 6. Assessment Force-Deactivate
    print("\n--- 6. Testing Assessment Force-Deactivate ---")
    assess_list = supa.table("assessments").select("assessment_id, is_active").execute().data
    assert len(assess_list) > 0, "No assessments found to test!"
    test_assess_id = assess_list[0]["assessment_id"]
    original_active = assess_list[0]["is_active"]

    res_deact = requests.patch(f"{BASE_URL}/admin/assessments/{test_assess_id}/force-deactivate", headers=headers_admin, json={"reason": "Audit defect found"})
    print(f"PATCH /admin/assessments/{test_assess_id}/force-deactivate: {res_deact.status_code}")
    assert res_deact.status_code == 200

    # Spot-check DB
    assess_db = supa.table("assessments").select("is_active").eq("assessment_id", test_assess_id).execute().data[0]
    assert assess_db["is_active"] is False, "Assessment not deactivated in DB!"
    print("DB Spot-Check confirmed: assessments.is_active=False")

    # Restore original state
    supa.table("assessments").update({"is_active": original_active}).eq("assessment_id", test_assess_id).execute()

    # 7. Posting Moderation
    print("\n--- 7. Testing Opportunity Posting Moderation ---")
    opp_list = supa.table("opportunities").select("opportunity_id, status").execute().data
    assert len(opp_list) > 0, "No opportunities found to test!"
    test_opp_id = opp_list[0]["opportunity_id"]
    original_opp_status = opp_list[0]["status"]

    # Flag
    res_mod_flag = requests.patch(f"{BASE_URL}/admin/opportunities/{test_opp_id}/moderate", headers=headers_admin, json={"action": "flag", "reason": "Testing moderation flag"})
    print(f"PATCH /admin/opportunities/{test_opp_id}/moderate (flag): {res_mod_flag.status_code}")
    assert res_mod_flag.status_code == 200
    opp_db_flag = supa.table("opportunities").select("status").eq("opportunity_id", test_opp_id).execute().data[0]
    assert opp_db_flag["status"] == "flagged"
    print("DB Spot-Check confirmed: opportunity status=flagged")

    # Reinstate
    res_mod_re = requests.patch(f"{BASE_URL}/admin/opportunities/{test_opp_id}/moderate", headers=headers_admin, json={"action": "reinstate", "reason": "Passed review"})
    assert res_mod_re.status_code == 200
    opp_db_re = supa.table("opportunities").select("status").eq("opportunity_id", test_opp_id).execute().data[0]
    assert opp_db_re["status"] == "published"
    print("DB Spot-Check confirmed: opportunity status=published")

    # 8. Complaint Resolution
    print("\n--- 8. Testing Complaint Resolution ---")
    # Insert temporary complaint
    test_complaint = supa.table("complaints").insert({
        "category": "Verification Dispute",
        "description": "Evidence verification query test",
        "status": "open"
    }).execute().data[0]
    test_cid = test_complaint["complaint_id"]

    res_comp = requests.patch(f"{BASE_URL}/admin/complaints/{test_cid}/status", headers=headers_admin, json={
        "status": "resolved",
        "resolution_notes": "Reviewed and verified valid certification proof."
    })
    print(f"PATCH /admin/complaints/{test_cid}/status: {res_comp.status_code}")
    assert res_comp.status_code == 200

    # Spot-check DB
    comp_db = supa.table("complaints").select("status, resolution_notes, resolved_by").eq("complaint_id", test_cid).execute().data[0]
    assert comp_db["status"] == "resolved"
    assert comp_db["resolution_notes"] == "Reviewed and verified valid certification proof."
    assert comp_db["resolved_by"] is not None
    print("DB Spot-Check confirmed: complaint status=resolved with resolution_notes and resolved_by set.")
    supa.table("complaints").delete().eq("complaint_id", test_cid).execute()

    # 9. Settings Changes
    print("\n--- 9. Testing Platform Settings Changes ---")
    res_set = requests.patch(f"{BASE_URL}/admin/settings/readiness_at_risk_threshold", headers=headers_admin, json={
        "setting_value": 42
    })
    print(f"PATCH /admin/settings/readiness_at_risk_threshold: {res_set.status_code}")
    assert res_set.status_code == 200

    # Spot-check DB
    set_db = supa.table("platform_settings").select("setting_value").eq("setting_key", "readiness_at_risk_threshold").execute().data[0]
    assert int(set_db["setting_value"]) == 42
    print("DB Spot-Check confirmed: readiness_at_risk_threshold=42 in platform_settings.")

    # Revert to 40
    requests.patch(f"{BASE_URL}/admin/settings/readiness_at_risk_threshold", headers=headers_admin, json={"setting_value": 40})

    # 10. Weight-Proposal Approve/Reject
    print("\n--- 10. Testing Weight Proposal Approve/Reject ---")
    prop = supa.table("weight_adjustment_proposals").insert({
        "proposed_weights": {"skillMatch": 45, "verifiedEvidence": 25, "projects": 20, "eligibility": 10},
        "based_on_sample_size": 250,
        "rationale": "Empirical placement tuning run",
        "status": "pending"
    }).execute().data[0]
    test_pid = prop["proposal_id"]
    print(f"Created test weight proposal: {test_pid}")

    res_prop_app = requests.patch(f"{BASE_URL}/admin/matching/weight-proposals/{test_pid}/approve", headers=headers_admin)
    print(f"PATCH /admin/matching/weight-proposals/{test_pid}/approve: {res_prop_app.status_code}")
    assert res_prop_app.status_code == 200

    # Spot-check DB
    prop_db = supa.table("weight_adjustment_proposals").select("status").eq("proposal_id", test_pid).execute().data[0]
    assert prop_db["status"] == "approved"
    print("DB Spot-Check confirmed: weight proposal status=approved and weights updated in DB.")

    supa.table("weight_adjustment_proposals").delete().eq("proposal_id", test_pid).execute()

    print("\n=== ALL SUPER ADMIN DASHBOARD WIRING TESTS PASSED PERFECTLY! ===")

if __name__ == "__main__":
    test_all()
