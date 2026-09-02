from fastapi import APIRouter, Depends, HTTPException
from supabase import Client
from app.dependencies import get_db_client, get_current_student
from app.models.schemas import ApplicationCreate
from app.core.matching import calculate_match_score

router = APIRouter(prefix="/student/applications", tags=["Applications"])

@router.post("")
def create_application(req: ApplicationCreate, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    # Check if opportunity exists and is open
    opp = client.table("opportunities").select("status").eq("opportunity_id", str(req.opportunity_id)).execute()
    if not opp.data or opp.data[0]["status"] != "open":
        raise HTTPException(status_code=400, detail="Opportunity not available")
        
    # Calculate and freeze match score at time of application (USP 5 consistency)
    match_data = calculate_match_score(client, student["user_id"], str(req.opportunity_id), opp.data[0].get("target_career_id", ""))
    
    data = {
        "student_id": student["user_id"],
        "opportunity_id": str(req.opportunity_id),
        "status": "applied",
        "match_score": match_data["match_score"],
        "match_score_breakdown": match_data.get("breakdown", {})
    }
    res = client.table("applications").insert(data).execute()
    return res.data

@router.get("")
def list_applications(student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("applications").select("*, opportunities(*)").eq("student_id", student["user_id"]).execute()
    return res.data

@router.get("/{application_id}")
def get_application(application_id: str, student: dict = Depends(get_current_student), client: Client = Depends(get_db_client)):
    res = client.table("applications").select("*, application_tracking(*)").eq("application_id", application_id).eq("student_id", student["user_id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Not found")
    return res.data[0]
