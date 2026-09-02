import json
import re

extracted_routes = [
    "/student/profile", "/student/profile", "/student/profile/onboarding", "/student/profile/target-role", 
    "/student/profile/target-role", "/student/skills", "/student/skills", "/student/skills/dna/{skill_id}", 
    "/student/skill-gap", "/student/skill-gap/summary", "/student/career-digital-twin", "/student/career-roadmap", 
    "/student/learning-progress/recommendations", "/student/learning-progress", "/student/learning-progress/{progress_id}", 
    "/student/learning-progress", "/student/opportunities", "/student/applications", "/student/applications", 
    "/student/applications/{application_id}", "/student/portfolio/projects", "/student/portfolio/projects", 
    "/student/portfolio/certifications", "/student/portfolio/certifications", "/student/notifications", 
    "/student/notifications/{notification_id}/read", "/student/copilot", "/student/copilot/history", 
    "/industry/company", "/industry/company", "/industry/company/verify", "/industry/company/recruiters/invite", 
    "/industry/profile", "/industry/profile", "/industry/opportunities", "/industry/opportunities/{opportunity_id}/skills", 
    "/industry/opportunities/{opportunity_id}/publish", "/industry/opportunities/{opportunity_id}/close", 
    "/industry/opportunities/{opportunity_id}", "/industry/opportunities", "/industry/opportunities/{opportunity_id}", 
    "/industry/opportunities/{opportunity_id}/candidates", "/industry/candidates/search", "/industry/applications", 
    "/industry/applications/{application_id}/candidate", "/industry/applications/{application_id}/status", 
    "/industry/pipeline", "/industry/pipeline/{opportunity_id}", "/industry/interns/{application_id}/milestones", 
    "/industry/interns/{application_id}/milestones/{tracking_id}", "/industry/interns", "/industry/notifications", 
    "/industry/notifications/{notification_id}/read", "/industry/copilot/ask", "/industry/copilot/history", 
    "/academician/profile", "/academician/profile/onboarding", "/academician/profile", "/academician/expertise", 
    "/academician/collaborations/available", "/academician/collaborations/recommended", "/academician/collaborations/{collaboration_id}", 
    "/academician/collaborations/{collaboration_id}/apply", "/academician/collaborations", "/academician/collaborations/mine", 
    "/academician/collaborations/{collaboration_id}", "/academician/collaborations/{collaboration_id}/status", "/academician/applications", 
    "/academician/collaborations/history", "/academician/skill-pulse", "/academician/notifications", 
    "/academician/notifications/{notification_id}/read", "/academician/copilot/ask", "/academician/copilot/history", 
    "/institution/profile", "/institution/profile", "/institution/verify", "/institution/admins/invite", 
    "/institution/students", "/institution/students/at-risk", "/institution/students/{student_id}", 
    "/institution/analytics/skill-gaps", "/institution/analytics/assessments", "/institution/analytics/placements", 
    "/institution/analytics/department-comparison", "/institution/industry-connections", "/institution/skill-demand-trends", 
    "/institution/interventions/recommended", "/institution/interventions/act", "/institution/interventions/history", 
    "/institution/reports/summary", "/institution/notifications", "/institution/notifications/{notification_id}/read", 
    "/institution/copilot/ask", "/institution/copilot/history"
]

# Note: We need to match with methods. Let's just do a path check for now.
expected_a = [
    "/student/profile", "/student/profile", "/student/profile/onboarding", "/student/target-role", 
    "/student/target-role", "/student/skills", "/student/skills", "/student/skills/dna/{skill_id}", 
    "/student/skill-gap", "/student/skill-gap/summary", "/student/career-digital-twin", "/student/career-roadmap", 
    "/student/learning-recommendations", "/student/learning-progress", "/student/learning-progress/{progress_id}", 
    "/student/learning-progress", "/student/opportunities/recommended", "/student/applications", "/student/applications", 
    "/student/internships/{application_id}/tracking", "/student/portfolio", "/student/portfolio/projects", 
    "/student/portfolio/certifications", "/student/notifications", "/student/notifications/{notification_id}/read", 
    "/student/copilot/ask"
]

expected_b = [
    "/industry/company", "/industry/company", "/industry/company/verify", "/industry/recruiters/invite", 
    "/industry/profile", "/industry/profile", "/industry/opportunities", "/industry/opportunities/{opportunity_id}/skills", 
    "/industry/opportunities/{opportunity_id}/publish", "/industry/opportunities/{opportunity_id}", 
    "/industry/opportunities/{opportunity_id}/close", "/industry/opportunities", "/industry/opportunities/{opportunity_id}", 
    "/industry/opportunities/{opportunity_id}/candidates", "/industry/candidates/search", "/industry/applications", 
    "/industry/applications/{application_id}/candidate", "/industry/applications/{application_id}/status", 
    "/industry/pipeline", "/industry/pipeline/{opportunity_id}", "/industry/interns/{application_id}/milestones", 
    "/industry/interns/{application_id}/milestones/{tracking_id}", "/industry/interns", "/industry/notifications", 
    "/industry/notifications/{notification_id}/read", "/industry/copilot/ask"
]

expected_c = [
    "/academician/profile", "/academician/profile", "/academician/profile/onboarding", "/academician/expertise", 
    "/academician/collaborations/available", "/academician/collaborations/recommended", "/academician/collaborations/{collaboration_id}", 
    "/academician/collaborations/{collaboration_id}/apply", "/academician/collaborations", "/academician/collaborations/mine", 
    "/academician/collaborations/{collaboration_id}/status", "/academician/collaborations/{collaboration_id}", 
    "/academician/applications", "/academician/collaborations/history", "/academician/skill-pulse", 
    "/academician/notifications", "/academician/notifications/{notification_id}/read", "/academician/copilot/ask"
]

expected_d = [
    "/institution/profile", "/institution/profile", "/institution/verify", "/institution/admins/invite", 
    "/institution/students", "/institution/students/{student_id}", "/institution/students/at-risk", 
    "/institution/analytics/skill-gaps", "/institution/analytics/assessments", "/institution/analytics/verified-evidence-rate", 
    "/institution/analytics/training-progress", "/institution/analytics/internships", "/institution/analytics/placement-readiness", 
    "/institution/analytics/placements", "/institution/analytics/department-comparison", "/institution/industry-connections", 
    "/institution/skill-demand-trends", "/institution/interventions/recommended", "/institution/interventions/{recommendation_id}/act", 
    "/institution/interventions/history", "/institution/reports/summary", "/institution/reports/summary?format=csv", 
    "/institution/notifications", "/institution/notifications/{notification_id}/read", "/institution/copilot/ask"
]

expected_all = set(expected_a + expected_b + expected_c + expected_d)
extracted_all = set(extracted_routes)

missing = expected_all - extracted_all
extra = extracted_all - expected_all

print("MISSING:", missing)
print("EXTRA:", extra)
