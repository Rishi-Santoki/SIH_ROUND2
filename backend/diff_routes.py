import json

expected = {
    # Section A
    "GET /auth/me", "GET /auth/onboarding-status", "GET /auth/institutions", "GET /auth/companies", "POST /auth/register/complete",
    # Section B
    "GET /student/profile", "PATCH /student/profile", "POST /student/profile/onboarding", "GET /student/target-role", "PUT /student/target-role",
    "GET /student/skills", "POST /student/skills", "GET /student/skills/dna/{skill_id}", "GET /student/skill-gap", "GET /student/skill-gap/summary",
    "GET /student/career-digital-twin", "GET /student/career-roadmap", "GET /student/learning-recommendations", "POST /student/learning-progress",
    "PATCH /student/learning-progress/{progress_id}", "GET /student/learning-progress", "GET /student/opportunities/recommended",
    "POST /student/applications", "GET /student/applications", "GET /student/internships/{application_id}/tracking", "GET /student/portfolio",
    "POST /student/portfolio/projects", "POST /student/portfolio/certifications", "GET /student/notifications", "PATCH /student/notifications/{notification_id}/read",
    "POST /student/copilot/ask", "POST /student/complaints",
    # Section C
    "GET /student/assessments/available", "POST /student/assessments/{assessment_id}/start", "GET /student/assessments/{assessment_id}/questions",
    "POST /student/assessments/{assessment_id}/submit", "GET /student/assessments/results", "GET /student/assessments/{assessment_id}/results/{result_id}",
    "POST /student/skills/{skill_id}/roadmap", "GET /student/skills/{skill_id}/roadmap", "GET /student/alumni", "GET /student/alumni/{alumni_id}",
    "GET /student/alumni/recommended",
    # Section D
    "GET /industry/company", "PATCH /industry/company", "POST /industry/company/verify", "POST /industry/recruiters/invite",
    "GET /industry/profile", "PATCH /industry/profile", "POST /industry/opportunities", "POST /industry/opportunities/{opportunity_id}/skills",
    "PATCH /industry/opportunities/{opportunity_id}/publish", "PATCH /industry/opportunities/{opportunity_id}", "PATCH /industry/opportunities/{opportunity_id}/close",
    "GET /industry/opportunities", "GET /industry/opportunities/{opportunity_id}", "GET /industry/opportunities/{opportunity_id}/candidates",
    "GET /industry/candidates/search", "GET /industry/applications", "GET /industry/applications/{application_id}/candidate",
    "PATCH /industry/applications/{application_id}/status", "GET /industry/pipeline", "GET /industry/pipeline/{opportunity_id}",
    "POST /industry/interns/{application_id}/milestones", "PATCH /industry/interns/{application_id}/milestones/{tracking_id}",
    "GET /industry/interns", "GET /industry/notifications", "PATCH /industry/notifications/{notification_id}/read", "POST /industry/copilot/ask",
    "POST /industry/complaints",
    # Section E
    "GET /academician/profile", "PATCH /academician/profile", "POST /academician/profile/onboarding", "PUT /academician/expertise",
    "GET /academician/collaborations/available", "GET /academician/collaborations/recommended", "GET /academician/collaborations/{collaboration_id}",
    "POST /academician/collaborations/{collaboration_id}/apply", "POST /academician/collaborations", "GET /academician/collaborations/mine",
    "PATCH /academician/collaborations/{collaboration_id}/status", "PATCH /academician/collaborations/{collaboration_id}",
    "GET /academician/applications", "GET /academician/collaborations/history", "GET /academician/skill-pulse",
    "GET /academician/notifications", "PATCH /academician/notifications/{notification_id}/read", "POST /academician/copilot/ask",
    "GET /academician/alumni", "GET /academician/alumni/{alumni_id}", "POST /academician/complaints",
    # Section F
    "GET /institution/profile", "PATCH /institution/profile", "POST /institution/verify", "POST /institution/admins/invite",
    "GET /institution/students", "GET /institution/students/{student_id}", "GET /institution/students/at-risk",
    "GET /institution/analytics/skill-gaps", "GET /institution/analytics/assessments", "GET /institution/analytics/verified-evidence-rate",
    "GET /institution/analytics/training-progress", "GET /institution/analytics/internships", "GET /institution/analytics/placement-readiness",
    "GET /institution/analytics/placements", "GET /institution/analytics/department-comparison", "GET /institution/industry-connections",
    "GET /institution/skill-demand-trends", "GET /institution/interventions/recommended", "POST /institution/interventions/{recommendation_id}/act",
    "GET /institution/interventions/history", "GET /institution/reports/summary", "GET /institution/notifications",
    "PATCH /institution/notifications/{notification_id}/read", "POST /institution/copilot/ask", "POST /institution/complaints",
    # Section G
    "POST /assessments/manage", "PATCH /assessments/manage/{assessment_id}", "PATCH /assessments/manage/{assessment_id}/activate",
    "PATCH /assessments/manage/{assessment_id}/deactivate", "GET /assessments/manage", "DELETE /assessments/manage/{assessment_id}",
    "POST /assessments/manage/{assessment_id}/questions", "PATCH /assessments/manage/{assessment_id}/questions/{question_id}",
    "DELETE /assessments/manage/{assessment_id}/questions/{question_id}", "GET /assessments/manage/{assessment_id}/questions",
    "GET /assessments/manage/{assessment_id}/results/{result_id}/pending-review", "PATCH /assessments/manage/{assessment_id}/results/{result_id}/grade",
    "GET /assessments/manage/{assessment_id}/analytics", "GET /assessments/manage/{assessment_id}/coverage-preview",
    # Section H
    "GET /admin/overview", "GET /admin/overview/growth", "GET /admin/verifications", "PATCH /admin/verifications/{request_id}/approve",
    "PATCH /admin/verifications/{request_id}/reject", "GET /admin/users", "GET /admin/users/{user_id}", "PATCH /admin/users/{user_id}/suspend",
    "PATCH /admin/users/{user_id}/reactivate", "GET /admin/roles/pending-assignment", "PATCH /admin/users/{user_id}/role",
    "POST /admin/users/{user_id}/grant-super-admin", "POST /admin/users/{user_id}/revoke-super-admin", "GET /admin/audit-logs",
    "GET /admin/notifications", "PATCH /admin/notifications/{notification_id}/read",
    # Section I
    "GET /admin/skills", "POST /admin/skills", "PATCH /admin/skills/{skill_id}", "POST /admin/skills/{skill_id}/merge",
    "POST /admin/skills/{skill_id}/topics", "GET /admin/career-roles", "POST /admin/career-roles", "PATCH /admin/career-roles/{career_role_id}",
    "DELETE /admin/career-roles/{career_role_id}", "GET /admin/career-roles/{career_role_id}/skills", "POST /admin/career-roles/{career_role_id}/skills",
    "PATCH /admin/career-roles/{career_role_id}/skills/{role_skill_id}", "DELETE /admin/career-roles/{career_role_id}/skills/{role_skill_id}",
    "GET /admin/assessments", "PATCH /admin/assessments/{assessment_id}/force-deactivate", "GET /admin/assessments/flagged",
    "GET /admin/learning-programs", "POST /admin/learning-programs", "PATCH /admin/learning-programs/{program_id}",
    "DELETE /admin/learning-programs/{program_id}", "GET /admin/opportunities/flagged", "PATCH /admin/opportunities/{opportunity_id}/moderate",
    "GET /admin/complaints", "GET /admin/complaints/{complaint_id}", "PATCH /admin/complaints/{complaint_id}/status",
    "GET /admin/settings", "PATCH /admin/settings/{setting_key}",
    # Section J
    "GET /admin/matching/weight-proposals", "PATCH /admin/matching/weight-proposals/{id}/approve", "PATCH /admin/matching/weight-proposals/{id}/reject",
    "POST /admin/matching/run-outcome-analysis", "POST /admin/knowledge-base/documents", "POST /admin/knowledge-base/documents/text",
    "GET /admin/knowledge-base/documents", "DELETE /admin/knowledge-base/documents/{document_id}", "POST /admin/knowledge-base/documents/{document_id}/reprocess",
    "POST /admin/knowledge-base/documents/{document_id}/embed", "GET /admin/knowledge-base/test-query",
    # Section K
    "POST /alumni/profile/onboarding", "GET /alumni/profile", "PATCH /alumni/profile", "GET /alumni/skills", "POST /alumni/skills",
    "DELETE /alumni/skills/{skill_id}", "PATCH /alumni/skills/{skill_id}/mentorship", "POST /alumni/verification", "GET /alumni/verification",
    # Section L
    "POST /community/conversations", "GET /community/conversations", "GET /community/conversations/{conversation_id}/messages",
    "POST /community/conversations/{conversation_id}/messages", "PATCH /community/messages/{message_id}", "DELETE /community/messages/{message_id}",
    "PATCH /community/conversations/{conversation_id}/read",
    # Section M
    "POST /files/upload", "GET /files/signed-url", "DELETE /files", "GET /platform/matching-methodology"
}

def diff():
    with open("current_routes.json", "r") as f:
        routes = json.load(f)
        
    actual = {f"{r['method']} {r['path']}" for r in routes}
    
    missing = expected - actual
    extra = actual - expected
    
    print("--- MISSING ROUTES ---")
    for r in sorted(missing):
        print(r)
        
    print("\n--- EXTRA ROUTES ---")
    for r in sorted(extra):
        print(r)

if __name__ == "__main__":
    diff()
