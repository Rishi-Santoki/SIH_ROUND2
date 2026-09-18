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
    print("=== STARTING ACADEMICIAN DASHBOARD WIRING TEST ===")

    # 1. Login as Dr. Kavita Rao (LDRP Institute of Technology and Research)
    print("\n--- 1. Testing with Academician: kavita.rao@ldrp.test ---")
    headers = login("kavita.rao@ldrp.test", "Test@12345")
    print("Logged in as Dr. Kavita Rao successfully.")

    # 2. Skill Pulse Analytics Endpoint
    print("\n--- 2. Testing Skill Pulse Analytics ---")
    res_pulse = requests.get(f"{BASE_URL}/academician/skill-pulse", headers=headers)
    print(f"GET /academician/skill-pulse: {res_pulse.status_code}")
    assert res_pulse.status_code == 200, f"Skill pulse returned {res_pulse.status_code}: {res_pulse.text}"
    pulse_data = res_pulse.json()
    print(f"Readiness vs Demand data points: {len(pulse_data.get('readiness_vs_demand', []))}")
    print(f"Actionable insights count: {len(pulse_data.get('actionable_insights', []))}")
    for item in pulse_data.get('actionable_insights', []):
        print(f"  - Insight: {item.get('skill')} -> Action: {item.get('action')}")

    # 3. Propose a Collaboration
    print("\n--- 3. Testing Propose Collaboration ---")
    propose_payload = {
        "title": "Cloud Security & DevSecOps Hands-on Workshop",
        "description": "Faculty & Student intensive workshop bridging AWS IAM, KMS, and DevSecOps pipelines.",
        "collaboration_type": "guest_lecture",
        "start_date": "2026-10-15",
        "end_date": "2026-10-20"
    }
    res_prop = requests.post(f"{BASE_URL}/academician/collaborations", headers=headers, json=propose_payload)
    print(f"POST /academician/collaborations: {res_prop.status_code}")
    assert res_prop.status_code in (200, 201), f"Failed to propose collaboration: {res_prop.status_code} {res_prop.text}"
    collab = res_prop.json()
    collab_id = collab.get("collaboration_id")
    print(f"Successfully proposed collaboration ID: {collab_id}, Status: {collab.get('status')}")

    # Spot-check in Database directly
    db_collab = supa.table("faculty_collaborations").select("*").eq("collaboration_id", collab_id).execute()
    assert len(db_collab.data) > 0, "Collaboration record not found in database!"
    print(f"DB Spot-Check confirmed: {db_collab.data[0]['title']} is stored in database with status '{db_collab.data[0]['status']}'")

    # 4. Change Collaboration Status
    print("\n--- 4. Testing Change Collaboration Status ---")
    res_status = requests.patch(
        f"{BASE_URL}/academician/collaborations/{collab_id}/status",
        headers=headers,
        json={"status": "ongoing"}
    )
    print(f"PATCH /academician/collaborations/{collab_id}/status: {res_status.status_code}")
    assert res_status.status_code == 200, f"Failed status update: {res_status.status_code} {res_status.text}"
    updated_collab = res_status.json()
    print(f"Updated status returned by API: {updated_collab.get('status')}")

    # Spot-check status in Database directly
    db_collab_updated = supa.table("faculty_collaborations").select("*").eq("collaboration_id", collab_id).execute()
    assert db_collab_updated.data[0]['status'] == "ongoing", f"Status in DB is {db_collab_updated.data[0]['status']}, expected 'ongoing'"
    print(f"DB Spot-Check confirmed: Status persisted as '{db_collab_updated.data[0]['status']}' in database.")

    # 5. List Academician Collaborations (mine, available, recommended)
    print("\n--- 5. Testing Collaborations Lists ---")
    res_mine = requests.get(f"{BASE_URL}/academician/collaborations/mine", headers=headers)
    print(f"GET /academician/collaborations/mine: {res_mine.status_code}, count: {len(res_mine.json())}")
    assert res_mine.status_code == 200
    assert any(c.get("collaboration_id") == collab_id for c in res_mine.json()), "Created collaboration not found in 'mine'!"

    res_avail = requests.get(f"{BASE_URL}/academician/collaborations/available", headers=headers)
    print(f"GET /academician/collaborations/available: {res_avail.status_code}, count: {len(res_avail.json())}")
    assert res_avail.status_code == 200

    res_rec = requests.get(f"{BASE_URL}/academician/collaborations/recommended", headers=headers)
    print(f"GET /academician/collaborations/recommended: {res_rec.status_code}, count: {len(res_rec.json())}")
    assert res_rec.status_code == 200

    # 6. Apply to an Available Collaboration
    print("\n--- 6. Testing Apply to Collaboration ---")
    available_list = [c for c in res_avail.json() if c.get("collaboration_id") != collab_id]
    if available_list:
        target_collab_id = available_list[0]["collaboration_id"]
        res_apply = requests.post(f"{BASE_URL}/academician/collaborations/{target_collab_id}/apply", headers=headers)
        print(f"POST /academician/collaborations/{target_collab_id}/apply: {res_apply.status_code}")
        print(f"Apply response: {res_apply.text}")
        assert res_apply.status_code in (200, 201) or (res_apply.status_code == 400 and "Already applied" in res_apply.text), f"Failed to apply: {res_apply.status_code}"
        print("Application status verified successfully (applied or already applied).")
    else:
        print("No other collaboration to apply to; creating another one as draft to test apply...")
        prop2 = requests.post(f"{BASE_URL}/academician/collaborations", headers=headers, json={
            "title": "Open Quantum Computing Initiative",
            "description": "Open research call for quantum algorithm simulation.",
            "collaboration_type": "research"
        }).json()
        target_collab_id = prop2["collaboration_id"]
        res_apply = requests.post(f"{BASE_URL}/academician/collaborations/{target_collab_id}/apply", headers=headers)
        print(f"POST /academician/collaborations/{target_collab_id}/apply: {res_apply.status_code}")
        assert res_apply.status_code in (200, 201)
        print("Application created and verified.")

    # 7. Alumni Network (Directory & Detail Profile)
    print("\n--- 7. Testing Alumni Network for Academician ---")
    res_alumni = requests.get(f"{BASE_URL}/academician/alumni", headers=headers)
    print(f"GET /academician/alumni: {res_alumni.status_code}")
    assert res_alumni.status_code == 200, f"Failed GET /academician/alumni: {res_alumni.status_code} {res_alumni.text}"
    alumni_list = res_alumni.json()
    print(f"Found {len(alumni_list)} visible verified alumni.")
    
    if alumni_list:
        sample_alumni = alumni_list[0]
        alumni_id = sample_alumni.get("alumni_id")
        name = sample_alumni.get("full_name") or sample_alumni.get("name")
        print(f"Viewing profile for alumni: {name} (ID: {alumni_id})")

        res_profile = requests.get(f"{BASE_URL}/academician/alumni/{alumni_id}", headers=headers)
        print(f"GET /academician/alumni/{alumni_id}: {res_profile.status_code}")
        assert res_profile.status_code == 200, f"Failed to get alumni profile: {res_profile.status_code}"
        profile_data = res_profile.json()
        print(f"Alumni verified status: {profile_data.get('is_verified')}, Company: {profile_data.get('current_company')}")

    # 8. Alumni Messaging
    print("\n--- 8. Testing Alumni Messaging ---")
    if alumni_list:
        sample_alumni_id = alumni_list[0].get("alumni_id")
        res_convo = requests.post(f"{BASE_URL}/community/conversations", headers=headers, json={"alumni_id": sample_alumni_id})
        print(f"POST /community/conversations: {res_convo.status_code}")
        assert res_convo.status_code in (200, 201), f"Failed to start/get conversation: {res_convo.status_code} {res_convo.text}"
        convo_data = res_convo.json()
        convo_id = convo_data.get("conversation_id") or convo_data.get("id")
        print(f"Conversation ID: {convo_id}")

        msg_payload = {
            "message": "Hello! We are organizing a cloud security workshop and would love your industry insights as an alumnus."
        }
        res_msg = requests.post(f"{BASE_URL}/community/conversations/{convo_id}/messages", headers=headers, json=msg_payload)
        print(f"POST /community/conversations/{convo_id}/messages: {res_msg.status_code}")
        assert res_msg.status_code in (200, 201), f"Failed to send message: {res_msg.status_code} {res_msg.text}"
        sent_msg = res_msg.json()
        print(f"Direct message sent successfully! Message ID: {sent_msg.get('message_id')}")

    print("\n=== ALL ACADEMICIAN DASHBOARD WIRING TESTS PASSED! ===")

if __name__ == "__main__":
    test_all()
