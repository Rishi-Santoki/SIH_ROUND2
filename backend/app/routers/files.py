from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from supabase import Client
from typing import Optional
from app.dependencies import get_authenticated_user, get_db_client, get_service_client
from app.services.storage_service import upload_file, delete_file, verify_signed_url_authorization, CONTEXT_CONFIG

router = APIRouter(prefix="/files", tags=["Files Storage"])

@router.post("/upload")
async def upload_media(
    context: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_authenticated_user),
    client: Client = Depends(get_db_client)
):
    """
    Generic upload endpoint.
    context must be one of: resume, profile_image, company_logo, certificate, project_media
    """
    # Use service client to bypass RLS for uploads as we manage auth securely here,
    # or use db_client since policies allow users to insert to paths starting with their user_id.
    # The storage_service handles the validation and uuid pathing.
    result = await upload_file(client, user["user_id"], file, context)
    return result

@router.get("/signed-url")
def get_signed_url(
    bucket: str,
    path: str,
    user: dict = Depends(get_authenticated_user),
    client: Client = Depends(get_service_client) 
):
    """
    Generates a short-lived signed URL for a private bucket.
    """
    # Use service client to ensure we can generate the URL for any path,
    # BUT we heavily guard it using verify_signed_url_authorization.
    verify_signed_url_authorization(user, bucket, path, client)
    
    url_res = client.storage.from_(bucket).create_signed_url(path, 600)
    url = url_res.get("signedURL", url_res.get("signedUrl"))
    if not url:
        raise HTTPException(status_code=500, detail="Failed to generate signed URL")
        
    return {"url": url}

@router.delete("")
def remove_file(
    bucket: str,
    path: str,
    user: dict = Depends(get_authenticated_user),
    client: Client = Depends(get_service_client)
):
    """
    Deletes a file. Only owner or super admin can delete.
    """
    owner_id = path.split("/")[0] if "/" in path else None
    if owner_id != user["user_id"] and user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
        
    delete_file(client, bucket, path)
    return {"status": "deleted"}
