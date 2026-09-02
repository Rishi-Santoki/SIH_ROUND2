from fastapi import APIRouter, Depends
from supabase import Client
from app.dependencies import get_db_client, get_current_institution_admin

router = APIRouter(prefix="/institution/notifications", tags=["Institution Notifications"])

@router.get("")
def get_notifications(admin: dict = Depends(get_current_institution_admin)):
    client: Client = admin["client"]
    # Notifications are linked to user_id
    res = client.table("notifications").select("*").eq("user_id", admin["user_id"]).order("created_at", desc=True).execute()
    return res.data

@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: str, admin: dict = Depends(get_current_institution_admin)):
    client: Client = admin["client"]
    client.table("notifications").update({"read": True}).eq("notification_id", notification_id).eq("user_id", admin["user_id"]).execute()
    return {"message": "Marked as read"}
