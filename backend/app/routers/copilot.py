from fastapi import APIRouter, Depends
from supabase import Client
from app.dependencies import get_db_client, get_current_student
from app.models.schemas import CopilotRequest, CopilotResponse
from app.core.matching import get_skill_gaps, get_skill_gap_summary
from app.routers.gaps import _get_target_role

router = APIRouter(prefix="/student/copilot", tags=["AI Copilot"])

@router.post("", response_model=CopilotResponse)
def ask_copilot(req: CopilotRequest, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # 1. Store the conversation log
    msg_data = {
        "user_id": student["user_id"],
        "message": req.query,
        "is_bot": False
    }
    client.table("chat_history").insert(msg_data).execute()
    
    # Intent routing: structured vs unstructured (USP 15)
    query_lower = req.query.lower()
    is_structured_skills_query = "skill" in query_lower and ("missing" in query_lower or "gap" in query_lower)
    
    sources = []
    if is_structured_skills_query:
        target_role = _get_target_role(client, student["user_id"])
        gaps = get_skill_gaps(client, student["user_id"], target_role)
        missing = [g["skill_name"] for g in gaps if g["status"] in ["missing", "partial"]]
        bot_msg = f"Based on your structured profile data, you are missing or need improvement in: {', '.join(missing)}."
        sources = ["Student Profile Data"]
    else:
        # Unstructured RAG path
        from app.core.rag import retrieve_relevant_chunks
        chunks = retrieve_relevant_chunks(client, req.query, "student", top_k=3)
        if chunks:
            # Here we would normally prompt an LLM with the context, but for now we'll format the retrieved contexts
            context_str = "\n\n".join([f"Source ({c['metadata'].get('title', 'Unknown')}): {c['content']}" for c in chunks])
            bot_msg = f"Based on the knowledge base:\n\n{context_str}\n\n(This is a formatted RAG response waiting for LLM generation.)"
            sources = list(set([c['metadata'].get('title', 'Unknown') for c in chunks]))
        else:
            bot_msg = "I'm sorry, I couldn't find any relevant information in the knowledge base."
            sources = []
    
    resp_data = {
        "user_id": student["user_id"],
        "message": bot_msg,
        "is_bot": True
    }
    client.table("conversation_logs").insert(resp_data).execute()
    
    return {
        "answer": bot_msg,
        "sources": [],
        "next_action": "Implement LLM integration"
    }

@router.get("/history")
def get_history(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # The DB table is chat_history, not conversation_logs
    res = client.table("chat_history").select("*").eq("user_id", student["user_id"]).order("created_at", desc=False).execute()
    return res.data
