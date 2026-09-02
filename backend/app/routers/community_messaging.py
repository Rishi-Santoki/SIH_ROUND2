from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
from app.dependencies import get_authenticated_user, get_service_client
from app.models.community_messaging_schemas import StartConversationRequest, SendMessageRequest, EditMessageRequest
from app.services.alumni_discovery import assert_same_institution
from app.services.messaging_service import get_or_create_alumni_conversation

router = APIRouter(prefix="/community", tags=["Community Messaging"])

@router.post("/conversations")
def start_conversation(req: StartConversationRequest, user: dict = Depends(get_authenticated_user)):
    role = user["user"]["role"]
    if role not in ["student", "academician"]:
        raise HTTPException(status_code=403, detail="Only students and academicians can start conversations with alumni.")
    
    client = user["client"]
    user_id = user["user"]["user_id"]
    
    # 3 & 4. Verify same institution and alumni verification status (assert_same_institution throws 404 if failed)
    assert_same_institution(client, user["user"], req.alumni_id)
    
    # 5 & 6. Check for existing or create new via service layer
    convo = get_or_create_alumni_conversation(client, user_id, req.alumni_id)
    return convo

@router.get("/conversations")
def list_conversations(user: dict = Depends(get_authenticated_user)):
    client = user["client"]
    user_id = user["user"]["user_id"]
    
    # Get user's conversations
    # Need to include the other participant's basic info and unread count.
    # We can fetch conversations directly; RLS restricts to those the user is a participant of.
    res = client.table("conversations").select(
        "conversation_id, created_at, updated_at, last_message_at, is_active"
    ).order("last_message_at", desc=True).execute()
    
    conversations = res.data
    
    # Fetch participant info for these conversations
    if not conversations:
        return []
        
    convo_ids = [c["conversation_id"] for c in conversations]
    
    # We use a service client to easily join user data across conversations, or we can just fetch participants
    service_client = get_service_client()
    parts_res = service_client.table("conversation_participants").select(
        "conversation_id, user_id, last_read_at, users(full_name, role)"
    ).in_("conversation_id", convo_ids).execute()
    
    parts_data = parts_res.data
    
    # Group participants by conversation
    from collections import defaultdict
    parts_by_convo = defaultdict(list)
    for p in parts_data:
        parts_by_convo[p["conversation_id"]].append(p)
        
    # Assemble the result
    result = []
    for c in conversations:
        cid = c["conversation_id"]
        convo_parts = parts_by_convo[cid]
        
        other_participant = next((p for p in convo_parts if p["user_id"] != user_id), None)
        my_participant = next((p for p in convo_parts if p["user_id"] == user_id), None)
        
        # Calculate unread count
        unread_count = 0
        if my_participant:
            last_read = my_participant.get("last_read_at")
            if last_read:
                # Count messages in this conversation newer than last_read
                # Note: this might be inefficient if done per conversation via API,
                # but for MVP we can do a simple count query or leave it as 0 if unread tracking is too complex
                msg_res = client.table("messages").select("message_id", count="exact").eq("conversation_id", cid).gt("created_at", last_read).execute()
                unread_count = msg_res.count if msg_res.count else 0
            else:
                msg_res = client.table("messages").select("message_id", count="exact").eq("conversation_id", cid).execute()
                unread_count = msg_res.count if msg_res.count else 0
                
        # Format other participant info
        other_info = None
        if other_participant:
            u_data = other_participant.get("users", {})
            other_info = {
                "user_id": other_participant["user_id"],
                "full_name": u_data.get("full_name") if u_data else "Unknown",
                "role": u_data.get("role") if u_data else "Unknown"
            }
            
        c["other_participant"] = other_info
        c["unread_count"] = unread_count
        result.append(c)
        
    return result

@router.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str, offset: int = 0, limit: int = 50, user: dict = Depends(get_authenticated_user)):
    client = user["client"]
    
    # RLS restricts this to conversation members automatically.
    res = client.table("messages").select(
        "message_id, conversation_id, sender_id, message, reply_to_id, is_edited, is_deleted, created_at, updated_at"
    ).eq("conversation_id", conversation_id).order("created_at", desc=False).range(offset, offset + limit - 1).execute()
    
    # Process deleted messages
    messages = []
    for msg in res.data:
        if msg.get("is_deleted"):
            msg["message"] = "[Message deleted]"
        messages.append(msg)
        
    return messages

