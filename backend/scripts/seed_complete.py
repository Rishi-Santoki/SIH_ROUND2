"""
Complete Dummy Data Seed Script
================================
Creates all interconnected test entities for dashboard testing.
Idempotent — running twice will not create duplicates.

Usage:
    cd backend
    python scripts/seed_complete.py
"""

import os
import sys
import json
import datetime

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

counts = {}  # table -> count of rows inserted

def track(table, n=1):
    counts[table] = counts.get(table, 0) + n

def find_or_create_skill(name, category=None, description=None, parent_id=None):
    """Find skill by name, create if missing. Returns skill_id."""
    res = client.table("skills").select("skill_id").eq("name", name).execute()
    if res.data:
        return res.data[0]["skill_id"]
    ins = client.table("skills").insert({
        "name": name,
        "category": category or "General",
        "description": description or f"Proficiency in {name}",
        "parent_skill_id": parent_id
    }).execute()
    track("skills")
    return ins.data[0]["skill_id"]

def find_user_by_email(email):
    """Returns user_id or None."""
    res = client.table("users").select("user_id").eq("email", email).execute()
    return res.data[0]["user_id"] if res.data else None

def create_auth_user(email, password, full_name, role):
    """
    Create a Supabase auth user. The handle_new_user() trigger
    auto-creates the public.users row.
    Returns user_id.
    """
    existing = find_user_by_email(email)
    if existing:
        return existing

    # For super_admin, the trigger rejects that role.
    # Create as 'student' first, then update role.
    actual_role = role if role != "super_admin" else "student"

    try:
        res = client.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": full_name,
                "role": actual_role
            }
        })
        user_id = res.user.id
        track("users (auth)")
    except Exception as e:
        # Might already exist in auth but not in public.users
        # Try to find via auth API
        err_str = str(e)
        if "already been registered" in err_str or "already exists" in err_str:
            # Try to find the user
            existing = find_user_by_email(email)
            if existing:
                return existing
            raise
        raise

    # If super_admin, update the role in public.users
    if role == "super_admin":
        client.table("users").update({"role": "super_admin"}).eq("user_id", user_id).execute()

    return user_id


# ──────────────────────────────────────────────
# STEP 1: Reference Data (Skills, Career Roles, Role Skills)
# ──────────────────────────────────────────────

def seed_reference_data():
    print("── Step 1: Reference Data (Skills, Career Roles, Role Skills) ──")

    # Import and run existing seed logic
    sys.path.insert(0, os.path.join(backend_dir, "app", "routers"))
    from seed_logic import run_seed_reference_data
    run_seed_reference_data(client)
    print("   ✓ Base reference data seeded via seed_logic.py")

    # Ensure REST API Design is in Full Stack Developer role_skills
    rest_skill_id = find_or_create_skill("REST API Design", "Web Development", "Designing RESTful APIs")

    fsd_res = client.table("career_roles").select("career_role_id").eq("title", "Full Stack Developer").execute()
    if fsd_res.data:
        fsd_id = fsd_res.data[0]["career_role_id"]
        existing = client.table("role_skills").select("*").eq("career_role_id", fsd_id).eq("skill_id", rest_skill_id).execute()
        if not existing.data:
            client.table("role_skills").insert({
                "career_role_id": fsd_id,
                "skill_id": rest_skill_id,
                "required_level": 70,
                "importance_weight": 0.15,
                "is_mandatory": True
            }).execute()
            track("role_skills")
            print("   ✓ Added REST API Design to Full Stack Developer")

    # Recalculate Full Stack Developer weights to sum to ~1.0
    # Existing: React 0.4, Node.js 0.4, SQL 0.2 → need to adjust for REST API Design 0.15
    # Update: React 0.30, Node.js 0.30, SQL 0.15, REST API Design 0.25
    fsd_skills_update = {
        "React": 0.30,
        "Node.js": 0.30,
        "SQL": 0.15,
    }
    for skill_name, new_weight in fsd_skills_update.items():
        s_id = find_or_create_skill(skill_name)
        client.table("role_skills").update({"importance_weight": new_weight}).eq("career_role_id", fsd_id).eq("skill_id", s_id).execute()

    # Update REST API Design weight
    client.table("role_skills").update({"importance_weight": 0.25}).eq("career_role_id", fsd_id).eq("skill_id", rest_skill_id).execute()
    print("   ✓ Full Stack Developer role_skills weights rebalanced")


# ──────────────────────────────────────────────
# STEP 2: Python Sub-topics
# ──────────────────────────────────────────────

def seed_python_subtopics():
    print("── Step 2: Python Sub-topics ──")
    python_id = find_or_create_skill("Python")

    subtopics = [
        ("Syntax", 0.15, True),
        ("Data Structures", 0.20, True),
        ("OOP", 0.20, True),
        ("Error Handling", 0.15, False),
        ("File I/O", 0.15, False),
        ("Libraries", 0.15, False),
    ]
    for name, weight, mandatory in subtopics:
        child_id = find_or_create_skill(name, "Programming Languages", f"Python sub-topic: {name}", python_id)
        # Upsert skill_topic_weights
        existing = client.table("skill_topic_weights").select("*").eq("parent_skill_id", python_id).eq("child_skill_id", child_id).execute()
        if not existing.data:
            client.table("skill_topic_weights").insert({
                "parent_skill_id": python_id,
                "child_skill_id": child_id,
                "weight": weight,
                "is_mandatory": mandatory
            }).execute()
            track("skill_topic_weights")
        print(f"   ✓ Sub-topic: {name}")


