from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
from supabase import Client
from app.dependencies import get_authenticated_user, get_service_client, get_db_client
from app.models.community_messaging_schemas import StartConversationRequest, SendMessageRequest, EditMessageRequest
from app.services.alumni_discovery import assert_same_institution
from app.services.messaging_service import get_or_create_alumni_conversation

router = APIRouter(prefix="/community", tags=["Community Messaging"])

@router.post("/conversations")
def start_conversation(req: StartConversationRequest, user: dict = Depends(get_authenticated_user), client: Client = Depends(get_db_client)):
    role = user.get("role")
    if role not in ["student", "academician"]:
        raise HTTPException(status_code=403, detail="Only students and academicians can start conversations with alumni.")
    
    service_client = get_service_client()
    user_id = user["user_id"]
    
    # Verify same institution and alumni verification status
    assert_same_institution(client, user, req.alumni_id)
    
    # Check for existing or create new via service layer
    convo = get_or_create_alumni_conversation(service_client, user_id, req.alumni_id)
    return convo

@router.get("/conversations")
def list_conversations(user: dict = Depends(get_authenticated_user)):
    service_client = get_service_client()
    user_id = user["user_id"]
    
    # 1. Fetch conversations where user is a participant
    user_parts = service_client.table("conversation_participants").select("conversation_id, last_read_at").eq("user_id", user_id).execute()
    if not user_parts.data:
        return []
        
    convo_ids = [p["conversation_id"] for p in user_parts.data]
    user_parts_map = {p["conversation_id"]: p for p in user_parts.data}
    
    # 2. Fetch conversation metadata
    res = service_client.table("conversations").select(
        "conversation_id, created_at, updated_at, last_message_at, is_active"
    ).in_("conversation_id", convo_ids).order("last_message_at", desc=True).execute()
    
    conversations = res.data or []
    
    # 3. Fetch all participants for these conversations to get the other party's info
    parts_res = service_client.table("conversation_participants").select(
        "conversation_id, user_id, last_read_at, users(full_name, role)"
    ).in_("conversation_id", convo_ids).execute()
    
    from collections import defaultdict
    parts_by_convo = defaultdict(list)
    for p in (parts_res.data or []):
        parts_by_convo[p["conversation_id"]].append(p)
        
    # Assemble results
    result = []
    for c in conversations:
        cid = c["conversation_id"]
        convo_parts = parts_by_convo[cid]
        
        other_participant = next((p for p in convo_parts if p["user_id"] != user_id), None)
        my_participant = user_parts_map.get(cid)
        
        unread_count = 0
        if my_participant:
            last_read = my_participant.get("last_read_at")
            if last_read:
                msg_res = service_client.table("messages").select("message_id", count="exact").eq("conversation_id", cid).gt("created_at", last_read).execute()
                unread_count = msg_res.count if msg_res.count else 0
            else:
                msg_res = service_client.table("messages").select("message_id", count="exact").eq("conversation_id", cid).execute()
                unread_count = msg_res.count if msg_res.count else 0
                
        other_info = None
        if other_participant:
            u_data = other_participant.get("users", {}) or {}
            other_info = {
                "user_id": other_participant["user_id"],
                "full_name": u_data.get("full_name") if u_data else "Alumni Participant",
                "role": u_data.get("role") if u_data else "alumni"
            }
            
        c["other_participant"] = other_info
        c["unread_count"] = unread_count
        result.append(c)
        
    return result

@router.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str, offset: int = 0, limit: int = 50, user: dict = Depends(get_authenticated_user)):
    service_client = get_service_client()
    user_id = user["user_id"]
    
    # Check participation
    part_chk = service_client.table("conversation_participants").select("participant_id").eq("conversation_id", conversation_id).eq("user_id", user_id).execute()
    if not part_chk.data:
        raise HTTPException(status_code=403, detail="You are not a participant in this conversation.")
        
    res = service_client.table("messages").select(
        "message_id, conversation_id, sender_id, message, reply_to_id, is_edited, is_deleted, created_at, updated_at"
    ).eq("conversation_id", conversation_id).order("created_at", desc=False).range(offset, offset + limit - 1).execute()
    
    messages = []
    for msg in (res.data or []):
        if msg.get("is_deleted"):
            msg["message"] = "[Message deleted]"
        messages.append(msg)
        
    return messages

