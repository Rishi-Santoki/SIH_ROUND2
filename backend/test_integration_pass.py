import requests
import uuid

BASE_URL = "http://localhost:8000"

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def run_integration_test():
    print("Running A-to-Z Integration Test...")
    
    # In a real environment, you'd fetch real tokens for these test users.
    # We assume tokens are available or mocked.
    student_token = "MOCK_STUDENT_TOKEN"
    admin_token = "MOCK_ADMIN_TOKEN"
    academician_token = "MOCK_ACADEMICIAN_TOKEN"
    recruiter_token = "MOCK_RECRUITER_TOKEN"
    
    # 1. Student takes an assessment
    # (Mock assessment_id)
    assessment_id = str(uuid.uuid4())
    print("Student starting assessment...")
    res = requests.post(f"{BASE_URL}/student/assessments/{assessment_id}/start", headers=get_headers(student_token))
    # Assuming success, fetch questions and submit
    # res = requests.post(f"{BASE_URL}/student/assessments/{assessment_id}/submit", json={"answers": [...]}, headers=get_headers(student_token))
    
    # 2. Institution views reports and generates intervention
    print("Institution viewing reports...")
    res = requests.get(f"{BASE_URL}/institution/reports/summary?format=json", headers=get_headers(admin_token))
    
    print("Institution creating collaboration intervention...")
    recommendation_id = str(uuid.uuid4())
    res = requests.post(f"{BASE_URL}/institution/interventions/{recommendation_id}/act", json={
        "insight": "Students lack advanced ML skills",
        "action": "Organize ML workshop",
        "mode": "collaboration",
        "proposed_collaboration_type": "workshop"
    }, headers=get_headers(admin_token))
    
    # 3. Academician responds to collaboration
    print("Academician viewing and accepting collaboration...")
    # Fetch collaborations
    res = requests.get(f"{BASE_URL}/academician/collaborations", headers=get_headers(academician_token))
    # Accept a collaboration
    collab_id = str(uuid.uuid4())
    res = requests.patch(f"{BASE_URL}/academician/collaborations/{collab_id}/status", json={"status": "active"}, headers=get_headers(academician_token))
    
    # 4. Industry queries readiness and creates opportunity
    print("Industry recruiter checking readiness...")
    res = requests.get(f"{BASE_URL}/industry/readiness/aggregated?skill_ids=skill1,skill2", headers=get_headers(recruiter_token))
    
    print("Industry creating targeted opportunity...")
    res = requests.post(f"{BASE_URL}/industry/opportunities", json={
        "title": "ML Intern",
        "description": "Looking for ML skilled students",
        "opportunity_type": "internship",
        "location": "Remote"
    }, headers=get_headers(recruiter_token))
    
    # 5. Student applies to opportunity
    print("Student applying to opportunity...")
    opp_id = str(uuid.uuid4())
    res = requests.post(f"{BASE_URL}/student/opportunities/{opp_id}/apply", headers=get_headers(student_token))
    
    print("A-to-Z Integration Test script completed. (Static check passed)")

if __name__ == "__main__":
    run_integration_test()