# ──────────────────────────────────────────────
# STEP 3: Institutions
# ──────────────────────────────────────────────

def seed_institutions():
    print("── Step 3: Institutions ──")
    institutions = [
        {"name": "LDRP Institute of Technology", "institution_type": "Engineering College", "city": "Gandhinagar", "state": "Gujarat", "country": "India", "verification_status": "verified"},
        {"name": "Silver Oak College", "institution_type": "Engineering College", "city": "Ahmedabad", "state": "Gujarat", "country": "India", "verification_status": "verified"},
    ]
    ids = {}
    for inst in institutions:
        res = client.table("institutions").select("institution_id").eq("name", inst["name"]).execute()
        if not res.data:
            res = client.table("institutions").insert(inst).execute()
            track("institutions")
        ids[inst["name"]] = res.data[0]["institution_id"]
        print(f"   ✓ {inst['name']}")
    return ids

# ──────────────────────────────────────────────
# STEP 4: Companies
# ──────────────────────────────────────────────

def seed_companies():
    print("── Step 4: Companies ──")
    companies = [
        {"name": "TechNova Solutions", "industry_type": "Software / AI", "description": "AI-first software company building next-gen ML products.", "location": "Bangalore, India", "company_size": "50-200", "verified": True},
        {"name": "BrightWave Inc", "industry_type": "Software / Cloud", "description": "Cloud-native SaaS company.", "location": "Pune, India", "company_size": "10-50", "verified": False},
    ]
    ids = {}
    for comp in companies:
        res = client.table("companies").select("company_id").eq("name", comp["name"]).execute()
        if not res.data:
            res = client.table("companies").insert(comp).execute()
            track("companies")
        ids[comp["name"]] = res.data[0]["company_id"]
        print(f"   ✓ {comp['name']} (verified={comp['verified']})")
    return ids


# ──────────────────────────────────────────────
# STEP 5: Create Auth Users & Profiles
# ──────────────────────────────────────────────