@router.post("/conversations/{conversation_id}/messages")
def send_message(conversation_id: str, req: SendMessageRequest, user: dict = Depends(get_authenticated_user)):
    service_client = get_service_client()
    user_id = user["user_id"]
    
    # Verify participant
    part_chk = service_client.table("conversation_participants").select("participant_id").eq("conversation_id", conversation_id).eq("user_id", user_id).execute()
    if not part_chk.data:
        raise HTTPException(status_code=403, detail="You are not a participant in this conversation.")
        
    if req.reply_to_id:
        reply_res = service_client.table("messages").select("conversation_id").eq("message_id", req.reply_to_id).execute()
        if not reply_res.data or reply_res.data[0]["conversation_id"] != conversation_id:
            raise HTTPException(status_code=400, detail="reply_to_id must belong to the same conversation.")
            
    msg_res = service_client.table("messages").insert({
        "conversation_id": conversation_id,
        "sender_id": user_id,
        "message": req.message,
        "reply_to_id": req.reply_to_id
    }).execute()
    
    if not msg_res.data:
        raise HTTPException(status_code=500, detail="Failed to persist message.")
        
    new_msg = msg_res.data[0]
    
    now_iso = datetime.now(timezone.utc).isoformat()
    service_client.table("conversations").update({"last_message_at": now_iso}).eq("conversation_id", conversation_id).execute()
    
    # Notify other participant
    parts_res = service_client.table("conversation_participants").select("user_id, last_read_at").eq("conversation_id", conversation_id).neq("user_id", user_id).execute()
    if parts_res.data:
        other_id = parts_res.data[0]["user_id"]
        sender_name = user.get("full_name", "Someone")
        service_client.table("notifications").insert({
            "user_id": other_id,
            "type": "new_match",
            "title": f"New message from {sender_name}",
            "message": req.message[:100] + ("..." if len(req.message) > 100 else ""),
            "reference_id": conversation_id,
            "is_read": False
        }).execute()
        
    return new_msg

@router.patch("/messages/{message_id}")
def edit_message(message_id: str, req: EditMessageRequest, user: dict = Depends(get_authenticated_user)):
    service_client = get_service_client()
    user_id = user["user_id"]
    
    res = service_client.table("messages").update({
        "message": req.message,
        "is_edited": True,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("message_id", message_id).eq("sender_id", user_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=403, detail="Message not found or you don't have permission to edit it.")
    return res.data[0]

@router.delete("/messages/{message_id}")
def delete_message(message_id: str, user: dict = Depends(get_authenticated_user)):
    service_client = get_service_client()
    user_id = user["user_id"]
    
    res = service_client.table("messages").update({
        "is_deleted": True,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("message_id", message_id).eq("sender_id", user_id).execute()
    
    if not res.data:
        raise HTTPException(status_code=403, detail="Message not found or you don't have permission to delete it.")
    return {"status": "deleted"}

@router.patch("/conversations/{conversation_id}/read")
def mark_conversation_read(conversation_id: str, user: dict = Depends(get_authenticated_user)):
    service_client = get_service_client()
    user_id = user["user_id"]
    
    res = service_client.table("conversation_participants").select("participant_id").eq("conversation_id", conversation_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=403, detail="You are not a participant of this conversation.")
        
    participant_id = res.data[0]["participant_id"]
    now_iso = datetime.now(timezone.utc).isoformat()
    service_client.table("conversation_participants").update({"last_read_at": now_iso}).eq("participant_id", participant_id).execute()
    
    return {"status": "success", "last_read_at": now_iso}
