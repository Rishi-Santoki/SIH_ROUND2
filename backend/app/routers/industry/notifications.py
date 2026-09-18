from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from typing import Optional
from app.dependencies import get_current_recruiter

router = APIRouter(prefix="/industry/notifications", tags=["Industry Notifications"])

@router.get("")
def list_notifications(is_read: Optional[bool] = None, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    query = client.table("notifications").select("*").eq("user_id", recruiter["user_id"]).order("created_at", desc=True)
    if is_read is not None:
        query = query.eq("is_read", is_read)
    res = query.execute()
    return res.data

@router.patch("/{notification_id}/read")
def mark_read(notification_id: str, recruiter: dict = Depends(get_current_recruiter)):
    client: Client = recruiter["client"]
    res = client.table("notifications").update({"is_read": True}).eq("notification_id", notification_id).eq("user_id", recruiter["user_id"]).execute()
    return res.data[0] if res.data else {"status": "success"}