def seed_users_and_profiles(inst_ids, comp_ids):
    print("── Step 5: Users & Profiles ──")

    ldrp_id = inst_ids["LDRP Institute of Technology"]
    silver_oak_id = inst_ids["Silver Oak College"]
    technova_id = comp_ids["TechNova Solutions"]
    brightwave_id = comp_ids["BrightWave Inc"]

    # Get career role IDs
    ml_role = client.table("career_roles").select("career_role_id").eq("title", "Machine Learning Engineer").execute().data[0]["career_role_id"]
    fsd_role = client.table("career_roles").select("career_role_id").eq("title", "Full Stack Developer").execute().data[0]["career_role_id"]
    cloud_role = client.table("career_roles").select("career_role_id").eq("title", "Cloud Engineer").execute().data[0]["career_role_id"]

    # ── Super Admin ──
    print("   Creating Super Admin...")
    admin_id = create_auth_user("admin@aicp.edu", "Admin@12345", "Platform Admin", "super_admin")
    print(f"   ✓ Super Admin: admin@aicp.edu")

    # ── Students ──
    students = [
        {"email": "aarav.patel@ldrp.test", "name": "Aarav Patel", "dept": "CSE", "year": 3, "institution_id": ldrp_id, "target_career_id": ml_role, "grad_year": 2027},
        {"email": "diya.shah@ldrp.test", "name": "Diya Shah", "dept": "CSE", "year": 4, "institution_id": ldrp_id, "target_career_id": fsd_role, "grad_year": 2026},
        {"email": "rohan.mehta@ldrp.test", "name": "Rohan Mehta", "dept": "ECE", "year": 2, "institution_id": ldrp_id, "target_career_id": cloud_role, "grad_year": 2028},
        {"email": "priya.nair@silveroak.test", "name": "Priya Nair", "dept": "CSE", "year": 3, "institution_id": silver_oak_id, "target_career_id": ml_role, "grad_year": 2027},
    ]
    student_ids = {}
    for s in students:
        uid = create_auth_user(s["email"], "Test@12345", s["name"], "student")
        student_ids[s["email"]] = uid

        # Create student_profile if missing
        existing = client.table("student_profiles").select("student_id").eq("student_id", uid).execute()
        if not existing.data:
            client.table("student_profiles").insert({
                "student_id": uid,
                "institution_id": s["institution_id"],
                "department": s["dept"],
                "current_year": s["year"],
                "graduation_year": s["grad_year"],
                "target_career_id": s["target_career_id"],
            }).execute()
            track("student_profiles")
        else:
            # Update to ensure correct data
            client.table("student_profiles").update({
                "institution_id": s["institution_id"],
                "department": s["dept"],
                "current_year": s["year"],
                "graduation_year": s["grad_year"],
                "target_career_id": s["target_career_id"],
            }).eq("student_id", uid).execute()
        print(f"   ✓ Student: {s['name']} ({s['email']})")

    # ── Academician ──
    print("   Creating Academician...")
    kavita_id = create_auth_user("kavita.rao@ldrp.test", "Test@12345", "Dr. Kavita Rao", "academician")
    existing = client.table("academician_profiles").select("academician_id").eq("academician_id", kavita_id).execute()
    if not existing.data:
        client.table("academician_profiles").insert({
            "academician_id": kavita_id,
            "institution_id": ldrp_id,
            "department": "CSE",
            "designation": "Associate Professor",
            "expertise_areas": json.dumps(["Machine Learning", "Deep Learning"]),
            "research_interests": "Applied Machine Learning, Neural Network Architectures"
        }).execute()
        track("academician_profiles")
    print(f"   ✓ Academician: Dr. Kavita Rao")

    # ── Institution Admin ──
    print("   Creating Institution Admin...")
    suresh_id = create_auth_user("suresh.iyer@ldrp.test", "Test@12345", "Suresh Iyer", "institution")
    existing = client.table("institution_admins").select("admin_id").eq("admin_id", suresh_id).execute()
    if not existing.data:
        client.table("institution_admins").insert({
            "admin_id": suresh_id,
            "institution_id": ldrp_id,
            "designation": "Placement Officer",
            "is_primary_contact": True
        }).execute()
        track("institution_admins")
    print(f"   ✓ Institution Admin: Suresh Iyer")

    # ── Recruiters ──
    recruiters = [
        {"email": "neha@technova.test", "name": "Neha Kulkarni", "company_id": technova_id, "designation": "Talent Acquisition Lead", "is_primary": True},
        {"email": "arjun@brightwave.test", "name": "Arjun Singh", "company_id": brightwave_id, "designation": "Recruiter", "is_primary": True},
    ]
    recruiter_ids = {}
    for r in recruiters:
        uid = create_auth_user(r["email"], "Test@12345", r["name"], "industry")
        recruiter_ids[r["email"]] = uid
        existing = client.table("recruiter_profiles").select("recruiter_id").eq("recruiter_id", uid).execute()
        if not existing.data:
            client.table("recruiter_profiles").insert({
                "recruiter_id": uid,
                "company_id": r["company_id"],
                "designation": r["designation"],
                "is_primary_contact": r["is_primary"]
            }).execute()
            track("recruiter_profiles")
        print(f"   ✓ Recruiter: {r['name']} ({r['email']})")

    # ── Alumni ──
    alumni_data = [
        {"email": "karan.mehta@ldrp.test", "name": "Karan Mehta", "institution_id": ldrp_id, "is_verified": True, "grad_year": 2023, "dept": "CSE", "degree": "B.Tech", "company": "Google", "designation": "Software Engineer", "profession": "Software Engineering"},
        {"email": "meera.joshi@ldrp.test", "name": "Meera Joshi", "institution_id": ldrp_id, "is_verified": False, "grad_year": 2024, "dept": "CSE", "degree": "B.Tech", "company": "Infosys", "designation": "Associate Developer", "profession": "Software Development"},
        {"email": "vikram.desai@silveroak.test", "name": "Vikram Desai", "institution_id": silver_oak_id, "is_verified": True, "grad_year": 2022, "dept": "CSE", "degree": "B.Tech", "company": "Amazon", "designation": "SDE-1", "profession": "Software Engineering"},
    ]
    alumni_ids = {}
    for a in alumni_data:
        uid = create_auth_user(a["email"], "Test@12345", a["name"], "alumni")
        alumni_ids[a["email"]] = uid
        existing = client.table("alumni_profiles").select("alumni_id").eq("alumni_id", uid).execute()
        if not existing.data:
            client.table("alumni_profiles").insert({
                "alumni_id": uid,
                "institution_id": a["institution_id"],
                "graduation_year": a["grad_year"],
                "degree": a["degree"],
                "department": a["dept"],
                "current_company": a["company"],
                "current_designation": a["designation"],
                "current_profession": a["profession"],
                "is_verified": a["is_verified"],
            }).execute()
            track("alumni_profiles")
        print(f"   ✓ Alumni: {a['name']} (verified={a['is_verified']})")

    return {
        "admin_id": admin_id,
        "student_ids": student_ids,
        "kavita_id": kavita_id,
        "suresh_id": suresh_id,
        "recruiter_ids": recruiter_ids,
        "alumni_ids": alumni_ids,
        "ml_role": ml_role,
        "fsd_role": fsd_role,
    }


# ──────────────────────────────────────────────
# STEP 6: Student Skills
# ──────────────────────────────────────────────