@router.post("/conversations/{conversation_id}/messages")
def send_message(conversation_id: str, req: SendMessageRequest, user: dict = Depends(get_authenticated_user)):
    client = user["client"]
    user_id = user["user"]["user_id"]
    
    # 1. Validate reply_to_id if present
    if req.reply_to_id:
        reply_res = client.table("messages").select("conversation_id").eq("message_id", req.reply_to_id).execute()
        if not reply_res.data or reply_res.data[0]["conversation_id"] != conversation_id:
            raise HTTPException(status_code=400, detail="reply_to_id must belong to the same conversation.")
            
    # 2. Insert message. sender_id is explicitly set here, overcoming any client spoofing.
    # Additionally, RLS enforces sender_id = auth.uid()
    try:
        msg_res = client.table("messages").insert({
            "conversation_id": conversation_id,
            "sender_id": user_id,
            "message": req.message,
            "reply_to_id": req.reply_to_id
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=403, detail="Failed to send message. You may not be a participant.")
        
    new_msg = msg_res.data[0]
    
    # 3. Update conversation last_message_at (Requires service client to bypass RLS for conversations update)
    service_client = get_service_client()
    now_iso = datetime.now(timezone.utc).isoformat()
    service_client.table("conversations").update({"last_message_at": now_iso}).eq("conversation_id", conversation_id).execute()
    
    # 4. Trigger Notification for the other participant
    parts_res = service_client.table("conversation_participants").select("user_id, last_read_at").eq("conversation_id", conversation_id).neq("user_id", user_id).execute()
    if parts_res.data:
        other_participant = parts_res.data[0]
        other_id = other_participant["user_id"]
        last_read_at = other_participant.get("last_read_at")
        
        # Simple recency check for MVP: if last_read_at is null or older than 10 seconds ago
        needs_notification = True
        if last_read_at:
            # Parse last_read_at (ISO 8601 string from Supabase)
            try:
                # Handle varying formats of timestamp from Supabase
                clean_time = last_read_at.replace("Z", "+00:00")
                last_read_dt = datetime.fromisoformat(clean_time)
                diff = (datetime.now(timezone.utc) - last_read_dt).total_seconds()
                if diff < 10:
                    needs_notification = False
            except Exception:
                pass
                
        if needs_notification:
            sender_name = user["user"].get("full_name", "Someone")
            service_client.table("notifications").insert({
                "user_id": other_id,
                "type": "application_update",
                "title": f"New message from {sender_name}",
                "message": req.message[:100] + ("..." if len(req.message) > 100 else ""),
                "reference_id": conversation_id
            }).execute()
            
    return new_msg

@router.patch("/messages/{message_id}")
def edit_message(message_id: str, req: EditMessageRequest, user: dict = Depends(get_authenticated_user)):
    client = user["client"]
    # RLS enforces ownership.
    try:
        res = client.table("messages").update({
            "message": req.message,
            "is_edited": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("message_id", message_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=403, detail="Message not found or you don't have permission to edit it.")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=403, detail="Failed to edit message. You must be the sender.")

@router.delete("/messages/{message_id}")
def delete_message(message_id: str, user: dict = Depends(get_authenticated_user)):
    client = user["client"]
    # We soft delete by updating the row instead of actual DELETE
    try:
        res = client.table("messages").update({
            "is_deleted": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("message_id", message_id).execute()
        
        if not res.data:
            raise HTTPException(status_code=403, detail="Message not found or you don't have permission to delete it.")
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=403, detail="Failed to delete message. You must be the sender.")

@router.patch("/conversations/{conversation_id}/read")
def mark_conversation_read(conversation_id: str, user: dict = Depends(get_authenticated_user)):
    client = user["client"]
    user_id = user["user"]["user_id"]
    
    # We need to update conversation_participants.last_read_at
    # RLS blocks client updates to conversation_participants.
    # Therefore, we use the service_client, but first we verify the user is actually a participant.
    
    # Verify participant using normal client (RLS enforced)
    res = client.table("conversation_participants").select("participant_id").eq("conversation_id", conversation_id).eq("user_id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=403, detail="You are not a participant of this conversation.")
        
    participant_id = res.data[0]["participant_id"]
    
    service_client = get_service_client()
    now_iso = datetime.now(timezone.utc).isoformat()
    service_client.table("conversation_participants").update({"last_read_at": now_iso}).eq("participant_id", participant_id).execute()
    
    return {"status": "success", "last_read_at": now_iso}
