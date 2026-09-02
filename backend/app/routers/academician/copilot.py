from fastapi import APIRouter, Depends
from supabase import Client
from app.dependencies import get_db_client, get_current_academician
from app.models.academician_schemas import CopilotRequest
from app.routers.academician.discover import get_recommended_collaborations
from app.routers.academician.collaborations import get_collaboration_history

router = APIRouter(prefix="/academician/copilot", tags=["Academician Copilot"])

@router.post("/ask")
def ask_copilot(req: CopilotRequest, academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    # 1. Log the user's message
    msg_data = {
        "user_id": academician["user_id"],
        "message": req.query,
        "is_bot": False
    }
    client.table("chat_history").insert(msg_data).execute()
    
    # Intent routing: structured vs unstructured (USP 15)
    query_lower = req.query.lower()
    
    bot_msg = ""
    sources = []
    
    if "match" in query_lower or "recommend" in query_lower or "fdp" in query_lower and ("my" in query_lower or "expertise" in query_lower):
        # Route to recommended collaborations
        recs = get_recommended_collaborations(academician, client)
        if recs:
            titles = [r["title"] for r in recs[:3]]
            bot_msg = f"Based on your expertise, here are some recommended collaborations: {', '.join(titles)}."
        else:
            bot_msg = "I couldn't find any recommended collaborations matching your expertise right now."
        sources = ["Faculty Collaborations matching Expertise"]
            
    elif "history" in query_lower or "past" in query_lower or "completed" in query_lower:
        # Route to history
        hist = get_collaboration_history(academician, client)
        if hist:
            titles = [h["title"] for h in hist[:3]]
            bot_msg = f"Here is a summary of your past completed collaborations: {', '.join(titles)}."
        else:
            bot_msg = "You have no completed collaborations in your history."
        sources = ["Collaboration History"]
        
    else:
        # Unstructured RAG path
        from app.core.rag import retrieve_relevant_chunks
        chunks = retrieve_relevant_chunks(client, req.query, "academician", top_k=3)
        if chunks:
            context_str = "\n\n".join([f"Source ({c['metadata'].get('title', 'Unknown')}): {c['content']}" for c in chunks])
            bot_msg = f"Based on the knowledge base:\n\n{context_str}\n\n(Waiting for LLM generation.)"
            sources = list(set([c['metadata'].get('title', 'Unknown') for c in chunks]))
        else:
            bot_msg = "I'm sorry, I couldn't find any relevant information in the knowledge base."
            sources = []
    
    resp_data = {
        "user_id": academician["user_id"],
        "message": bot_msg,
        "is_bot": True,
        "sources": sources,
        "next_action": None
    }
    
    saved = client.table("chat_history").insert(resp_data).execute()
    return saved.data[0]

@router.get("/history")
def get_history(academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    res = client.table("chat_history").select("*").eq("user_id", academician["user_id"]).order("created_at", desc=False).execute()
    return res.data