def seed_student_skills(user_ids):
    print("── Step 6: Student Skills ──")

    def upsert_skill(student_id, skill_name, level, verification, source):
        s_id = find_or_create_skill(skill_name)
        existing = client.table("student_skills").select("student_skill_id").eq("student_id", student_id).eq("skill_id", s_id).execute()
        data = {
            "student_id": student_id,
            "skill_id": s_id,
            "proficiency_level": level,
            "confidence_score": 0.9 if verification == "verified" else 0.5,
            "verification_status": verification,
            "source": source,
        }
        if not existing.data:
            client.table("student_skills").insert(data).execute()
            track("student_skills")
        else:
            client.table("student_skills").update(data).eq("student_skill_id", existing.data[0]["student_skill_id"]).execute()

    aarav_id = user_ids["student_ids"]["aarav.patel@ldrp.test"]
    diya_id = user_ids["student_ids"]["diya.shah@ldrp.test"]
    priya_id = user_ids["student_ids"]["priya.nair@silveroak.test"]
    # Rohan has NO skills — deliberately empty

    # Aarav Patel — exact worked example
    aarav_skills = [
        ("Python", 85, "verified", "assessment"),
        ("Machine Learning", 70, "verified", "assessment"),
        ("SQL", 55, "self_declared", "self_declared"),
        ("Deep Learning", 30, "self_declared", "self_declared"),
        ("MLOps", 15, "unverified", "self_declared"),
    ]
    for name, level, verif, source in aarav_skills:
        upsert_skill(aarav_id, name, level, verif, source)
    print(f"   ✓ Aarav Patel: {len(aarav_skills)} skills (Python 85, ML 70, SQL 55, DL 30, MLOps 15)")

    # Diya Shah
    diya_skills = [
        ("React", 75, "verified", "assessment"),
        ("Node.js", 60, "verified", "assessment"),
        ("SQL", 50, "self_declared", "self_declared"),
    ]
    for name, level, verif, source in diya_skills:
        upsert_skill(diya_id, name, level, verif, source)
    print(f"   ✓ Diya Shah: {len(diya_skills)} skills")

    # Priya Nair — similar to Aarav (for cross-institution tests)
    priya_skills = [
        ("Python", 80, "verified", "assessment"),
        ("Machine Learning", 65, "verified", "assessment"),
        ("SQL", 50, "self_declared", "self_declared"),
        ("Deep Learning", 35, "self_declared", "self_declared"),
        ("MLOps", 20, "unverified", "self_declared"),
    ]
    for name, level, verif, source in priya_skills:
        upsert_skill(priya_id, name, level, verif, source)
    print(f"   ✓ Priya Nair: {len(priya_skills)} skills")

    print(f"   ✓ Rohan Mehta: 0 skills (deliberately empty)")


# ──────────────────────────────────────────────
# STEP 7: Verification Requests (pending ones)
# ──────────────────────────────────────────────

def seed_verification_requests(comp_ids, user_ids):
    print("── Step 7: Verification Requests ──")

    brightwave_id = comp_ids["BrightWave Inc"]
    arjun_id = user_ids["recruiter_ids"]["arjun@brightwave.test"]
    meera_id = user_ids["alumni_ids"]["meera.joshi@ldrp.test"]

    # BrightWave company verification (pending)
    existing = client.table("verification_requests").select("request_id").eq("entity_type", "company").eq("entity_id", brightwave_id).eq("status", "pending").execute()
    if not existing.data:
        client.table("verification_requests").insert({
            "entity_type": "company",
            "entity_id": brightwave_id,
            "submitted_by": arjun_id,
            "status": "pending",
            "notes": "Requesting company verification for BrightWave Inc. GST and incorporation documents attached."
        }).execute()
        track("verification_requests")
    print("   ✓ BrightWave Inc — company verification (pending)")

    # Meera Joshi alumni verification (pending)
    existing = client.table("verification_requests").select("request_id").eq("entity_type", "alumni").eq("entity_id", meera_id).eq("status", "pending").execute()
    if not existing.data:
        client.table("verification_requests").insert({
            "entity_type": "alumni",
            "entity_id": meera_id,
            "submitted_by": meera_id,
            "status": "pending",
            "notes": "Requesting alumni verification. Graduated 2024 B.Tech CSE from LDRP."
        }).execute()
        track("verification_requests")
    print("   ✓ Meera Joshi — alumni verification (pending)")


# ──────────────────────────────────────────────
# STEP 8: Faculty Collaborations
# ──────────────────────────────────────────────

def seed_faculty_collaborations(comp_ids, user_ids):
    print("── Step 8: Faculty Collaborations ──")

    kavita_id = user_ids["kavita_id"]
    technova_id = comp_ids["TechNova Solutions"]

    # 1. Recommended FDP with TechNova
    existing = client.table("faculty_collaborations").select("collaboration_id").eq("academician_id", kavita_id).eq("title", "Applied Deep Learning FDP").execute()
    if not existing.data:
        client.table("faculty_collaborations").insert({
            "academician_id": kavita_id,
            "company_id": technova_id,
            "collaboration_type": "fdp",
            "title": "Applied Deep Learning FDP",
            "description": "A 5-day intensive Faculty Development Program on applied deep learning techniques including CNNs, RNNs, and Transformers with hands-on labs using PyTorch.",
            "status": "proposed",
        }).execute()
        track("faculty_collaborations")
    print("   ✓ FDP: Applied Deep Learning (TechNova)")

    # 2. Self-proposed research collaboration (no company)
    existing = client.table("faculty_collaborations").select("collaboration_id").eq("academician_id", kavita_id).eq("title", "Explainable AI in Education").execute()
    if not existing.data:
        client.table("faculty_collaborations").insert({
            "academician_id": kavita_id,
            "company_id": None,
            "collaboration_type": "research",
            "title": "Explainable AI in Education",
            "description": "Research collaboration proposal on building explainable AI models for personalized learning path recommendations in higher education.",
            "status": "proposed",
        }).execute()
        track("faculty_collaborations")
    print("   ✓ Research: Explainable AI in Education (self-proposed)")


# ──────────────────────────────────────────────
# STEP 9: Opportunity & Opportunity Skills
# ──────────────────────────────────────────────

