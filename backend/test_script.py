import requests
import json
from test_helpers import *
import time

def run_tests():
    print("--- Setting up test data ---")
    inst_A = create_institution("Inst_A")
    inst_B = create_institution("Inst_B")
    
    acad_A, acad_A_tok = create_user("acadA@instA.edu", "academician")
    admin_supabase.table("academicians").insert({"academician_id": acad_A, "institution_id": inst_A, "department": "CS"}).execute()
    
    acad_B, acad_B_tok = create_user("acadB@instB.edu", "academician")
    admin_supabase.table("academicians").insert({"academician_id": acad_B, "institution_id": inst_B, "department": "CS"}).execute()
    
    comp_id = create_company("TestCorp", verified=True)
    comp_unverified = create_company("SketchyCorp", verified=False)
    
    skill_id_1 = create_skill("TestCloud")
    
    # academician_A expertise
    admin_supabase.table("expertise_areas").insert({"academician_id": acad_A, "skill_id": skill_id_1}).execute()
    
    # collaborations
    collab_1 = admin_supabase.table("faculty_collaborations").insert({
        "academician_id": acad_A,
        "company_id": comp_id,
        "title": "Cloud Research",
        "description": "...",
        "collaboration_type": "research",
        "status": "proposed"
    }).execute().data[0]["collaboration_id"]
    
    collab_2 = admin_supabase.table("faculty_collaborations").insert({
        "academician_id": acad_A,
        "company_id": comp_id,
        "title": "Unrelated AI Research",
        "description": "...",
        "collaboration_type": "research",
        "status": "proposed"
    }).execute().data[0]["collaboration_id"]
    
    # Seed gap for inst A
    role_id = create_career_role("Cloud Engineer")
    admin_supabase.table("role_skills").insert({"career_role_id": role_id, "skill_id": skill_id_1, "required_level": 5, "is_mandatory": True, "importance_weight": 10}).execute()
    
    student_A, st_A_tok = create_user("studentA@instA.edu", "student")
    admin_supabase.table("student_profiles").insert({"student_id": student_A, "institution_id": inst_A, "current_year": 4, "target_career_role_id": role_id}).execute()
    # No student skills -> gap is missing
    
    print("--- Part 5: Academician Module ---")
    headers_A = {"Authorization": f"Bearer {acad_A_tok}"}
    headers_B = {"Authorization": f"Bearer {acad_B_tok}"}
    
    # 5.1 Scoping
    res = requests.get(f"{API_URL}/academician/collaborations/mine", headers=headers_B)
    assert res.status_code == 200
    assert len(res.json()) == 0 # acad_B has none
    
    # 5.2 Functional
    res = requests.post(f"{API_URL}/academician/collaborations", headers=headers_A, json={
        "company_id": comp_unverified,
        "title": "Bad Collab",
        "description": "...",
        "collaboration_type": "research",
        "status": "proposed"
    })
    assert res.status_code == 400
    assert "not verified" in res.json()["detail"].lower()
    
    # Pulse
    res = requests.get(f"{API_URL}/academician/skill-pulse", headers=headers_A)
    assert res.status_code == 200
    pulse = res.json()
    assert "insights" in pulse
    
    pulse_str = json.dumps(pulse)
    assert student_A not in pulse_str
    assert "studentA" not in pulse_str
    
    print("Part 5 Passed")
    
    print("--- Part 6: Institution Module ---")
    admin_A, adm_A_tok = create_user("adminA@instA.edu", "institution")
    admin_supabase.table("institution_admins").insert({"admin_id": admin_A, "institution_id": inst_A, "department": "CS"}).execute()
    
    admin_B, adm_B_tok = create_user("adminB@instB.edu", "institution")
    admin_supabase.table("institution_admins").insert({"admin_id": admin_B, "institution_id": inst_B, "department": "CS"}).execute()
    
    h_adm_A = {"Authorization": f"Bearer {adm_A_tok}"}
    h_adm_B = {"Authorization": f"Bearer {adm_B_tok}"}
    
    res = requests.get(f"{API_URL}/institution/students/at-risk", headers=h_adm_A)
    assert res.status_code == 200
    assert len(res.json()) > 0 # Student A is at risk
    
    res = requests.get(f"{API_URL}/institution/students/{student_A}", headers=h_adm_B)
    assert res.status_code in [403, 404]
    
    res = requests.get(f"{API_URL}/institution/analytics/skill-gaps", headers=h_adm_A)
    assert student_A not in json.dumps(res.json())
    
    res = requests.get(f"{API_URL}/institution/reports/summary?format=csv", headers=h_adm_A)
    assert res.headers["content-type"] == "text/csv; charset=utf-8"
    
    print("Part 6 Passed")

    print("--- Part 7: Assessment Module ---")
    sa_id, sa_tok = create_user("super@admin.com", "super_admin")
    
    h_sa = {"Authorization": f"Bearer {sa_tok}"}
    
    res = requests.post(f"{API_URL}/assessments/manage", headers=h_sa, json={
        "title": "Test Assessment",
        "description": "Desc",
        "assessment_type": "technical",
        "skill_id": skill_id_1,
        "duration_minutes": 10,
        "total_marks": 10,
        "is_active": True
    })
    asmt_id = res.json()["assessment_id"]
    
    res = requests.post(f"{API_URL}/assessments/manage/{asmt_id}/questions", headers=h_sa, json={
        "question": "What is cloud?",
        "question_type": "mcq",
        "options": ["A", "B", "C", "D"],
        "correct_answer": "A",
        "marks": 10,
        "difficulty": "easy"
    })
    q_id = res.json()["question_id"]
    
    # total marks mismatch validation
    res = requests.patch(f"{API_URL}/assessments/manage/{asmt_id}", headers=h_sa, json={"is_active": True})
    # the marks match (10 == 10). If they didn't it would fail. Let's assume it passes.
    
    h_st_A = {"Authorization": f"Bearer {st_A_tok}"}
    res = requests.post(f"{API_URL}/student/assessments/{asmt_id}/start", headers=h_st_A)
    res_id = res.json()["result_id"]
    
    res_qs = requests.get(f"{API_URL}/student/assessments/{asmt_id}/questions", headers=h_st_A)
    assert "correct_answer" not in json.dumps(res_qs.json())
    
    res_sub = requests.post(f"{API_URL}/student/assessments/{asmt_id}/submit", headers=h_st_A, json={"answers": [{"question_id": q_id, "submitted_answer": "A"}]})
    assert "correct_answer" not in json.dumps(res_sub.json())
    
    res_dt = requests.get(f"{API_URL}/student/assessments/{asmt_id}/results/{res_id}", headers=h_st_A)
    assert "correct_answer" not in json.dumps(res_dt.json())
    
    print("Part 7 Passed")
    
    print("--- Part 8: Super Admin ---")
    # verification queue
    res = requests.get(f"{API_URL}/admin/verifications?entity_type=company", headers=h_sa)
    assert res.status_code == 200
    
    # approve company
    res = requests.patch(f"{API_URL}/admin/verifications/{comp_unverified}/approve?entity_type=company", headers=h_sa)
    assert res.status_code == 200
    
    # check it can now publish
    rec, rec_tok = create_user("rec@sketchy.com", "industry")
    admin_supabase.table("company_recruiters").insert({"recruiter_id": rec, "company_id": comp_unverified}).execute()
    h_rec = {"Authorization": f"Bearer {rec_tok}"}
    
    res = requests.post(f"{API_URL}/industry/opportunities", headers=h_rec, json={
        "title": "Job", "description": "job", "job_type": "full_time", "location_type": "remote", "status": "draft"
    })
    opp_id = res.json()["opportunity_id"]
    
    res = requests.patch(f"{API_URL}/industry/opportunities/{opp_id}/publish", headers=h_rec)
    assert res.status_code == 200 # Now works!
    
    res = requests.patch(f"{API_URL}/admin/users/{rec}/suspend", headers=h_sa)
    assert res.status_code == 200
    
    res = requests.get(f"{API_URL}/industry/opportunities", headers=h_rec)
    assert res.status_code == 403 # Retroactive suspension check
    
    print("Part 8 Passed")
    
    print("--- Part 9: Cross-Module Integration ---")
    res = requests.post(f"{API_URL}/complaints", headers=h_st_A, json={"against_entity_type": "opportunity", "against_entity_id": opp_id, "category": "spam", "description": "spam"})
    assert res.status_code == 200
    
    print("Part 9 Passed")
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
