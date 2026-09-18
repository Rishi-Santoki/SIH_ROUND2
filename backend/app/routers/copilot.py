from fastapi import APIRouter, Depends
from supabase import Client
from app.dependencies import get_db_client, get_current_student
from app.models.schemas import CopilotRequest, CopilotResponse
from app.core.matching import get_skill_gaps, get_skill_gap_summary
from app.routers.gaps import _get_target_role

router = APIRouter(prefix="/student/copilot", tags=["AI Copilot"])

@router.post("", response_model=CopilotResponse)
def ask_copilot(req: CopilotRequest, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # 1. Store the conversation log safely
    try:
        msg_data = {
            "user_id": student["user_id"],
            "message": req.query,
            "is_bot": False
        }
        client.table("chat_history").insert(msg_data).execute()
    except Exception:
        pass
    
    # Intent routing: structured vs unstructured (USP 15)
    query_lower = req.query.lower()
    is_structured_skills_query = "skill" in query_lower and ("missing" in query_lower or "gap" in query_lower or "target" in query_lower)
    
    sources = []
    if is_structured_skills_query:
        target_role = _get_target_role(client, student["user_id"])
        gaps = get_skill_gaps(client, student["user_id"], target_role)
        missing = [g["skill_name"] for g in gaps if g["status"] in ["missing", "partial"]]
        if missing:
            bot_msg = f"Based on your structured profile data, you are missing or need improvement in: {', '.join(missing)}."
        else:
            bot_msg = "Great news! According to your profile, you have met the required levels for your target role skills."
        sources = ["Student Profile Data", "Role Skill Taxonomy"]
    else:
        # Unstructured RAG path
        from app.core.rag import retrieve_relevant_chunks
        chunks = retrieve_relevant_chunks(client, req.query, "student", top_k=3)
        if chunks:
            context_str = "\n\n".join([f"Source ({c['metadata'].get('title', 'Knowledge Base')}): {c['content']}" for c in chunks])
            bot_msg = f"Based on the platform knowledge base:\n\n{context_str}"
            sources = list(set([c['metadata'].get('title', 'Knowledge Base') for c in chunks]))
        else:
            bot_msg = f"I've analyzed your question '{req.query}'. As your AI Career Copilot, I recommend completing your verified assessments and keeping your project portfolio updated to maximize opportunity matching."
            sources = ["ProofLedger Copilot Engine"]
    
    try:
        resp_data = {
            "user_id": student["user_id"],
            "message": bot_msg,
            "is_bot": True
        }
        client.table("chat_history").insert(resp_data).execute()
    except Exception:
        pass
    
    return {
        "answer": bot_msg,
        "sources": sources,
        "next_action": "Explore recommended skills or opportunities"
    }

@router.get("/history")
def get_history(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # The DB table is chat_history, not conversation_logs
    res = client.table("chat_history").select("*").eq("user_id", student["user_id"]).order("created_at", desc=False).execute()
    return res.data
