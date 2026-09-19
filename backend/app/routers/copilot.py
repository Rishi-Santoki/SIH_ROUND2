from fastapi import APIRouter, Depends
from supabase import Client
from typing import List, Optional
from app.dependencies import get_db_client, get_current_student
from app.models.schemas import CopilotRequest, CopilotResponse
from app.core.config import get_settings
from app.core.matching import get_skill_gaps
from app.routers.gaps import _get_target_role

router = APIRouter(prefix="/student/copilot", tags=["AI Copilot"])

def _generate_gemini_response(prompt: str) -> Optional[str]:
    settings = get_settings()
    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
            try:
                model = genai.GenerativeModel(model_name)
                resp = model.generate_content(prompt)
                if resp and resp.text:
                    return resp.text.strip()
            except Exception:
                continue
    except Exception:
        pass
    return None

@router.post("", response_model=CopilotResponse)
def ask_copilot(req: CopilotRequest, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # 1. Store the conversation log safely
    try:
        msg_data = {
            "user_id": student["user_id"],
            "role": "user",
            "message": req.query
        }
        client.table("chat_history").insert(msg_data).execute()
    except Exception as e:
        print("Chat history user insert error:", e)
    
    query = req.query.strip()
    query_lower = query.lower()

    # 2. Student Context
    target_role = "Junior Data Scientist"
    missing_skills: List[str] = []
    try:
        target_role = _get_target_role(client, student["user_id"])
        gaps = get_skill_gaps(client, student["user_id"], target_role)
        missing_skills = [g["skill_name"] for g in gaps if g["status"] in ["missing", "partial"]]
    except Exception:
        pass

    # 3. Available NPTEL Programs Catalog
    nptel_catalog_str = ""
    try:
        progs = client.table("learning_programs").select("title, duration, mode, url, description").eq("is_active", True).execute().data
        if progs:
            lines = []
            for p in progs:
                url_str = p.get("url") or "https://onlinecourses.nptel.ac.in/"
                lines.append(f"- **{p['title']}** | {p.get('duration', '8-12 weeks')} | {p.get('mode', 'NPTEL / SWAYAM')} | URL: {url_str}")
            nptel_catalog_str = "\n".join(lines)
    except Exception:
        pass

    if not nptel_catalog_str:
        nptel_catalog_str = (
            "- **Programming, Data Structures and Algorithms using Python** | 8 weeks | IIT Madras | URL: https://onlinecourses.nptel.ac.in/noc24_cs41/preview\n"
            "- **Deep Learning** | 12 weeks | IIT Ropar | URL: https://swayam.gov.in/nd1_noc26_cs88/preview\n"
            "- **Database Management System** | 8 weeks | IIT Kharagpur | URL: https://onlinecourses.nptel.ac.in/noc24_cs48/preview\n"
            "- **Cloud Computing** | 8 weeks | IIT Kharagpur | URL: https://onlinecourses.nptel.ac.in/noc24_cs17/preview\n"
            "- **Introduction to Machine Learning** | 12 weeks | IIT Madras | URL: https://onlinecourses.nptel.ac.in/noc24_cs54/preview\n"
            "- **Data Science for Engineers** | 8 weeks | IIT Madras | URL: https://onlinecourses.nptel.ac.in/noc24_ch43/preview\n"
            "- **Ethical Hacking and Network Defense** | 12 weeks | IIT Kharagpur | URL: https://onlinecourses.nptel.ac.in/noc24_cs42/preview\n"
            "- **Introduction to Internet of Things** | 12 weeks | IIT Kharagpur | URL: https://onlinecourses.nptel.ac.in/noc24_cs36/preview"
        )

    # 4. RAG Retrieval attempt
    rag_context = ""
    rag_sources = []
    try:
        from app.core.rag import retrieve_relevant_chunks
        chunks = retrieve_relevant_chunks(client, query, "student", top_k=3)
        if chunks:
            rag_context = "\n\n".join([f"Source ({c['metadata'].get('title', 'Platform Knowledge Base')}): {c['content']}" for c in chunks])
            rag_sources = list(set([c['metadata'].get('title', 'Platform Knowledge Base') for c in chunks]))
    except Exception:
        pass

    # 5. Intent Detection
    greetings = ["hi", "hello", "hey", "hola", "namaste", "good morning", "good evening", "good afternoon", "greetings"]
    is_greeting = query_lower in greetings or any(query_lower.startswith(g + " ") for g in greetings)
    is_roadmap = any(kw in query_lower for kw in ["roadmap", "how to learn", "guide to learn", "path to learn", "steps to learn", "how can i learn", "teach me", "learning path", "curriculum for"])
    is_structured_skills = "skill" in query_lower and ("missing" in query_lower or "gap" in query_lower or "need" in query_lower)

    # 6. Assemble LLM Prompt
    system_instructions = (
        "You are ProofLedger AI Career Copilot, an evidence-grounded AI career advisor and mentor for college and university students.\n"
        "Your mission is to guide students to bridge their skill gaps, follow structured roadmaps, earn government-recognized NPTEL/SWAYAM certifications, "
        "and complete verified platform assessments for industry placement matching.\n\n"
        f"STUDENT CONTEXT:\n"
        f"- Target Career Role: {target_role}\n"
        f"- Identified Missing Skills / Gaps: {', '.join(missing_skills) if missing_skills else 'Profile up to date'}\n\n"
        f"OFFICIAL NPTEL / SWAYAM COURSES (Govt. of India • Ministry of Education):\n"
        f"{nptel_catalog_str}\n\n"
    )

    if rag_context:
        system_instructions += f"PLATFORM KNOWLEDGE BASE EVIDENCE:\n{rag_context}\n\n"

    system_instructions += (
        "RESPONSE GUIDELINES:\n"
        "1. If the user is GREETING you (e.g. 'hi', 'hello'):\n"
        "   - Give a warm, friendly, and professional response.\n"
        "   - Introduce yourself as ProofLedger AI Career Copilot.\n"
        "   - Highlight that you can generate step-by-step skill roadmaps, recommend official NPTEL/SWAYAM courses from IITs, "
        "and help verify skills for employer visibility.\n"
        "   - Invite them to ask for a roadmap or analyze their skill gaps.\n\n"
        "2. If the user is asking for a ROADMAP for any skill (e.g., Python, Deep Learning, SQL, Machine Learning, Cloud Computing, etc.):\n"
        "   - Create a thorough, progressive step-by-step roadmap broken into clear phases:\n"
        "     • Phase 1: Core Fundamentals & Concepts (syntax, theory, essentials)\n"
        "     • Phase 2: Intermediate Tooling & Practical Implementation (libraries, algorithms, frameworks)\n"
        "     • Phase 3: Advanced Topics & Real-world Capstone Projects\n"
        "     • Phase 4: Skill Verification & Platform Assessment (earning a verified badge on ProofLedger)\n"
        "   - SPECIFICALLY RECOMMEND the related official NPTEL / SWAYAM course(s) from the catalog above with exact course name, offering IIT, duration, and course link.\n"
        "   - Remind the student that they can enroll directly under the 'Learning' tab on ProofLedger to open the official NPTEL course page.\n\n"
        "3. If the user asks about SKILL GAPS or READINESS:\n"
        f"   - Highlight their missing skills ({', '.join(missing_skills) if missing_skills else 'None currently'}) for their target role of {target_role}.\n"
        "   - Recommend the relevant NPTEL courses and ProofLedger assessments to close each gap.\n\n"
        "4. Tone: Inspiring, professional, concrete, and encouraging. Use clean Markdown headers and bullet points.\n"
    )

    prompt = f"{system_instructions}\nUSER QUERY: {query}\n\nASSISTANT RESPONSE:"
    
    bot_msg = _generate_gemini_response(prompt)
    sources = []
    next_action = "Explore recommended skills or opportunities"

    if bot_msg:
        if is_roadmap:
            sources = ["ProofLedger AI Career Copilot", "NPTEL / SWAYAM Govt. Course Catalog", "IIT Curriculum Standards"]
            next_action = "Enroll in matching NPTEL course under Learning tab"
        elif is_greeting:
            sources = ["ProofLedger AI Career Copilot"]
            next_action = "Ask for a skill roadmap (e.g. 'Roadmap for Python' or 'Roadmap for Deep Learning')"
        elif rag_sources:
            sources = rag_sources
            next_action = "Review platform guidance and take assessment"
        else:
            sources = ["ProofLedger AI Career Copilot", "Student Profile & Ledger"]
            next_action = "Explore recommended NPTEL courses or assessments"
    else:
        # Fallback when LLM is unavailable
        if is_greeting:
            bot_msg = (
                f"Hello! 👋 I am your **ProofLedger AI Career Copilot**.\n\n"
                f"I'm here to help you advance your career readiness toward your goal as a **{target_role}**. Here is how I can assist you:\n\n"
                f"• **Step-by-step Skill Roadmaps:** Ask me for a detailed roadmap for any skill (e.g., *'Roadmap for Python'* or *'Roadmap for Deep Learning'*).\n"
                f"• **Official NPTEL / SWAYAM Courses:** Discover government-recognized courses from premier IITs to master critical competencies.\n"
                f"• **Skill Gap Analysis:** Check missing requirements and prepare for verified assessments to boost your employer match score.\n\n"
                f"What skill would you like to master today?"
            )
            sources = ["ProofLedger AI Career Copilot"]
            next_action = "Ask for a skill roadmap (e.g. 'Roadmap for Python')"
        elif is_roadmap:
            skill_name = query.replace("roadmap", "").replace("for", "").replace("give me a", "").replace("how to learn", "").strip().title() or "Core Technical Skill"
            bot_msg = (
                f"### Step-by-Step Learning Roadmap: {skill_name}\n\n"
                f"Here is a comprehensive 4-phase learning path to master **{skill_name}** for your **{target_role}** career track:\n\n"
                f"#### Phase 1: Core Fundamentals (Weeks 1-3)\n"
                f"• Master the core syntax, environment setup, and fundamental concepts.\n"
                f"• Understand elementary data structures, basic algorithms, and control flow.\n"
                f"• Hands-on exercises: Build daily mini-scripts and solve basic algorithm challenges.\n\n"
                f"#### Phase 2: Intermediate Concepts & Tooling (Weeks 4-7)\n"
                f"• Work with standard industry libraries, modular architectures, and APIs.\n"
                f"• Practice error handling, debugging techniques, and version control (Git).\n"
                f"• Implement end-to-end data processing pipelines or small services.\n\n"
                f"#### Phase 3: Advanced Applications & Production Projects (Weeks 8-10)\n"
                f"• Design a production-grade portfolio project with clean code and documentation.\n"
                f"• Optimize performance, write unit tests, and integrate with cloud databases.\n\n"
                f"#### Phase 4: Skill Verification & Ledger Credentials (Weeks 11-12)\n"
                f"• Take the official **ProofLedger Assessment** for {skill_name} to verify your competence.\n"
                f"• Earn a tamper-proof verified badge on your ledger to increase matching with recruiter opportunities.\n\n"
                f"---\n"
                f"#### 🏛️ Recommended NPTEL / SWAYAM Courses (Govt. of India):\n"
                f"You can enroll in official IIT-certified courses directly under the **Learning** tab on ProofLedger:\n"
                f"• **Programming, Data Structures and Algorithms using Python** (IIT Madras, 8 weeks) — [NPTEL Portal](https://onlinecourses.nptel.ac.in/noc24_cs41/preview)\n"
                f"• **Deep Learning** (IIT Ropar, 12 weeks) — [SWAYAM Portal](https://swayam.gov.in/nd1_noc26_cs88/preview)\n"
                f"• **Database Management System** (IIT Kharagpur, 8 weeks) — [NPTEL Portal](https://onlinecourses.nptel.ac.in/noc24_cs48/preview)\n"
                f"• **Cloud Computing** (IIT Kharagpur, 8 weeks) — [NPTEL Portal](https://onlinecourses.nptel.ac.in/noc24_cs17/preview)\n"
            )
            sources = ["ProofLedger AI Career Copilot", "NPTEL / SWAYAM Govt. Catalog"]
            next_action = "Enroll in NPTEL Course under Learning tab"
        elif is_structured_skills and missing_skills:
            bot_msg = (
                f"Based on your verified skills ledger and your target role of **{target_role}**, "
                f"you currently have gaps in: **{', '.join(missing_skills)}**.\n\n"
                f"To close these gaps:\n"
                f"1. Enroll in the corresponding official **NPTEL / SWAYAM** courses in the Learning tab.\n"
                f"2. Complete the course modules and take the platform assessment to earn verified ledger proof."
            )
            sources = ["Student Profile Data", "Role Skill Taxonomy"]
            next_action = "Explore recommended NPTEL courses"
        else:
            bot_msg = (
                f"As your ProofLedger AI Career Copilot, I'm here to guide your learning and placement journey for **{target_role}**.\n\n"
                f"You can ask me to:\n"
                f"• Generate a structured step-by-step roadmap for any skill (e.g., Python, Deep Learning, Cloud, SQL).\n"
                f"• Recommend government-recognized NPTEL / SWAYAM courses with direct enrollment links.\n"
                f"• Guide you through verified assessments to boost your employer matching score."
            )
            sources = ["ProofLedger Copilot Engine"]
            next_action = "Ask for a skill roadmap or check missing skills"

    # Save bot message to chat history
    try:
        resp_data = {
            "user_id": student["user_id"],
            "role": "assistant",
            "message": bot_msg
        }
        client.table("chat_history").insert(resp_data).execute()
    except Exception as e:
        print("Chat history assistant insert error:", e)
    
    return {
        "answer": bot_msg,
        "sources": sources,
        "next_action": next_action
    }

@router.get("/history")
def get_history(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("chat_history").select("message_id, role, message, created_at").eq("user_id", student["user_id"]).order("created_at", desc=False).execute()
    return res.data

@router.delete("/history")
def clear_history(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    client.table("chat_history").delete().eq("user_id", student["user_id"]).execute()
    return {"message": "Chat history cleared successfully"}
