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
    print("=== STARTING INDUSTRY DASHBOARD WIRING TEST ===")
    
    # 1. Login as verified recruiter Neha (TechNova)
    print("\n--- 1. Testing with Verified Recruiter: neha@technova.test ---")
    headers_verified = login("neha@technova.test", "Test@12345")
    print("Logged in as Neha successfully.")

    # 1a. Company Details & Verification Submit
    res_company = requests.get(f"{BASE_URL}/industry/company", headers=headers_verified)
    print(f"GET /industry/company: {res_company.status_code}")
    assert res_company.status_code == 200
    company_data = res_company.json()
    print(f"Company: {company_data.get('name')}, Verified: {company_data.get('verified')}")

    # 1b. Post Opportunity (Draft)
    opp_payload = {
        "title": "Backend Engineering Intern",
        "description": "Building microservices and proof validation APIs.",
        "opportunity_type": "internship",
        "work_mode": "remote",
        "location": "Bengaluru / Remote",
        "stipend": "25000/month",
        "duration": "3 months",
        "application_deadline": "2026-10-31T23:59:59Z"
    }
    res_opp = requests.post(f"{BASE_URL}/industry/opportunities", headers=headers_verified, json=opp_payload)
    print(f"POST /industry/opportunities: {res_opp.status_code}")
    assert res_opp.status_code == 200
    created_opp = res_opp.json()
    opp_id = created_opp.get("opportunity_id")
    print(f"Created opportunity id: {opp_id}, status: {created_opp.get('status')}")

    # 2. Add required skills to posting
    skill_payload = [{
        "skill_name": "Python",
        "min_proficiency": 3,
        "is_required": True,
        "weight": 1.5
    }]
    res_skill = requests.post(f"{BASE_URL}/industry/opportunities/{opp_id}/skills", headers=headers_verified, json=skill_payload)
    print(f"POST /industry/opportunities/{opp_id}/skills: {res_skill.status_code}")
    assert res_skill.status_code == 200

    # 3. Publish posting (Verified recruiter -> success)
    res_pub = requests.patch(f"{BASE_URL}/industry/opportunities/{opp_id}/publish", headers=headers_verified)
    print(f"PATCH /industry/opportunities/{opp_id}/publish: {res_pub.status_code}")
    assert res_pub.status_code == 200

    # 4. Close posting
    res_close = requests.patch(f"{BASE_URL}/industry/opportunities/{opp_id}/close", headers=headers_verified)
    print(f"PATCH /industry/opportunities/{opp_id}/close: {res_close.status_code}")
    assert res_close.status_code == 200

    # 5. Pipeline & Applications
    res_apps = requests.get(f"{BASE_URL}/industry/applications", headers=headers_verified)
    print(f"GET /industry/applications: {res_apps.status_code}")
    assert res_apps.status_code == 200
    apps = res_apps.json()
    print(f"Total applications retrieved: {len(apps)}")
    
    test_app_id = None
    if apps:
        test_app_id = apps[0]["application_id"]
        print(f"Using application {test_app_id} (Student: {apps[0].get('student_name')}, Status: {apps[0].get('status')})")

        # 5a. Test missing notes validation (Should return 400)
        res_empty_note = requests.patch(
            f"{BASE_URL}/industry/applications/{test_app_id}/status",
            headers=headers_verified,
            json={"status": "shortlisted", "recruiter_notes": ""}
        )
        print(f"PATCH status with empty notes -> Status: {res_empty_note.status_code} (Expected 400)")
        assert res_empty_note.status_code == 400

        # 5b. Move to shortlisted with valid notes
        res_shortlist = requests.patch(
            f"{BASE_URL}/industry/applications/{test_app_id}/status",
            headers=headers_verified,
            json={"status": "shortlisted", "recruiter_notes": "Impressive ledger proof in Python."}
        )
        print(f"PATCH status to shortlisted: {res_shortlist.status_code}")
        assert res_shortlist.status_code == 200

        # 5c. Move to selected
        res_selected = requests.patch(
            f"{BASE_URL}/industry/applications/{test_app_id}/status",
            headers=headers_verified,
            json={"status": "selected", "recruiter_notes": "Accepted offer letter."}
        )
        print(f"PATCH status to selected: {res_selected.status_code}")
        assert res_selected.status_code == 200

    # 6. Interns & Milestones
    res_interns = requests.get(f"{BASE_URL}/industry/interns", headers=headers_verified)
    print(f"GET /industry/interns: {res_interns.status_code}")
    assert res_interns.status_code == 200
    interns = res_interns.json()
    print(f"Total active interns: {len(interns)}")

    if test_app_id:
        # 6a. Add milestone
        res_m = requests.post(
            f"{BASE_URL}/industry/interns/{test_app_id}/milestones",
            headers=headers_verified,
            json={"milestone": "Deliver Sprint 1 FastAPI endpoints"}
        )
        print(f"POST /industry/interns/{test_app_id}/milestones: {res_m.status_code}")
        assert res_m.status_code == 200
        milestone_data = res_m.json()
        tracking_id = milestone_data.get("tracking_id")
        print(f"Created milestone tracking_id: {tracking_id}")

        if tracking_id:
            # 6b. Complete Eval & Feedback
            res_eval = requests.patch(
                f"{BASE_URL}/industry/interns/{test_app_id}/milestones/{tracking_id}",
                headers=headers_verified,
                json={
                    "status": "completed",
                    "mentor_rating": 4.8,
                    "mentor_feedback": "Excellent execution and adherence to coding guidelines."
                }
            )
            print(f"PATCH mentor evaluation: {res_eval.status_code}")
            assert res_eval.status_code == 200

    # 7. AI Copilot Query
    res_copilot = requests.post(
        f"{BASE_URL}/industry/copilot/ask",
        headers=headers_verified,
        json={"query": "Find me candidates with verified Python skills and high match scores"}
    )
    print(f"POST /industry/copilot/ask: {res_copilot.status_code}")
    assert res_copilot.status_code == 200
    copilot_data = res_copilot.json()
    print(f"Copilot Answer excerpt: {copilot_data.get('answer')[:120]}...")
    print(f"Copilot Sources: {copilot_data.get('sources')}")

    # 8. Test Unverified Recruiter Blocking (Arjun @ BrightWave)
    print("\n--- 2. Testing Unverified Recruiter Blocking: arjun@brightwave.test ---")
    headers_unverified = login("arjun@brightwave.test", "Test@12345")
    
    # 8a. Verify company status is unverified
    res_bw = requests.get(f"{BASE_URL}/industry/company", headers=headers_unverified)
    assert res_bw.status_code == 200
    assert res_bw.json().get("verified") is False
    print("Confirmed BrightWave is unverified.")

    # 8b. Submit company for verification
    res_verify_req = requests.post(
        f"{BASE_URL}/industry/company/verify",
        headers=headers_unverified,
        json={"website": "https://brightwave.test", "tax_id": "BW-999888777"}
    )
    print(f"POST /industry/company/verify: {res_verify_req.status_code}")
    assert res_verify_req.status_code in [200, 201]

    # 8c. Draft creation is allowed
    res_bw_draft = requests.post(
        f"{BASE_URL}/industry/opportunities",
        headers=headers_unverified,
        json={
            "title": "Unverified Test Role",
            "description": "Testing unverified blocking",
            "opportunity_type": "internship",
            "work_mode": "remote",
            "location": "Pune",
            "application_deadline": "2026-10-31T23:59:59Z"
        }
    )
    print(f"Unverified POST opportunity: {res_bw_draft.status_code} (Draft allowed)")
    assert res_bw_draft.status_code == 200
    bw_opp_id = res_bw_draft.json().get("opportunity_id")

    # 8d. Publish MUST BE BLOCKED with 403
    res_bw_publish = requests.patch(f"{BASE_URL}/industry/opportunities/{bw_opp_id}/publish", headers=headers_unverified)
    print(f"Unverified PATCH publish: {res_bw_publish.status_code} (Expected 403 Forbidden)")
    assert res_bw_publish.status_code == 403
    print(f"Publish blocked response detail: {res_bw_publish.json().get('detail')}")

    print("\n=== ALL 6 INDUSTRY DASHBOARD TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    try:
        test_all()
    except Exception as e:
        print(f"TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