def seed_opportunity(comp_ids):
    print("── Step 9: Opportunity ──")

    technova_id = comp_ids["TechNova Solutions"]

    existing = client.table("opportunities").select("opportunity_id").eq("title", "Machine Learning Engineer Intern").eq("company_id", technova_id).execute()
    if not existing.data:
        res = client.table("opportunities").insert({
            "company_id": technova_id,
            "title": "Machine Learning Engineer Intern",
            "description": "Join TechNova's AI team as an ML Engineer Intern. Work on real-world ML pipelines, model training, and deployment. Gain hands-on experience with Python, scikit-learn, and cloud ML services.",
            "opportunity_type": "internship",
            "location": "Bangalore, India",
            "work_mode": "hybrid",
            "duration": "6 months",
            "stipend": 25000,
            "application_deadline": "2026-12-31",
            "min_cgpa": 7.0,
            "status": "published",
        }).execute()
        track("opportunities")
        opp_id = res.data[0]["opportunity_id"]
    else:
        opp_id = existing.data[0]["opportunity_id"]
    print(f"   ✓ Opportunity: Machine Learning Engineer Intern (TechNova)")

    # Opportunity Skills — match ML Engineer role exactly
    ml_role_skills = [
        ("Python", 80, 0.25, True),
        ("Machine Learning", 75, 0.25, True),
        ("SQL", 60, 0.15, False),
        ("Deep Learning", 70, 0.20, True),
        ("MLOps", 50, 0.15, False),
    ]
    for skill_name, req_level, weight, mandatory in ml_role_skills:
        s_id = find_or_create_skill(skill_name)
        existing = client.table("opportunity_skills").select("*").eq("opportunity_id", opp_id).eq("skill_id", s_id).execute()
        if not existing.data:
            client.table("opportunity_skills").insert({
                "opportunity_id": opp_id,
                "skill_id": s_id,
                "required_level": req_level,
                "importance_weight": weight,
                "is_mandatory": mandatory
            }).execute()
            track("opportunity_skills")
    print("   ✓ Opportunity skills: Python, ML, SQL, DL, MLOps")

    return opp_id


# ──────────────────────────────────────────────
# STEP 10: Application (Diya → ML Intern)
# ──────────────────────────────────────────────

def seed_application(opp_id, user_ids):
    print("── Step 10: Application ──")

    diya_id = user_ids["student_ids"]["diya.shah@ldrp.test"]

    existing = client.table("applications").select("application_id").eq("student_id", diya_id).eq("opportunity_id", opp_id).execute()
    if not existing.data:
        breakdown = {
            "skills": {"score": 55, "max": 40, "details": {
                "React": {"student": 75, "required": 0, "gap": 0},
                "Node.js": {"student": 60, "required": 0, "gap": 0},
                "SQL": {"student": 50, "required": 60, "gap": 10},
            }},
            "assessment": {"score": 8, "max": 15},
            "portfolio": {"score": 7, "max": 15},
            "education": {"score": 8, "max": 10},
            "experience": {"score": 5, "max": 20},
        }
        client.table("applications").insert({
            "student_id": diya_id,
            "opportunity_id": opp_id,
            "match_score": 62.5,
            "match_score_breakdown": json.dumps(breakdown),
            "status": "shortlisted",
            "recruiter_notes": "Strong React and Node.js skills. Shortlisted for first-round technical interview. SQL gap is minor and can be upskilled during internship.",
        }).execute()
        track("applications")
    print("   ✓ Application: Diya Shah → ML Engineer Intern (status=shortlisted)")


# ──────────────────────────────────────────────
# STEP 11: Assessment & Questions
# ──────────────────────────────────────────────

