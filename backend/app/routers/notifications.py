from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_student

router = APIRouter(prefix="/student/notifications", tags=["Notifications"])

@router.get("")
def get_notifications(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("notifications").select("*").eq("user_id", student["user_id"]).order("created_at", desc=True).execute()
    return res.data

@router.patch("/{notification_id}/read")
def mark_read(notification_id: str, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("notifications").update({"is_read": True}).eq("notification_id", notification_id).eq("user_id", student["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return res.data[0]
