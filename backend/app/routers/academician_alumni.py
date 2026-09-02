from fastapi import APIRouter, Depends
from typing import Optional
from app.dependencies import get_current_academician
from app.services.alumni_discovery import get_visible_alumni, get_alumni_profile_for_user

router = APIRouter(prefix="/academician/alumni", tags=["Academician Alumni Directory"])

@router.get("")
def list_alumni(
    search: Optional[str] = None,
    department: Optional[str] = None,
    graduation_year: Optional[int] = None,
    current_profession: Optional[str] = None,
    current_company: Optional[str] = None,
    skill_id: Optional[str] = None,
    academician: dict = Depends(get_current_academician)
):
    return get_visible_alumni(
        client=academician["client"],
        requesting_user=academician,
        search=search,
        department=department,
        graduation_year=graduation_year,
        current_profession=current_profession,
        current_company=current_company,
        skill_id=skill_id
    )

@router.get("/{alumni_id}")
def get_alumni_detail(alumni_id: str, academician: dict = Depends(get_current_academician)):
    return get_alumni_profile_for_user(academician["client"], academician, alumni_id)