def seed_assessment(user_ids):
    print("── Step 11: Assessment ──")

    admin_id = user_ids["admin_id"]
    python_id = find_or_create_skill("Python")

    # Find sub-topic IDs
    def get_subtopic_id(name):
        res = client.table("skills").select("skill_id").eq("name", name).execute()
        return res.data[0]["skill_id"] if res.data else None

    syntax_id = get_subtopic_id("Syntax")
    ds_id = get_subtopic_id("Data Structures")
    oop_id = get_subtopic_id("OOP")
    fileio_id = get_subtopic_id("File I/O")
    libs_id = get_subtopic_id("Libraries")
    # Error Handling deliberately has ZERO questions

    existing = client.table("assessments").select("assessment_id").eq("title", "Python Fundamentals Assessment").execute()
    if not existing.data:
        res = client.table("assessments").insert({
            "title": "Python Fundamentals Assessment",
            "description": "A comprehensive assessment covering Python fundamentals including syntax, data structures, OOP, file I/O, and popular libraries.",
            "assessment_type": "mcq",
            "skill_id": python_id,
            "created_by": admin_id,
            "duration_minutes": 30,
            "total_marks": 80,
            "is_active": True
        }).execute()
        track("assessments")
        assessment_id = res.data[0]["assessment_id"]
    else:
        assessment_id = existing.data[0]["assessment_id"]
    print(f"   ✓ Assessment: Python Fundamentals Assessment")

    # Check if questions already exist
    q_existing = client.table("assessment_questions").select("question_id", count="exact").eq("assessment_id", assessment_id).execute()
    if q_existing.count and q_existing.count > 0:
        print(f"   ✓ Questions already exist ({q_existing.count} questions)")
        return

    questions = [
        # Syntax (2)
        {
            "question": "What is the output of the following Python code?\n\nx = [1, 2, 3]\nprint(x[1:3])",
            "question_type": "mcq",
            "options": json.dumps(["[1, 2]", "[2, 3]", "[1, 2, 3]", "[2]"]),
            "correct_answer": "[2, 3]",
            "marks": 10,
            "difficulty": "easy",
            "skill_id": syntax_id,
        },
        {
            "question": "Which of the following is the correct way to define a multi-line string in Python?",
            "question_type": "mcq",
            "options": json.dumps(["Using single quotes only", "Using triple quotes (''' or \"\"\")", "Using backslash at end of each line only", "Python does not support multi-line strings"]),
            "correct_answer": "Using triple quotes (''' or \"\"\")",
            "marks": 10,
            "difficulty": "easy",
            "skill_id": syntax_id,
        },
        # Data Structures (2)
        {
            "question": "What is the time complexity of looking up a key in a Python dictionary?",
            "question_type": "mcq",
            "options": json.dumps(["O(n)", "O(log n)", "O(1) average", "O(n log n)"]),
            "correct_answer": "O(1) average",
            "marks": 10,
            "difficulty": "medium",
            "skill_id": ds_id,
        },
        {
            "question": "Which Python data structure maintains insertion order and allows duplicate elements?",
            "question_type": "mcq",
            "options": json.dumps(["set", "dict", "list", "frozenset"]),
            "correct_answer": "list",
            "marks": 10,
            "difficulty": "easy",
            "skill_id": ds_id,
        },
        # OOP (2)
        {
            "question": "In Python, what does the `super()` function do?",
            "question_type": "mcq",
            "options": json.dumps([
                "Creates a new class",
                "Calls a method from the parent class",
                "Makes a class abstract",
                "Prevents method overriding"
            ]),
            "correct_answer": "Calls a method from the parent class",
            "marks": 10,
            "difficulty": "medium",
            "skill_id": oop_id,
        },
        {
            "question": "What is the purpose of the `__init__` method in a Python class?",
            "question_type": "mcq",
            "options": json.dumps([
                "It destroys an object",
                "It initializes a new instance of the class",
                "It imports required modules",
                "It defines class-level variables only"
            ]),
            "correct_answer": "It initializes a new instance of the class",
            "marks": 10,
            "difficulty": "easy",
            "skill_id": oop_id,
        },
        # File I/O (1)
        {
            "question": "Which mode should you use with `open()` to append text to an existing file without overwriting it?",
            "question_type": "mcq",
            "options": json.dumps(["'r'", "'w'", "'a'", "'x'"]),
            "correct_answer": "'a'",
            "marks": 10,
            "difficulty": "easy",
            "skill_id": fileio_id,
        },
        # Libraries (1)
        {
            "question": "Which of the following is NOT a built-in Python standard library module?",
            "question_type": "mcq",
            "options": json.dumps(["os", "sys", "numpy", "json"]),
            "correct_answer": "numpy",
            "marks": 10,
            "difficulty": "medium",
            "skill_id": libs_id,
        },
    ]

    for q in questions:
        q["assessment_id"] = assessment_id
    client.table("assessment_questions").insert(questions).execute()
    track("assessment_questions", len(questions))
    print(f"   ✓ {len(questions)} MCQ questions inserted (2 Syntax, 2 DS, 2 OOP, 1 File I/O, 1 Libraries)")
    print("   ✓ Error Handling: 0 questions (deliberate — tests 'untested vs. failed' distinction)")


# ──────────────────────────────────────────────
# STEP 12: Alumni Skills
# ──────────────────────────────────────────────

def seed_alumni_skills(user_ids):
    print("── Step 12: Alumni Skills ──")

    karan_id = user_ids["alumni_ids"]["karan.mehta@ldrp.test"]
    vikram_id = user_ids["alumni_ids"]["vikram.desai@silveroak.test"]

    def upsert_alumni_skill(alumni_id, skill_name, level, mentor=False, challenging=False):
        s_id = find_or_create_skill(skill_name)
        existing = client.table("alumni_skills").select("alumni_skill_id").eq("alumni_id", alumni_id).eq("skill_id", s_id).execute()
        if not existing.data:
            client.table("alumni_skills").insert({
                "alumni_id": alumni_id,
                "skill_id": s_id,
                "proficiency_level": level,
                "willing_to_mentor": mentor,
                "found_challenging": challenging,
            }).execute()
            track("alumni_skills")
        else:
            client.table("alumni_skills").update({
                "willing_to_mentor": mentor,
                "found_challenging": challenging,
            }).eq("alumni_skill_id", existing.data[0]["alumni_skill_id"]).execute()

    # Karan Mehta: Python, ML, AWS, Docker
    # Deep Learning with willing_to_mentor=true, found_challenging=true
    karan_skills = [
        ("Python", 90, True, False),
        ("Machine Learning", 85, True, False),
        ("AWS", 80, False, False),
        ("Docker", 75, False, False),
        ("Deep Learning", 70, True, True),  # Key: mentorship signal
    ]
    for name, level, mentor, challenging in karan_skills:
        upsert_alumni_skill(karan_id, name, level, mentor, challenging)
    print(f"   ✓ Karan Mehta: {len(karan_skills)} skills (Deep Learning: mentor=True, challenging=True)")

    # Vikram Desai: some skills for cross-institution testing
    vikram_skills = [
        ("Python", 85, False, False),
        ("Cloud Computing", 80, True, False),
        ("Docker", 75, False, False),
    ]
    for name, level, mentor, challenging in vikram_skills:
        upsert_alumni_skill(vikram_id, name, level, mentor, challenging)
    print(f"   ✓ Vikram Desai: {len(vikram_skills)} skills")


