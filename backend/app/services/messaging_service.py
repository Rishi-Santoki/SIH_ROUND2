from supabase import Client
from typing import Dict, Any

def get_or_create_alumni_conversation(client: Client, user_id: str, alumni_id: str) -> Dict[str, Any]:
    """
    Creates a conversation and adds participants using elevated privileges.
    Clients are explicitly forbidden from inserting into `conversation_participants` via RLS.
    """
    # Since we need elevated privileges to insert into conversation_participants (RLS blocks it),
    # we must use the service role client.
    from app.dependencies import get_service_client
    service_client = get_service_client()
    
    # 1. Check if an active conversation already exists between these exact two users.
    # Find all conversations the user is in.
    user_convos_res = service_client.table("conversation_participants").select("conversation_id").eq("user_id", user_id).execute()
    user_convo_ids = [row["conversation_id"] for row in user_convos_res.data]
    
    if user_convo_ids:
        # Check if the alumni is in any of those conversations.
        alumni_match_res = service_client.table("conversation_participants") \
            .select("conversation_id") \
            .eq("user_id", alumni_id) \
            .in_("conversation_id", user_convo_ids) \
            .execute()
            
        if alumni_match_res.data:
            existing_convo_id = alumni_match_res.data[0]["conversation_id"]
            # Fetch and return the existing active conversation
            convo_res = service_client.table("conversations").select("*").eq("conversation_id", existing_convo_id).single().execute()
            return convo_res.data
            
    # 2. No existing conversation. Create a new one.
    convo_insert = service_client.table("conversations").insert({"is_active": True}).execute()
    new_convo = convo_insert.data[0]
    new_convo_id = new_convo["conversation_id"]
    
    # 3. Insert both participants
    service_client.table("conversation_participants").insert([
        {"conversation_id": new_convo_id, "user_id": user_id},
        {"conversation_id": new_convo_id, "user_id": alumni_id}
    ]).execute()
    
    return new_convo
