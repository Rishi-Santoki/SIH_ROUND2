from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_academician

router = APIRouter(prefix="/academician", tags=["Academician Notifications"])

@router.get("/notifications")
def get_notifications(
    is_read: bool = None,
    academician: dict = Depends(get_current_academician), 
    client: Client = Depends(get_db_client)
):
    query = client.table("notifications").select("*").eq("user_id", academician["user_id"]).order("created_at", desc=True)
    if is_read is not None:
        query = query.eq("is_read", is_read)
        
    res = query.execute()
    return res.data

@router.patch("/notifications/{notification_id}/read")
def mark_read(notification_id: str, academician: dict = Depends(get_current_academician), client: Client = Depends(get_db_client)):
    res = client.table("notifications").update({"is_read": True}).eq("notification_id", notification_id).eq("user_id", academician["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return res.data[0]
