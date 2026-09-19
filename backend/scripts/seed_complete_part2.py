import os
import sys
import uuid
import datetime
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_user_by_email(email: str):
    res = supabase.table("users").select("*").eq("email", email).execute()
    return res.data[0] if res.data else None

def get_skill_by_name(name: str):
    res = supabase.table("skills").select("*").eq("name", name).execute()
    return res.data[0] if res.data else None

def get_assessment_by_title(title: str):
    res = supabase.table("assessments").select("*").eq("title", title).execute()
    return res.data[0] if res.data else None

def get_institution_by_name(name: str):
    res = supabase.table("institutions").select("*").eq("name", name).execute()
    return res.data[0] if res.data else None

def get_company_by_name(name: str):
    res = supabase.table("companies").select("*").eq("name", name).execute()
    return res.data[0] if res.data else None

def get_program_by_title(title: str):
    res = supabase.table("learning_programs").select("*").eq("title", title).execute()
    return res.data[0] if res.data else None

def get_opportunity_by_title(title: str):
    res = supabase.table("opportunities").select("*").eq("title", title).execute()
    return res.data[0] if res.data else None

print("============================================================")
print("  COMPLETE DUMMY DATA SEED SCRIPT - PART 2")
print("  Academia-Industry Collaboration Portal (PS 26044)")
print("============================================================")

# 1. Fetch core entities
super_admin = get_user_by_email("admin@aicp.edu")
aarav = get_user_by_email("aarav.patel@ldrp.test")
diya = get_user_by_email("diya.shah@ldrp.test")
rohan = get_user_by_email("rohan.mehta@ldrp.test")
priya = get_user_by_email("priya.nair@silveroak.test")

if not super_admin or not aarav or not diya or not priya:
    print("Error: Core users from Part 1 not found. Did Part 1 run successfully?")
    sys.exit(1)

assessment = get_assessment_by_title("Python Fundamentals Assessment")
if not assessment:
    print("Error: Python Fundamentals Assessment not found.")
    sys.exit(1)

# Fetch skills
python_skill = get_skill_by_name("Python")
syntax_skill = get_skill_by_name("Syntax")
ds_skill = get_skill_by_name("Data Structures")
oop_skill = get_skill_by_name("OOP")
fileio_skill = get_skill_by_name("File I/O")
lib_skill = get_skill_by_name("Libraries")
error_skill = get_skill_by_name("Error Handling")
ml_skill = get_skill_by_name("Machine Learning")
sql_skill = get_skill_by_name("SQL")
dl_skill = get_skill_by_name("Deep Learning")
react_skill = get_skill_by_name("React")
node_skill = get_skill_by_name("Node.js")

if not all([python_skill, ml_skill, sql_skill, react_skill]):
    print("Error: Expected skills not found.")
    sys.exit(1)

ldrp = get_institution_by_name("LDRP Institute of Technology")
silver_oak = get_institution_by_name("Silver Oak College")
technova = get_company_by_name("TechNova Solutions")

