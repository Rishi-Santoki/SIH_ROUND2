from fastapi import APIRouter, Depends
from typing import Optional
from app.dependencies import get_current_student
from app.services.alumni_discovery import get_visible_alumni, get_alumni_profile_for_user
from app.services.alumni_mentorship import get_recommended_mentors
from app.models.alumni_schemas import MentorMatch
from typing import List, Optional

router = APIRouter(prefix="/student/alumni", tags=["Student Alumni Directory"])

@router.get("/recommended", response_model=List[MentorMatch])
def get_recommended(limit: int = 5, student: dict = Depends(get_current_student)):
    return get_recommended_mentors(student["client"], student, limit)

@router.get("")
def list_alumni(
    search: Optional[str] = None,
    department: Optional[str] = None,
    graduation_year: Optional[int] = None,
    current_profession: Optional[str] = None,
    current_company: Optional[str] = None,
    skill_id: Optional[str] = None,
    student: dict = Depends(get_current_student)
):
    return get_visible_alumni(
        client=student["client"],
        requesting_user=student,
        search=search,
        department=department,
        graduation_year=graduation_year,
        current_profession=current_profession,
        current_company=current_company,
        skill_id=skill_id
    )

@router.get("/{alumni_id}")
def get_alumni_detail(alumni_id: str, student: dict = Depends(get_current_student)):
    return get_alumni_profile_for_user(student["client"], student, alumni_id)