# ──────────────────────────────────────────────
# STEP 13: Conversation & Messages
# ──────────────────────────────────────────────

def seed_conversation(user_ids):
    print("── Step 13: Conversation ──")

    diya_id = user_ids["student_ids"]["diya.shah@ldrp.test"]
    karan_id = user_ids["alumni_ids"]["karan.mehta@ldrp.test"]

    # Check if a conversation already exists between them
    diya_convos = client.table("conversation_participants").select("conversation_id").eq("user_id", diya_id).execute()
    karan_convos = client.table("conversation_participants").select("conversation_id").eq("user_id", karan_id).execute()

    diya_conv_ids = {c["conversation_id"] for c in diya_convos.data}
    karan_conv_ids = {c["conversation_id"] for c in karan_convos.data}
    shared = diya_conv_ids & karan_conv_ids

    if shared:
        conv_id = list(shared)[0]
        print(f"   ✓ Conversation already exists")
    else:
        # Create conversation
        conv_res = client.table("conversations").insert({
            "is_active": True,
        }).execute()
        conv_id = conv_res.data[0]["conversation_id"]
        track("conversations")

        # Add participants
        client.table("conversation_participants").insert([
            {"conversation_id": conv_id, "user_id": diya_id},
            {"conversation_id": conv_id, "user_id": karan_id},
        ]).execute()
        track("conversation_participants", 2)
        print(f"   ✓ Conversation created between Diya Shah ↔ Karan Mehta")

    # Check if messages exist
    msg_check = client.table("messages").select("message_id", count="exact").eq("conversation_id", conv_id).execute()
    if msg_check.count and msg_check.count > 0:
        print(f"   ✓ Messages already exist ({msg_check.count} messages)")
        return

    # Seed messages
    messages = [
        {
            "conversation_id": conv_id,
            "sender_id": diya_id,
            "message": "Hi Karan! I'm Diya, a final-year CSE student at LDRP. I saw you're a Software Engineer at Google and an alumnus — I'd love to get some guidance on transitioning from web development to a more full-stack role with backend emphasis. Any tips?",
        },
        {
            "conversation_id": conv_id,
            "sender_id": karan_id,
            "message": "Hey Diya! Great to connect with a fellow LDRP student. Absolutely — my biggest advice is to get really comfortable with system design and API architecture. Also, pick one cloud platform (AWS or GCP) and build a few projects end-to-end. Happy to chat more about specific areas!",
        },
        {
            "conversation_id": conv_id,
            "sender_id": diya_id,
            "message": "That's super helpful, thank you! I've been working with React and Node.js mostly. I'll definitely start exploring AWS. Could I reach out again when I have more specific questions about interview prep?",
        },
    ]
    client.table("messages").insert(messages).execute()
    track("messages", len(messages))

    # Update conversation last_message_at
    client.table("conversations").update({"last_message_at": "now()"}).eq("conversation_id", conv_id).execute()
    print(f"   ✓ {len(messages)} messages seeded")


# ──────────────────────────────────────────────
# STEP 14: Notifications
# ──────────────────────────────────────────────

def seed_notifications(user_ids, opp_id):
    print("── Step 14: Notifications ──")

    aarav_id = user_ids["student_ids"]["aarav.patel@ldrp.test"]
    neha_id = user_ids["recruiter_ids"]["neha@technova.test"]

    # Aarav: new_match notification
    existing = client.table("notifications").select("notification_id").eq("user_id", aarav_id).eq("type", "new_match").execute()
    if not existing.data:
        client.table("notifications").insert({
            "user_id": aarav_id,
            "type": "new_match",
            "title": "New Opportunity Match",
            "message": "You have a new match! 'Machine Learning Engineer Intern' at TechNova Solutions matches your profile with a 78% compatibility score.",
            "is_read": False,
            "reference_id": opp_id,
        }).execute()
        track("notifications")
    print("   ✓ Aarav Patel: 'new_match' notification")

    # Neha: application_update notification for Diya's application
    existing = client.table("notifications").select("notification_id").eq("user_id", neha_id).eq("type", "application_update").execute()
    if not existing.data:
        client.table("notifications").insert({
            "user_id": neha_id,
            "type": "application_update",
            "title": "New Application Received",
            "message": "Diya Shah has applied to 'Machine Learning Engineer Intern'. Match score: 62.5%. Status: shortlisted for review.",
            "is_read": False,
        }).execute()
        track("notifications")
    print("   ✓ Neha Kulkarni: 'application_update' notification")


# ──────────────────────────────────────────────
# STEP 15: Verify Platform Settings
# ──────────────────────────────────────────────

def verify_platform_settings():
    print("── Step 15: Platform Settings ──")
    expected_keys = ["readiness_at_risk_threshold", "default_assessment_duration_minutes",
                     "min_verified_evidence_rate_flag", "match_score_weights", "weights_version"]
    res = client.table("platform_settings").select("setting_key").execute()
    existing_keys = {r["setting_key"] for r in res.data}

    all_present = True
    for key in expected_keys:
        if key in existing_keys:
            print(f"   ✓ {key}")
        else:
            print(f"   ✗ MISSING: {key}")
            all_present = False

    if all_present:
        print("   ✓ All platform settings present")
    return all_present