def create_evidence_chain(user, assessment_ref, is_diya=False):
    print(f"── Creating Evidence Chain for {user['full_name']} ──")
    
    # Check if result exists
    existing = supabase.table("assessment_results").select("*").eq("student_id", user["user_id"]).eq("assessment_id", assessment_ref["assessment_id"]).execute()
    if existing.data:
        print(f"   ✓ Assessment result already exists for {user['full_name']}")
        result_id = existing.data[0]["result_id"]
    else:
        # Create attempt
        res = supabase.table("assessment_results").insert({
            "student_id": user["user_id"],
            "assessment_id": assessment_ref["assessment_id"],
            "score": 85 if not is_diya else 82,
            "percentage": 85 if not is_diya else 82,
            "started_at": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)).isoformat(),
            "completed_at": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2, hours=-1)).isoformat()
        }).execute()
        result_id = res.data[0]["result_id"]
        print(f"   ✓ Created assessment_results row (85%)")

    # Map subtopics to scores
    subtopic_scores = [
        (syntax_skill, 90),
        (ds_skill, 85),
        (oop_skill, 70 if not is_diya else 80),
        (fileio_skill, 60 if not is_diya else 75),
        (lib_skill, 75 if not is_diya else 90)
    ]

    for skill, score in subtopic_scores:
        if not skill:
            continue
        
        # Add to student_skills
        res_skill = supabase.table("student_skills").upsert({
            "student_id": user["user_id"],
            "skill_id": skill["skill_id"],
            "proficiency_level": score,
            "verification_status": "verified",
            "source": "assessment"
        }, on_conflict="student_id,skill_id").execute()
        
        student_skill_id = res_skill.data[0]["student_skill_id"]
        
        # Add to skill_evidence
        # Note: on_conflict requires unique constraints. If student_skill_id,evidence_type,evidence_ref_id is unique we can use it.
        # Otherwise we just check if it exists.
        existing_ev = supabase.table("skill_evidence").select("*").eq("student_skill_id", student_skill_id).eq("evidence_ref_id", result_id).execute()
        if not existing_ev.data:
            supabase.table("skill_evidence").insert({
                "student_skill_id": student_skill_id,
                "evidence_type": "assessment",
                "evidence_ref_id": result_id,
                "weight": 1.0
            }).execute()

    print(f"   ✓ Added {len(subtopic_scores)} sub-topic student_skills and skill_evidence")
    
    # Ensure Error Handling and MLOps are NOT present for Aarav
    if not is_diya:
        err_check = supabase.table("student_skills").select("*").eq("student_id", user["user_id"]).eq("skill_id", error_skill["skill_id"]).execute()
        assert len(err_check.data) == 0, "Error: Error Handling skill should not exist for Aarav."
        print("   ✓ Confirmed Error Handling skill is appropriately absent")

create_evidence_chain(aarav, assessment)
create_evidence_chain(priya, assessment, is_diya=True)


print("\n── 2. Student Skills (Self-Declared) ──")
# Aarav SQL, Deep Learning
if sql_skill:
    supabase.table("student_skills").upsert({
        "student_id": aarav["user_id"], "skill_id": sql_skill["skill_id"], "proficiency_level": 55, "source": "self_declared", "verification_status": "self_declared"
    }, on_conflict="student_id,skill_id").execute()
if dl_skill:
    supabase.table("student_skills").upsert({
        "student_id": aarav["user_id"], "skill_id": dl_skill["skill_id"], "proficiency_level": 30, "source": "self_declared", "verification_status": "self_declared"
    }, on_conflict="student_id,skill_id").execute()

# Diya SQL
if sql_skill:
    supabase.table("student_skills").upsert({
        "student_id": diya["user_id"], "skill_id": sql_skill["skill_id"], "proficiency_level": 50, "source": "self_declared", "verification_status": "self_declared"
    }, on_conflict="student_id,skill_id").execute()
print("   ✓ Aarav & Diya self-declared skills added")

# Check Rohan skills
rohan_skills = supabase.table("student_skills").select("*").eq("student_id", rohan["user_id"]).execute()
print(f"   ✓ Rohan Mehta: {len(rohan_skills.data)} skills configured")


print("\n── 3. Projects ──")
# Aarav ML Project
existing_aarav_proj = supabase.table("projects").select("*").eq("student_id", aarav["user_id"]).eq("title", "Movie Recommendation System").execute()
if not existing_aarav_proj.data:
    proj_aarav = supabase.table("projects").insert({
        "student_id": aarav["user_id"], "title": "Movie Recommendation System", "description": "Collaborative filtering...",
        "github_url": "https://github.com/aarav/movie-rec", "verification_status": "verified"
    }).execute()
    proj_aarav_id = proj_aarav.data[0]["project_id"]
else:
    proj_aarav_id = existing_aarav_proj.data[0]["project_id"]

if ml_skill:
    res_ml = supabase.table("student_skills").upsert({
        "student_id": aarav["user_id"],
        "skill_id": ml_skill["skill_id"],
        "proficiency_level": 70,
        "verification_status": "verified",
        "source": "project"
    }, on_conflict="student_id,skill_id").execute()
    
    student_skill_id = res_ml.data[0]["student_skill_id"]
    
    existing_ml_ev = supabase.table("skill_evidence").select("*").eq("student_skill_id", student_skill_id).eq("evidence_ref_id", proj_aarav_id).execute()
    if not existing_ml_ev.data:
        supabase.table("skill_evidence").insert({
            "student_skill_id": student_skill_id, "evidence_type": "project", "evidence_ref_id": proj_aarav_id, "weight": 1.0
        }).execute()
print("   ✓ Aarav ML project and evidence created")

