from fastapi import APIRouter, Depends
from supabase import Client
from app.dependencies import get_current_recruiter
from app.models.schemas import CopilotRequest, CopilotResponse

router = APIRouter(prefix="/industry/copilot", tags=["Industry AI Copilot"])

@router.post("/ask", response_model=CopilotResponse)
def ask_copilot(req: CopilotRequest, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    
    # 1. Log query
    client.table("conversation_logs").insert({
        "user_id": recruiter["user_id"],
        "message": req.query,
        "is_bot": False
    }).execute()
    
    # 2. Logic stub
    # If structured intent ("Find candidates for this internship"):
    # We would retrieve the opportunity_id, then call discover_candidates internally.
    
    query_lower = req.query.lower()
    is_structured = "candidate" in query_lower or "intern" in query_lower
    
    if is_structured:
        bot_msg = "This is a structured response for candidates."
        sources = ["Candidate Pool"]
    else:
        # Unstructured RAG path
        from app.core.rag import retrieve_relevant_chunks
        chunks = retrieve_relevant_chunks(client, req.query, "industry", top_k=3)
        if chunks:
            context_str = "\n\n".join([f"Source ({c['metadata'].get('title', 'Unknown')}): {c['content']}" for c in chunks])
            bot_msg = f"Based on the knowledge base:\n\n{context_str}\n\n(Waiting for LLM generation.)"
            sources = list(set([c['metadata'].get('title', 'Unknown') for c in chunks]))
        else:
            bot_msg = "I'm sorry, I couldn't find any relevant information in the knowledge base."
            sources = []
            
    client.table("conversation_logs").insert({
        "user_id": recruiter["user_id"],
        "message": bot_msg,
        "is_bot": True
    }).execute()
    
    return {
        "answer": bot_msg,
        "sources": [],
        "next_action": "Configure role-aware routing logic"
    }

@router.get("/history")
def get_history(recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    res = client.table("conversation_logs").select("*").eq("user_id", recruiter["user_id"]).order("created_at").execute()
    return res.data
