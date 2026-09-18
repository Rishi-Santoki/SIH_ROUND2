import requests
import json
import sys
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
    print("=== STARTING INSTITUTION DASHBOARD WIRING TEST ===")

    # 1. Login as Suresh Iyer (Institution Admin for LDRP)
    print("\n--- 1. Testing Login as Institution Admin: suresh.iyer@ldrp.test ---")
    headers_inst = login("suresh.iyer@ldrp.test", "Test@12345")
    print("Logged in as Suresh Iyer successfully.")

    # 2. Submit Institution for Verification
    print("\n--- 2. Testing Submit Institution for Verification ---")
    ver_payload = {
        "document_url": "https://aicte-india.org/accreditation/ldrp_engineering_2026.pdf",
        "comments": "Official AICTE Renewal & NBA Accreditation documentation."
    }
    res_verify = requests.post(f"{BASE_URL}/institution/verify", headers=headers_inst, json=ver_payload)
    print(f"POST /institution/verify: {res_verify.status_code}")
    assert res_verify.status_code in (200, 201), f"Failed to submit verification: {res_verify.status_code} {res_verify.text}"
    print(f"Response: {res_verify.json()}")

    # Check database directly for the verification request
    prof_res = requests.get(f"{BASE_URL}/institution/profile", headers=headers_inst)
    inst_id = prof_res.json()["institution_id"]
    db_req = supa.table("verification_requests").select("*").eq("entity_id", inst_id).eq("entity_type", "institution").order("created_at", desc=True).limit(1).execute()
    assert len(db_req.data) > 0, "Verification request not found in database!"
    print(f"DB Spot-Check confirmed: Verification request exists for institution {inst_id} with status '{db_req.data[0]['status']}'")

    # 3. Interventions: Recommendations & Act on Intervention
    print("\n--- 3. Testing Interventions: Recommendations & 'Act on this' ---")
    res_recs = requests.get(f"{BASE_URL}/institution/interventions/recommended", headers=headers_inst)
    print(f"GET /institution/interventions/recommended: {res_recs.status_code}, count: {len(res_recs.json())}")
    assert res_recs.status_code == 200

    # Trigger action on recommended intervention
    act_payload = {
        "insight": "High industry demand for Cloud Security and DevOps with lagging student evidence.",
        "action": "Mandate intensive Faculty Development Program on Cloud Security & DevSecOps.",
        "mode": "collaboration",
        "proposed_collaboration_type": "fdp"
    }
    res_act = requests.post(f"{BASE_URL}/institution/interventions/cloud_security_gap/act", headers=headers_inst, json=act_payload)
    print(f"POST /institution/interventions/cloud_security_gap/act: {res_act.status_code}")
    assert res_act.status_code == 200, f"Failed to act on intervention: {res_act.status_code} {res_act.text}"
    act_result = res_act.json()
    intervention_id = act_result["intervention_id"]
    print(f"Intervention initiated successfully! ID: {intervention_id}, message: {act_result['message']}")

    # Spot-check in institution_interventions table
    db_interv = supa.table("institution_interventions").select("*").eq("intervention_id", intervention_id).execute()
    assert len(db_interv.data) > 0, "Intervention not found in database!"
    print(f"DB Spot-Check confirmed: Recorded intervention '{db_interv.data[0]['notes']}' in institution_interventions table.")

    # Check history endpoint
    res_hist = requests.get(f"{BASE_URL}/institution/interventions/history", headers=headers_inst)
    print(f"GET /institution/interventions/history: {res_hist.status_code}, total count: {len(res_hist.json())}")
    assert res_hist.status_code == 200
    assert any(h["intervention_id"] == intervention_id for h in res_hist.json()), "Created intervention not found in history!"

    # 4. Alumni Verification: Approve / Reject & Cross-Dashboard Propagation
    print("\n--- 4. Testing Alumni Verification & Cross-Dashboard Propagation ---")
    res_alumni_queue = requests.get(f"{BASE_URL}/admin/verifications?entity_type=alumni", headers=headers_inst)
    print(f"GET /admin/verifications?entity_type=alumni: {res_alumni_queue.status_code}, count: {len(res_alumni_queue.json())}")
    assert res_alumni_queue.status_code == 200
    queue = res_alumni_queue.json()

    if not queue:
        # If no pending request, make sure Meera Joshi has a pending request
        meera_uid = "c75f007e-b5cb-4926-88f8-51390869908f"
        # Reset Meera to unverified
        supa.table("alumni_profiles").update({"is_verified": False}).eq("alumni_id", meera_uid).execute()
        supa.table("verification_requests").delete().eq("entity_id", meera_uid).execute()
        supa.table("verification_requests").insert({
            "entity_type": "alumni",
            "entity_id": meera_uid,
            "submitted_by": meera_uid,
            "status": "pending",
            "notes": "Requesting alumni verification. Graduated 2024 B.Tech CSE from LDRP."
        }).execute()
        res_alumni_queue = requests.get(f"{BASE_URL}/admin/verifications?entity_type=alumni", headers=headers_inst)
        queue = res_alumni_queue.json()

    assert len(queue) > 0, "Expected at least one pending alumni verification request!"
    req_to_approve = queue[0]
    target_req_id = req_to_approve["request_id"]
    target_alumni_id = req_to_approve["entity_id"]
    print(f"Found pending alumni verification request: {target_req_id} for alumni ID: {target_alumni_id}")

    # Approve the request
    res_approve = requests.patch(f"{BASE_URL}/admin/verifications/{target_req_id}/approve", headers=headers_inst)
    print(f"PATCH /admin/verifications/{target_req_id}/approve: {res_approve.status_code}")
    assert res_approve.status_code in (200, 201), f"Failed to approve: {res_approve.status_code} {res_approve.text}"

    # Spot-check database for is_verified flip
    db_alumni = supa.table("alumni_profiles").select("alumni_id, is_verified").eq("alumni_id", target_alumni_id).execute()
    assert len(db_alumni.data) > 0 and db_alumni.data[0]["is_verified"] is True, f"Expected is_verified=True, got {db_alumni.data}"
    print(f"DB Spot-Check confirmed: Alumni {target_alumni_id} flipped is_verified=True in database.")

    # Cross-Dashboard Propagation: Check Student & Academician Alumni Network
    print("Verifying cross-dashboard propagation to Student and Academician Alumni Networks...")
    headers_student = login("aarav.patel@ldrp.test", "Test@12345")
    res_stud_alumni = requests.get(f"{BASE_URL}/student/alumni", headers=headers_student)
    assert res_stud_alumni.status_code == 200
    stud_alumni_ids = [a.get("alumni_id") for a in res_stud_alumni.json()]
    assert target_alumni_id in stud_alumni_ids, f"Approved alumni {target_alumni_id} not visible in Student Alumni Network!"
    print(f"Cross-Dashboard propagation verified: Approved alumni is immediately visible in Student Alumni Network!")

    headers_acad = login("kavita.rao@ldrp.test", "Test@12345")
    res_acad_alumni = requests.get(f"{BASE_URL}/academician/alumni", headers=headers_acad)
    assert res_acad_alumni.status_code == 200
    acad_alumni_ids = [a.get("alumni_id") for a in res_acad_alumni.json()]
    assert target_alumni_id in acad_alumni_ids, f"Approved alumni {target_alumni_id} not visible in Academician Alumni Network!"
    print(f"Cross-Dashboard propagation verified: Approved alumni is immediately visible in Academician Alumni Network!")

    # 5. CSV Export
    print("\n--- 5. Testing CSV Export ---")
    res_csv = requests.get(f"{BASE_URL}/institution/reports/summary?format=csv", headers=headers_inst)
    print(f"GET /institution/reports/summary?format=csv: {res_csv.status_code}")
    assert res_csv.status_code == 200, f"CSV export failed: {res_csv.status_code}"
    
    content_type = res_csv.headers.get("content-type", "")
    print(f"Content-Type: {content_type}")
    assert "text/csv" in content_type, f"Expected text/csv, got {content_type}"
    
    csv_text = res_csv.text
    print(f"CSV Size: {len(csv_text)} characters")
    lines = csv_text.strip().split("\n")
    print(f"Total lines in exported CSV: {len(lines)}")
    print(f"CSV Header: {lines[0]}")
    for l in lines[1:4]:
        print(f"CSV Sample Row: {l}")
    
    assert len(lines) >= 2, "CSV export is empty or missing data rows!"
    assert "Student ID" in lines[0] and "Readiness" in lines[0], "CSV header format mismatch!"
    print("CSV export verified: Real file generated with valid headers and actual cohort records.")

    print("\n=== ALL INSTITUTION DASHBOARD WIRING TESTS PASSED! ===")

if __name__ == "__main__":
    test_all()