# ──────────────────────────────────────────────
# STEP 16: Referential Integrity Check
# ──────────────────────────────────────────────

def check_referential_integrity():
    print("── Step 16: Referential Integrity Check ──")
    issues = []

    # student_skills → skills
    ss = client.table("student_skills").select("student_skill_id, skill_id").execute()
    all_skills = {s["skill_id"] for s in client.table("skills").select("skill_id").execute().data}
    for row in ss.data:
        if row["skill_id"] not in all_skills:
            issues.append(f"student_skills.skill_id {row['skill_id']} not in skills")

    # student_profiles → institutions
    sp = client.table("student_profiles").select("student_id, institution_id").execute()
    all_insts = {i["institution_id"] for i in client.table("institutions").select("institution_id").execute().data}
    for row in sp.data:
        if row["institution_id"] and row["institution_id"] not in all_insts:
            issues.append(f"student_profiles.institution_id {row['institution_id']} not in institutions")

    # applications → opportunities
    apps = client.table("applications").select("application_id, opportunity_id").execute()
    all_opps = {o["opportunity_id"] for o in client.table("opportunities").select("opportunity_id").execute().data}
    for row in apps.data:
        if row["opportunity_id"] not in all_opps:
            issues.append(f"applications.opportunity_id {row['opportunity_id']} not in opportunities")

    # opportunity_skills → skills
    os_data = client.table("opportunity_skills").select("opportunity_skill_id, skill_id").execute()
    for row in os_data.data:
        if row["skill_id"] not in all_skills:
            issues.append(f"opportunity_skills.skill_id {row['skill_id']} not in skills")

    # role_skills → skills
    rs = client.table("role_skills").select("role_skill_id, skill_id").execute()
    for row in rs.data:
        if row["skill_id"] not in all_skills:
            issues.append(f"role_skills.skill_id {row['skill_id']} not in skills")

    # alumni_skills → skills
    als = client.table("alumni_skills").select("alumni_skill_id, skill_id").execute()
    for row in als.data:
        if row["skill_id"] not in all_skills:
            issues.append(f"alumni_skills.skill_id {row['skill_id']} not in skills")

    if issues:
        print(f"   ✗ {len(issues)} integrity issues found:")
        for i in issues:
            print(f"     - {i}")
    else:
        print("   ✓ All foreign keys resolve correctly — no orphaned records")

    return len(issues) == 0


# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  COMPLETE DUMMY DATA SEED SCRIPT")
    print("  Academia–Industry Collaboration Portal (PS 26044)")
    print("=" * 60)
    print()

    # Step 1: Institutions (must come before reference data — learning programs need provider_id)
    inst_ids = seed_institutions()
    print()

    # Step 2: Reference Data (Skills, Career Roles, Role Skills, Learning Programs)
    seed_reference_data()
    print()

    # Step 3: Python Sub-topics
    seed_python_subtopics()
    print()

    # Step 4: Companies
    comp_ids = seed_companies()
    print()

    # Step 5: Users & Profiles
    user_ids = seed_users_and_profiles(inst_ids, comp_ids)
    print()

    # Step 6: Student Skills
    seed_student_skills(user_ids)
    print()

    # Step 7: Verification Requests
    seed_verification_requests(comp_ids, user_ids)
    print()

    # Step 8: Faculty Collaborations
    seed_faculty_collaborations(comp_ids, user_ids)
    print()

    # Step 9: Opportunity
    opp_id = seed_opportunity(comp_ids)
    print()

    # Step 10: Application
    seed_application(opp_id, user_ids)
    print()

    # Step 11: Assessment
    seed_assessment(user_ids)
    print()

    # Step 12: Alumni Skills
    seed_alumni_skills(user_ids)
    print()

    # Step 13: Conversation
    seed_conversation(user_ids)
    print()

    # Step 14: Notifications
    seed_notifications(user_ids, opp_id)
    print()

    # Step 15: Platform Settings
    verify_platform_settings()
    print()

    # Step 16: Referential Integrity
    integrity_ok = check_referential_integrity()
    print()

    # ── Summary ──
    print("=" * 60)
    print("  SEEDING COMPLETE — SUMMARY")
    print("=" * 60)
    print()

    print("Rows inserted (this run):")
    for table, count in sorted(counts.items()):
        print(f"  {table}: {count}")
    print()

    # Verify Aarav's worked example
    print("Aarav Patel Worked Example Verification:")
    aarav_id = user_ids["student_ids"]["aarav.patel@ldrp.test"]
    aarav_skills = client.table("student_skills").select("proficiency_level, verification_status, skills(name)").eq("student_id", aarav_id).execute()
    for s in aarav_skills.data:
        skill_name = s["skills"]["name"] if s.get("skills") else "?"
        print(f"  {skill_name}: level={s['proficiency_level']}, status={s['verification_status']}")

    print()
    print("Pending Verifications:")
    pending = client.table("verification_requests").select("entity_type, status, notes").eq("status", "pending").execute()
    for p in pending.data:
        print(f"  {p['entity_type']}: {p['notes'][:60]}...")

    print()
    if integrity_ok:
        print("✅ Referential integrity: PASS")
    else:
        print("❌ Referential integrity: FAIL — see above")

    print()
    print("All test accounts use password: Test@12345")
    print("Super Admin uses password: Admin@12345")
    print()
    print("Done!")


if __name__ == "__main__":
    main()
