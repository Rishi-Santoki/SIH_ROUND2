import os
import json
from datetime import datetime, date
from dotenv import load_dotenv
from supabase import create_client

# Load environment
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed_rohan():
    print("[*] Seeding rich demonstration data for Rohan Mehta (rohan.mehta@ldrp.test)...")
    
    # 1. Fetch Rohan user ID
    user_res = supabase.table("users").select("user_id").eq("email", "rohan.mehta@ldrp.test").execute()
    if not user_res.data:
        print("[-] User rohan.mehta@ldrp.test not found in users table.")
        return
    rohan_id = user_res.data[0]["user_id"]
    print(f"   [+] Found Rohan Mehta user_id: {rohan_id}")

    # 2. Update users profile image if null
    supabase.table("users").update({
        "full_name": "Rohan Mehta",
        "profile_image": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80"
    }).eq("user_id", rohan_id).execute()
    print("   [+] Updated user record with avatar")

    # 3. Update student profile
    cloud_role_res = supabase.table("career_roles").select("career_role_id").eq("title", "Cloud Engineer").execute()
    cloud_role_id = cloud_role_res.data[0]["career_role_id"] if cloud_role_res.data else "d03ba8dc-14b5-4afa-9335-4a2b91cee425"

    profile_data = {
        "department": "Computer Science & Engineering",
        "current_year": 3,
        "graduation_year": 2026,
        "cgpa": 8.85,
        "target_career_id": cloud_role_id,
        "bio": "Pre-final year CSE student passionate about Cloud Infrastructure, Distributed Microservices, and Machine Learning. Smart India Hackathon finalist and open-source contributor.",
        "resume_url": "https://drive.google.com/file/d/sample-rohan-mehta-resume/view"
    }
    
    existing_prof = supabase.table("student_profiles").select("student_id").eq("student_id", rohan_id).execute()
    if existing_prof.data:
        supabase.table("student_profiles").update(profile_data).eq("student_id", rohan_id).execute()
    else:
        profile_data["student_id"] = rohan_id
        supabase.table("student_profiles").insert(profile_data).execute()
    print("   [+] Updated Student Profile (Bio, CGPA 8.85, Year 3, Resume)")

    # 4. Seed Skills
    skill_names_to_add = [
        ("AWS", 82, "verified", "assessment", 0.92),
        ("Docker", 75, "verified", "project", 0.85),
        ("Kubernetes", 62, "self_declared", "self_declared", 0.60),
        ("Python", 88, "verified", "assessment", 0.95),
        ("Cloud Computing", 84, "verified", "certificate", 0.90),
        ("SQL", 78, "verified", "assessment", 0.84),
        ("Machine Learning", 70, "self_declared", "self_declared", 0.72),
        ("JavaScript", 74, "verified", "project", 0.76),
    ]

    skill_id_map = {}
    skills_db = supabase.table("skills").select("skill_id, name").execute().data
    name_to_id = {s["name"].lower(): s["skill_id"] for s in skills_db}

    for name, level, verif, source, conf in skill_names_to_add:
        s_id = name_to_id.get(name.lower())
        if not s_id:
            continue
        skill_id_map[name] = s_id
        
        # Upsert student_skills
        existing_ss = supabase.table("student_skills").select("student_skill_id").eq("student_id", rohan_id).eq("skill_id", s_id).execute()
        ss_payload = {
            "student_id": rohan_id,
            "skill_id": s_id,
            "proficiency_level": level,
            "verification_status": verif,
            "source": source,
            "confidence_score": conf
        }
        if existing_ss.data:
            supabase.table("student_skills").update(ss_payload).eq("student_skill_id", existing_ss.data[0]["student_skill_id"]).execute()
            ss_id = existing_ss.data[0]["student_skill_id"]
        else:
            new_ss = supabase.table("student_skills").insert(ss_payload).execute()
            ss_id = new_ss.data[0]["student_skill_id"]
        
        # Evidence entry
        supabase.table("skill_evidence").delete().eq("student_skill_id", ss_id).execute()
        supabase.table("skill_evidence").insert({
            "student_skill_id": ss_id,
            "evidence_type": "project" if source == "project" else ("certification" if source == "certificate" else "assessment"),
            "weight": 2.0 if verif == "verified" else 1.0,
            "created_at": datetime.now().isoformat()
        }).execute()
        
    print(f"   [+] Added {len(skill_names_to_add)} verified and self-declared skills with evidence")

    # 5. Seed Projects
    projects = [
        {
            "student_id": rohan_id,
            "title": "Multi-Cloud Kubernetes Orchestrator",
            "description": "Automated microservices deployment tool managing container workloads and rolling deployments across AWS EKS and GCP GKE with zero-downtime canary rollouts.",
            "github_url": "https://github.com/rohan-mehta/cloud-orchestrator",
            "project_url": "https://cloud-orchestrator.demo.dev",
            "verification_status": "verified"
        },
        {
            "student_id": rohan_id,
            "title": "Real-Time Telemetry & Log Aggregator",
            "description": "Distributed log streaming pipeline handling 15,000 events/second using Kafka, Prometheus, and Grafana with anomaly detection alerts.",
            "github_url": "https://github.com/rohan-mehta/telemetry-pipeline",
            "project_url": "https://telemetry.demo.dev",
            "verification_status": "verified"
        },
        {
            "student_id": rohan_id,
            "title": "AI-Powered Skill Intelligence Engine",
            "description": "Vector similarity matching engine comparing student curriculum proficiency against industry role requirements using FastAPI and Supabase pgvector.",
            "github_url": "https://github.com/rohan-mehta/skill-intelligence",
            "project_url": "https://skill-match.demo.dev",
            "verification_status": "verified"
        }
    ]
    # Clear old projects and re-insert
    supabase.table("projects").delete().eq("student_id", rohan_id).execute()
    supabase.table("projects").insert(projects).execute()
    print("   [+] Added 3 featured portfolio projects")

    # 6. Seed Certifications
    certs = [
        {
            "student_id": rohan_id,
            "title": "AWS Certified Solutions Architect - Associate",
            "provider": "Amazon Web Services",
            "issue_date": "2025-08-15",
            "credential_id": "AWS-SAA-884920",
            "credential_url": "https://aws.amazon.com/verification",
            "verification_status": "verified"
        },
        {
            "student_id": rohan_id,
            "title": "Google Cloud Associate Cloud Engineer",
            "provider": "Google Cloud",
            "issue_date": "2025-11-20",
            "credential_id": "GCP-ACE-33921",
            "credential_url": "https://cloud.google.com/certification",
            "verification_status": "verified"
        },
        {
            "student_id": rohan_id,
            "title": "Docker & Kubernetes: Microservices Architecture",
            "provider": "Coursera",
            "issue_date": "2026-01-10",
            "credential_id": "COURSERA-DK-1102",
            "credential_url": "https://coursera.org/verify",
            "verification_status": "verified"
        }
    ]
    supabase.table("certifications").delete().eq("student_id", rohan_id).execute()
    supabase.table("certifications").insert(certs).execute()
    print("   [+] Added 3 verified professional certifications")

    # 7. Seed Learning Progress
    programs = supabase.table("learning_programs").select("program_id, title").execute().data
    if programs:
        supabase.table("student_learning_progress").delete().eq("student_id", rohan_id).execute()
        progress_entries = []
        for i, prog in enumerate(programs[:3]):
            pct = 100 if i == 0 else (75 if i == 1 else 40)
            status = "completed" if pct == 100 else "in_progress"
            progress_entries.append({
                "student_id": rohan_id,
                "program_id": prog["program_id"],
                "progress_percentage": pct,
                "status": status,
                "completed_at": datetime.now().isoformat() if status == "completed" else None
            })
        if progress_entries:
            supabase.table("student_learning_progress").insert(progress_entries).execute()
            print(f"   [+] Enrolled Rohan in {len(progress_entries)} NPTEL learning programs with progress")

    # 8. Seed Assessment Result
    assessments = supabase.table("assessments").select("assessment_id, total_marks").execute().data
    if assessments:
        a = assessments[0]
        supabase.table("assessment_results").delete().eq("student_id", rohan_id).execute()
        supabase.table("assessment_results").insert({
            "student_id": rohan_id,
            "assessment_id": a["assessment_id"],
            "score": int(a["total_marks"] * 0.9),
            "percentage": 90.0,
            "attempt_number": 1,
            "started_at": "2026-02-14T14:00:00",
            "completed_at": "2026-02-14T14:45:00"
        }).execute()
        print("   [+] Added completed assessment result (90% score)")

    # 9. Update Applications with high match score
    opps = supabase.table("opportunities").select("opportunity_id").limit(2).execute().data
    if opps:
        supabase.table("applications").delete().eq("student_id", rohan_id).execute()
        app_entries = []
        for i, opp in enumerate(opps):
            app_entries.append({
                "student_id": rohan_id,
                "opportunity_id": opp["opportunity_id"],
                "match_score": 88.5 if i == 0 else 76.0,
                "status": "shortlisted" if i == 0 else "under_review",
                "applied_at": datetime.now().isoformat(),
                "match_score_breakdown": json.dumps({
                    "skill_compatibility": 42.5,
                    "assessment_evidence": 25.0,
                    "projects_experience": 15.0,
                    "eligibility": 6.0,
                    "career_interest": 0.0
                })
            })
        supabase.table("applications").insert(app_entries).execute()
        print(f"   [+] Updated {len(app_entries)} applications with shortlisted status and breakdown")

    print("\n[SUCCESS] Rohan Mehta profile is now fully populated with rich demo data!")

if __name__ == "__main__":
    seed_rohan()