# Diya Projects
if not supabase.table("projects").select("*").eq("student_id", diya["user_id"]).eq("title", "E-commerce Storefront").execute().data:
    supabase.table("projects").insert({
        "student_id": diya["user_id"], "title": "E-commerce Storefront", "description": "React store",
        "github_url": "https://github.com/diya/e-commerce", "verification_status": "verified"
    }).execute()

if not supabase.table("projects").select("*").eq("student_id", diya["user_id"]).eq("title", "Personal Portfolio Website").execute().data:
    proj_diya_pending = supabase.table("projects").insert({
        "student_id": diya["user_id"], "title": "Personal Portfolio Website", "description": "Node backend",
        "github_url": "https://github.com/diya/portfolio", "verification_status": "pending"
    }).execute()
    
    # Create verification request
    supabase.table("verification_requests").insert({
        "entity_type": "project",
        "entity_id": proj_diya_pending.data[0]["project_id"],
        "submitted_by": diya["user_id"],
        "status": "pending"
    }).execute()
print("   ✓ Diya React (verified) and Node.js (pending) projects created")


print("\n── 4. Certifications ──")
if not supabase.table("certifications").select("*").eq("student_id", aarav["user_id"]).eq("title", "AWS Certified Cloud Practitioner").execute().data:
    cert_aarav = supabase.table("certifications").insert({
        "student_id": aarav["user_id"], "title": "AWS Certified Cloud Practitioner", "provider": "AWS",
        "verification_status": "pending"
    }).execute()
    supabase.table("verification_requests").insert({
        "entity_type": "certification", "entity_id": cert_aarav.data[0]["certification_id"],
        "submitted_by": aarav["user_id"], "status": "pending"
    }).execute()

if not supabase.table("certifications").select("*").eq("student_id", diya["user_id"]).eq("title", "Meta Front-End Developer Certificate").execute().data:
    supabase.table("certifications").insert({
        "student_id": diya["user_id"], "title": "Meta Front-End Developer Certificate", "provider": "Coursera",
        "verification_status": "verified"
    }).execute()
print("   ✓ Certifications added")


print("\n── 6. Student Learning Progress ──")
dl_prog = get_program_by_title("Deep Learning Specialization")
fs_prog = get_program_by_title("Full Stack Web Development Bootcamp")

if dl_prog and not supabase.table("student_learning_progress").select("*").eq("student_id", aarav["user_id"]).eq("program_id", dl_prog["program_id"]).execute().data:
    supabase.table("student_learning_progress").insert({
        "student_id": aarav["user_id"], "program_id": dl_prog["program_id"], "status": "in_progress", "progress_percentage": 40
    }).execute()
if fs_prog and not supabase.table("student_learning_progress").select("*").eq("student_id", diya["user_id"]).eq("program_id", fs_prog["program_id"]).execute().data:
    supabase.table("student_learning_progress").insert({
        "student_id": diya["user_id"], "program_id": fs_prog["program_id"], "status": "completed", "progress_percentage": 100
    }).execute()
print("   ✓ Learning progress added")


print("\n── 7. Internship Tracking ──")
# Ensure Kabir exists
kabir = get_user_by_email("kabir.joshi@ldrp.test")
if not kabir:
    try:
        supabase.auth.admin.create_user({
            "email": "kabir.joshi@ldrp.test",
            "password": "Test@12345",
            "email_confirm": True,
            "user_metadata": {"full_name": "Kabir Joshi"}
        })
        print("   ✓ Created Kabir auth user")
    except Exception as e:
        pass
    
    kabir = get_user_by_email("kabir.joshi@ldrp.test")
    if not kabir:
        sys.exit("Failed to create Kabir")
        
    supabase.table("users").update({"role": "student", "full_name": "Kabir Joshi"}).eq("user_id", kabir["user_id"]).execute()
    supabase.table("student_profiles").upsert({
        "student_id": kabir["user_id"], "institution_id": ldrp["institution_id"], "current_year": "4th", "department": "CSE", "graduation_year": 2024
    }).execute()

opp = get_opportunity_by_title("Machine Learning Engineer Intern")
if opp:
    kabir_app = supabase.table("applications").select("*").eq("student_id", kabir["user_id"]).eq("opportunity_id", opp["opportunity_id"]).execute()
    if not kabir_app.data:
        app = supabase.table("applications").insert({
            "student_id": kabir["user_id"], "opportunity_id": opp["opportunity_id"], "status": "selected", "match_score": 88
        }).execute()
        app_id = app.data[0]["application_id"]
        
        supabase.table("internship_tracking").insert({
            "application_id": app_id, "milestone": "Mid-term Evaluation",
            "status": "in_progress", "mentor_feedback": "Doing well, progressing on tasks.", "mentor_rating": 4
        }).execute()
        print("   ✓ Kabir internship tracking added")


