import uuid

# Define the seeding logic
def run_seed_reference_data(client):
    taxonomy = {
        "Programming Languages": ["Python", "Java", "JavaScript", "SQL", "C++"],
        "Data & AI": ["Machine Learning", "Deep Learning", "Data Analysis", "Natural Language Processing", "Computer Vision"],
        "Cloud & DevOps": ["Cloud Computing", "Docker", "Kubernetes", "CI/CD", "MLOps"],
        "Web Development": ["React", "Node.js", "REST API Design", "HTML/CSS"],
        "Cybersecurity": ["Network Security", "Ethical Hacking", "Cryptography"],
        "Soft Skills": ["Communication", "Teamwork", "Problem Solving"]
    }
    # For Cloud Computing, it's a parent of AWS, Azure, GCP
    cloud_sub = {
        "Cloud Computing": ["AWS", "Azure", "GCP"]
    }
    
    # 1. Seed Skills
    skill_map = {} # name to id
    for parent, children in taxonomy.items():
        # Check if parent exists
        res = client.table("skills").select("skill_id").eq("name", parent).execute()
        if not res.data:
            res = client.table("skills").insert({"name": parent, "category": parent, "description": f"General category for {parent} skills"}).execute()
        parent_id = res.data[0]["skill_id"]
        skill_map[parent] = parent_id
        
        for child in children:
            res = client.table("skills").select("skill_id").eq("name", child).execute()
            if not res.data:
                res = client.table("skills").insert({
                    "name": child, 
                    "category": parent, 
                    "description": f"Proficiency in {child}",
                    "parent_skill_id": parent_id
                }).execute()
            skill_map[child] = res.data[0]["skill_id"]
            
            # Special case for Cloud Computing children
            if child in cloud_sub:
                cc_id = res.data[0]["skill_id"]
                for sub in cloud_sub[child]:
                    res_sub = client.table("skills").select("skill_id").eq("name", sub).execute()
                    if not res_sub.data:
                        res_sub = client.table("skills").insert({
                            "name": sub,
                            "category": parent,
                            "description": f"Proficiency in {sub}",
                            "parent_skill_id": cc_id
                        }).execute()
                    skill_map[sub] = res_sub.data[0]["skill_id"]
                    
    # 2. Seed Career Roles
    roles = [
        ("Machine Learning Engineer", "Data & AI"),
        ("Full Stack Developer", "Web Development"),
        ("Data Analyst", "Data & AI"),
        ("Cloud Engineer", "Cloud & DevOps"),
        ("Cybersecurity Analyst", "Cybersecurity"),
        ("DevOps Engineer", "Cloud & DevOps"),
        ("Mobile App Developer", "Web Development"),
        ("UI/UX Designer", "Web Development")
    ]
    role_map = {}
    for title, cat in roles:
        res = client.table("career_roles").select("career_role_id").eq("title", title).execute()
        if not res.data:
            res = client.table("career_roles").insert({
                "title": title,
                "category": cat,
                "description": f"A professional role focusing on {title}"
            }).execute()
        role_map[title] = res.data[0]["career_role_id"]
        
    # 3. Seed Role Skills
    ml_role_id = role_map["Machine Learning Engineer"]
    ml_skills = [
        ("Python", 80, 0.25, True),
        ("Machine Learning", 75, 0.25, True),
        ("SQL", 60, 0.15, False),
        ("Deep Learning", 70, 0.20, True),
        ("MLOps", 50, 0.15, False)
    ]
    for skill_name, req, w, mandatory in ml_skills:
        skill_id = skill_map[skill_name]
        res = client.table("role_skills").select("*").eq("career_role_id", ml_role_id).eq("skill_id", skill_id).execute()
        if not res.data:
            client.table("role_skills").insert({
                "career_role_id": ml_role_id,
                "skill_id": skill_id,
                "required_level": req,
                "importance_weight": w,
                "is_mandatory": mandatory
            }).execute()
            
    # Quick defaults for other roles
    other_roles_skills = {
        "Full Stack Developer": [("React", 80, 0.4, True), ("Node.js", 80, 0.4, True), ("SQL", 60, 0.2, False)],
        "Data Analyst": [("SQL", 80, 0.4, True), ("Data Analysis", 80, 0.4, True), ("Python", 60, 0.2, False)],
        "Cloud Engineer": [("AWS", 80, 0.4, True), ("Docker", 60, 0.3, True), ("Kubernetes", 60, 0.3, False)],
        "Cybersecurity Analyst": [("Network Security", 80, 0.4, True), ("Ethical Hacking", 70, 0.4, True), ("Cryptography", 60, 0.2, False)],
        "DevOps Engineer": [("CI/CD", 80, 0.4, True), ("Docker", 80, 0.4, True), ("Kubernetes", 70, 0.2, False)],
        "Mobile App Developer": [("Java", 80, 0.5, True), ("REST API Design", 70, 0.5, True)],
        "UI/UX Designer": [("HTML/CSS", 80, 0.6, True), ("Communication", 70, 0.4, False)]
    }
    for r_title, skills_data in other_roles_skills.items():
        r_id = role_map[r_title]
        for skill_name, req, w, mandatory in skills_data:
            s_id = skill_map[skill_name]
            res = client.table("role_skills").select("*").eq("career_role_id", r_id).eq("skill_id", s_id).execute()
            if not res.data:
                client.table("role_skills").insert({
                    "career_role_id": r_id,
                    "skill_id": s_id,
                    "required_level": req,
                    "importance_weight": w,
                    "is_mandatory": mandatory
                }).execute()

    # 4. Seed Learning Programs
    programs = [
        ("Deep Learning Specialization", "course", "Deep Learning", 4, True),
        ("MLOps Fundamentals", "course", "MLOps", 3, False),
        ("SQL for Data Analysis", "course", "SQL", 4, True),
        ("Cloud Practitioner Essentials", "course", "Cloud Computing", 3, True),
        ("Docker & Kubernetes Crash Course", "course", "Docker", 3, False),
        ("Full Stack Web Development Bootcamp", "bootcamp", "React", 4, False),
        ("Network Security Fundamentals", "course", "Network Security", 3, True)
    ]
    
    # We need a provider institution ID for learning programs
    inst_res = client.table("institutions").select("institution_id").limit(1).execute()
    provider_inst_id = inst_res.data[0]["institution_id"] if inst_res.data else None
    
    for title, ptype, target_skill, level, is_free in programs:
        res = client.table("learning_programs").select("program_id").eq("title", title).execute()
        if not res.data:
            res = client.table("learning_programs").insert({
                "title": title,
                "provider_id": provider_inst_id,
                "program_type": ptype,
                "is_free": is_free,
                "duration": "4 weeks",
                "mode": "online",
                "description": f"Learn {target_skill}",
            }).execute()
        prog_id = res.data[0]["program_id"]
        
        # Link skill
        if target_skill in skill_map:
            s_id = skill_map[target_skill]
            res_s = client.table("program_skills").select("*").eq("program_id", prog_id).eq("skill_id", s_id).execute()
            if not res_s.data:
                client.table("program_skills").insert({
                    "program_id": prog_id,
                    "skill_id": s_id,
                    "skill_level_after_completion": level
                }).execute()
                
    # NOTE: Test student creation removed — use seed_complete.py which
    # creates users properly via auth.admin.create_user() (required because
    # users.user_id is a FK to auth.users).
            
    return {"message": "Reference data seeded successfully."}
