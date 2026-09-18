from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import google.generativeai as genai

from app.dependencies import get_db_client, get_current_student
from app.core.config import get_settings
from supabase import Client
from app.core.rag import retrieve_curriculum_content
from app.services.roadmap_mastery import get_mastery_status, get_known_prerequisite_skills

router = APIRouter()
settings = get_settings()

if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        llm = genai.GenerativeModel("gemini-3.6-flash")
    except Exception:
        llm = None
else:
    llm = None

class RoadmapStep(BaseModel):
    step_number: int
    title: str
    description: str
    key_topics: List[str]
    matched_learning_program: Optional[Dict[str, Any]] = None
    matched_assessment: Optional[Dict[str, Any]] = None

class SkillRoadmapResponse(BaseModel):
    status: str
    skill_id: str
    starting_point: str
    path: List[RoadmapStep]

@router.post("/student/skills/{skill_id}/roadmap", response_model=SkillRoadmapResponse)
def generate_skill_roadmap(
    skill_id: str,
    target_role_id: Optional[str] = None,
    client: Client = Depends(get_db_client),
    student: dict = Depends(get_current_student)
):
    import uuid
    student_id = student["user_id"]
    
    # 0. Resolve skill_id whether it's a UUID or name
    real_skill_id = None
    try:
        uuid.UUID(str(skill_id))
        real_skill_id = str(skill_id)
    except ValueError:
        # Search by skill name
        find_res = client.table("skills").select("skill_id").ilike("name", skill_id.strip()).execute()
        if find_res.data:
            real_skill_id = find_res.data[0]["skill_id"]
        else:
            find_res2 = client.table("skills").select("skill_id").ilike("name", f"%{skill_id.strip()}%").execute()
            if find_res2.data:
                real_skill_id = find_res2.data[0]["skill_id"]
            else:
                from app.dependencies import get_service_client
                sc = get_service_client()
                new_s = sc.table("skills").insert({
                    "name": skill_id.strip(),
                    "category": "Technical",
                    "description": f"Curriculum and practice for {skill_id.strip()}"
                }).execute()
                if new_s.data:
                    real_skill_id = new_s.data[0]["skill_id"]
    
    if real_skill_id:
        skill_id = real_skill_id

    # 1. Mastery Filter
    mastery = get_mastery_status(client, student_id, skill_id, target_role_id)
    if mastery["status"] == "mastered":
        return {
            "status": "already_mastered",
            "skill_id": skill_id,
            "starting_point": "You have already demonstrated mastery of this skill.",
            "path": []
        }
        
    current_level = int(round(mastery.get("current_level", 0)))
    
    # 2. Check Cache
    cached_res = client.table("skill_roadmaps") \
        .select("roadmap_json, based_on_proficiency_level") \
        .eq("student_id", student_id) \
        .eq("skill_id", skill_id) \
        .execute()
        
    if cached_res.data:
        cached = cached_res.data[0]
        if cached.get("based_on_proficiency_level") == current_level and cached.get("roadmap_json"):
            return cached["roadmap_json"]
            
    # 3. Retrieve Curriculum & Prerequisites
    curriculum_chunks = retrieve_curriculum_content(client, skill_id)
    known_prereqs = get_known_prerequisite_skills(client, student_id, skill_id)
    
    # Fetch skill details
    skill_res = client.table("skills").select("name, description").eq("skill_id", skill_id).execute()
    if not skill_res.data:
        raise HTTPException(status_code=404, detail="Skill not found")
    skill_name = skill_res.data[0]["name"]
    
    # Pre-fetch learning programs and assessments for LLM reference
    prog_res = client.table("program_skills") \
        .select("program_id, learning_programs(title)") \
        .eq("skill_id", skill_id) \
        .execute()
    available_programs = [
        {"program_id": p["program_id"], "title": p["learning_programs"]["title"]} 
        for p in prog_res.data if p.get("learning_programs")
    ]
    
    assess_res = client.table("assessments") \
        .select("assessment_id, title") \
        .eq("skill_id", skill_id) \
        .execute()
    available_assessments = assess_res.data
    
    roadmap_json = None
    if llm:
        curriculum_text = "\n".join([c["content"] for c in curriculum_chunks])
        prompt = f"""
        You are an expert curriculum designer. Generate a personalized learning roadmap for a student learning '{skill_name}'.
        
        Student Profile:
        - Current proficiency level: {current_level}
        - Foundational/Prerequisite skills they ALREADY KNOW: {', '.join(known_prereqs) if known_prereqs else 'None'}
        - Untested Mandatory Sub-Topics: {', '.join(mastery.get("untested_children", [])) if mastery.get("untested_children") else 'None'}
        
        Reference Curriculum Content for this skill:
        {curriculum_text}
        
        Available Learning Programs for this skill:
        {json.dumps(available_programs)}
        
        Available Assessments for this skill:
        {json.dumps(available_assessments)}
        
        Instructions:
        1. Acknowledge what they already know in the starting_point.
        2. SKIP basic topics they should already know based on their prereqs or their current level ({current_level}/100).
        3. Generate a sequenced path of steps.
        4. You must return ONLY valid JSON matching this schema exactly:
        {{
            "status": "generated",
            "skill_id": "{skill_id}",
            "starting_point": "A brief sentence acknowledging their current state and prereqs.",
            "path": [
                {{
                    "step_number": 1,
                    "title": "...",
                    "description": "...",
                    "key_topics": ["...", "..."],
                    "matched_learning_program": {{"program_id": "...", "title": "..."}} | null,
                    "matched_assessment": {{"assessment_id": "...", "title": "..."}} | null
                }}
            ]
        }}
        """
        try:
            response = llm.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            roadmap_json = json.loads(response.text)
        except Exception as e:
            print(f"LLM generation failed: {e}")
            roadmap_json = None

    if not roadmap_json:
        # High quality curriculum fallback based on available resources
        matched_prog = available_programs[0] if available_programs else None
        matched_assess = available_assessments[0] if available_assessments else None
        
        starting_sentence = f"Starting at proficiency level {current_level}/100."
        if known_prereqs:
            starting_sentence += f" Building on your foundational knowledge in {', '.join(known_prereqs)}."

        steps = [
            {
                "step_number": 1,
                "title": f"Core Foundations of {skill_name}",
                "description": f"Deep-dive into essential concepts and architecture of {skill_name}.",
                "key_topics": ["Architecture & Patterns", "Data Flow", "Core APIs"],
                "matched_learning_program": matched_prog,
                "matched_assessment": None
            },
            {
                "step_number": 2,
                "title": f"Applied Practice & Problem Solving",
                "description": f"Hands-on exercises solving realistic domain challenges in {skill_name}.",
                "key_topics": ["Real-world Scenarios", "Optimization", "Edge Cases"],
                "matched_learning_program": matched_prog,
                "matched_assessment": matched_assess
            },
            {
                "step_number": 3,
                "title": f"Verified Assessment & Proof of Skill",
                "description": f"Formal platform assessment to earn verified credentials in {skill_name}.",
                "key_topics": ["Comprehensive Evaluation", "Speed & Accuracy"],
                "matched_learning_program": None,
                "matched_assessment": matched_assess
            }
        ]

        roadmap_json = {
            "status": "generated",
            "skill_id": skill_id,
            "starting_point": starting_sentence,
            "path": steps
        }
        
    # 5. Cache the result
    upsert_data = {
        "student_id": student_id,
        "skill_id": skill_id,
        "roadmap_json": roadmap_json,
        "based_on_proficiency_level": int(round(current_level))
    }
    
    try:
        if cached_res.data:
            client.table("skill_roadmaps") \
                .update(upsert_data) \
                .eq("student_id", student_id) \
                .eq("skill_id", skill_id) \
                .execute()
        else:
            client.table("skill_roadmaps").insert(upsert_data).execute()
    except Exception as e:
        print(f"Warning: Failed to cache roadmap: {e}")
        try:
            from app.dependencies import get_service_client
            sc = get_service_client()
            sc.table("skill_roadmaps").insert(upsert_data).execute()
        except Exception:
            pass
        
    return roadmap_json

@router.get("/student/skills/{skill_id}/roadmap", response_model=SkillRoadmapResponse)
def get_skill_roadmap(
    skill_id: str,
    target_role_id: Optional[str] = None,
    client: Client = Depends(get_db_client),
    student: dict = Depends(get_current_student)
):
    # Simply delegates to the POST to ensure regeneration if stale, 
    # but the POST uses caching efficiently.
    return generate_skill_roadmap(skill_id, target_role_id, client, student)