print("\n── 8. Verification Requests (Historical) & 9. Audit Logs ──")
# LDRP, Silver Oak, TechNova
def add_historic_verification(entity_type, entity_id):
    existing = supabase.table("verification_requests").select("*").eq("entity_id", entity_id).eq("status", "approved").execute()
    if not existing.data:
        supabase.table("verification_requests").insert({
            "entity_type": entity_type, "entity_id": entity_id, "submitted_by": super_admin["user_id"],
            "status": "approved", "reviewed_by": super_admin["user_id"], "reviewed_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }).execute()
        
        # Add Audit log
        supabase.table("audit_logs").insert({
            "actor_id": super_admin["user_id"], "action": "VERIFY_ENTITY",
            "entity_type": entity_type, "entity_id": entity_id, "metadata": {"note": "Verified upon platform onboarding"}
        }).execute()

if ldrp: add_historic_verification("institution", ldrp["institution_id"])
if silver_oak: add_historic_verification("institution", silver_oak["institution_id"])
if technova: add_historic_verification("company", technova["company_id"])
print("   ✓ Historic verifications and audit logs added")


print("\n── 10. Complaints ──")
if rohan:
    existing_complaint = supabase.table("complaints").select("*").eq("raised_by", rohan["user_id"]).execute()
    if not existing_complaint.data:
        # Create a sample fake company just for the complaint if needed, or complain about technova
        supabase.table("complaints").insert({
            "raised_by": rohan["user_id"],
            "against_entity_type": "company",
            "against_entity_id": technova["company_id"],
            "category": "Fake Job Posting",
            "description": "I applied for a job but the company asked me for a processing fee.",
            "status": "open"
        }).execute()
        print("   ✓ Complaint from Rohan added")


print("\n── 11. Weight Adjustment Proposals ──")
existing_proposal = supabase.table("weight_adjustment_proposals").select("*").execute()
if not existing_proposal.data:
    supabase.table("weight_adjustment_proposals").insert({
        "proposed_weights": {"skill_compatibility": 0.6, "career_interest": 0.2, "institution_ranking": 0.2},
        "based_on_sample_size": 150, "rationale": "Illustrative example: increasing skill weight based on initial placement signals.",
        "status": "pending"
    }).execute()
print("   ✓ Weight adjustment proposal added")


print("\n── 12. Chat History ──")
existing_chat = supabase.table("chat_history").select("*").eq("user_id", aarav["user_id"]).execute()
if not existing_chat.data:
        import uuid
        supabase.table("chat_history").insert({
            "user_id": aarav["user_id"], "session_id": str(uuid.uuid4()), "role": "assistant",
            "message": "Based on your verified Machine Learning skills, you match 85% with the ML Engineer Intern role."
        }).execute()
print("   ✓ Chat history added")


print("\n── 13. Institution Admins (Dean Anjali Bhatt) ──")
anjali = get_user_by_email("anjali.bhatt@ldrp.test")
if not anjali:
    try:
        supabase.auth.admin.create_user({
            "email": "anjali.bhatt@ldrp.test",
            "password": "Test@12345",
            "email_confirm": True,
            "user_metadata": {"full_name": "Dean Anjali Bhatt"}
        })
        print("   ✓ Created Dean Anjali auth user")
    except Exception as e:
        pass
    anjali = ensure_auth_user("anjali.bhatt@ldrp.test", "securepassword123")
    print("   ✓ Created Dean Anjali auth user")

anjali = get_user_by_email("anjali.bhatt@ldrp.test")
if anjali and ldrp:
    supabase.table("users").update({"role": "institution", "full_name": "Dean Anjali Bhatt"}).eq("user_id", anjali["user_id"]).execute()
    supabase.table("institution_admins").upsert({
        "admin_id": anjali["user_id"], "institution_id": ldrp["institution_id"], "is_primary_contact": False
    }).execute()
    print("   ✓ Dean Anjali institution admin profile created")


print("============================================================")
print("  SEEDING PART 2 COMPLETE")
print("============================================================")
