from fastapi import APIRouter, Depends
from supabase import Client
from app.dependencies import get_db_client, get_current_institution_admin
from app.models.schemas import CopilotRequest, CopilotResponse
from app.routers.institution.students import get_at_risk_students
from app.routers.institution.analytics import get_aggregate_skill_gaps

router = APIRouter(prefix="/institution/copilot", tags=["Institution Copilot"])

@router.post("/ask", response_model=CopilotResponse)
def ask_copilot(req: CopilotRequest, admin: dict = Depends(get_current_institution_admin), client: Client = Depends(get_db_client)):
    # Log the user's message
    msg_data = {
        "user_id": admin["user_id"],
        "message": req.query,
        "is_bot": False
    }
    client.table("chat_history").insert(msg_data).execute()
    
    # Intent routing: structured vs unstructured
    query_lower = req.query.lower()
    
    bot_msg = ""
    sources = []
    next_action = None
    
    if "risk" in query_lower or "failing" in query_lower or "dropout" in query_lower:
        # Route to at-risk students
        at_risk = get_at_risk_students(admin=admin)
        if at_risk:
            count = len(at_risk)
            bot_msg = f"I found {count} students currently flagged as at-risk due to low readiness in their final years."
            next_action = "review_at_risk_students"
        else:
            bot_msg = "Currently, no students are flagged as at-risk based on readiness metrics."
        sources = ["Institution At-Risk Analytics"]
            
    elif "gap" in query_lower or "weakness" in query_lower or "missing" in query_lower:
        # Route to aggregate skill gaps
        gaps_res = get_aggregate_skill_gaps(admin=admin)
        readiness_list = gaps_res["readiness_distribution"]
        
        low_skills = [s["skill"] for s in readiness_list if s["readiness_level"] == "LOW"]
        if low_skills:
            bot_msg = f"The most prominent skill gaps across your institution include: {', '.join(low_skills[:3])}."
            next_action = "view_interventions"
        else:
            bot_msg = "Overall skill readiness is moderate to high across the board."
        sources = ["Institution Skill Gap Analytics"]
        
    else:
        # Unstructured RAG path
        from app.core.rag import retrieve_relevant_chunks
        chunks = retrieve_relevant_chunks(client, req.query, "institution", top_k=3)
        if chunks:
            context_str = "\n\n".join([f"Source ({c['metadata'].get('title', 'Unknown')}): {c['content']}" for c in chunks])
            bot_msg = f"Based on the knowledge base:\n\n{context_str}\n\n(Waiting for LLM generation.)"
            sources = list(set([c['metadata'].get('title', 'Unknown') for c in chunks]))
        else:
            bot_msg = "I'm sorry, I couldn't find any relevant information in the knowledge base."
            sources = []
    
    resp_data = {
        "user_id": admin["user_id"],
        "message": bot_msg,
        "is_bot": True,
        "sources": sources,
        "next_action": next_action
    }
    
    saved = client.table("chat_history").insert(resp_data).execute()
    return saved.data[0]

@router.get("/history")
def get_history(admin: dict = Depends(get_current_institution_admin), client: Client = Depends(get_db_client)):
    res = client.table("chat_history").select("*").eq("user_id", admin["user_id"]).order("created_at", desc=False).execute()
    return res.data
