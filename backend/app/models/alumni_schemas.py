from pydantic import BaseModel, Field
from typing import Optional

class AlumniProfileOnboarding(BaseModel):
    institution_id: str
    graduation_year: int
    degree: Optional[str] = None
    department: Optional[str] = None
    current_profession: Optional[str] = None
    current_company: Optional[str] = None
    current_designation: Optional[str] = None
    previous_experience: Optional[str] = None
    expertise: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    profile_image: Optional[str] = None

class AlumniProfileUpdate(BaseModel):
    degree: Optional[str] = None
    department: Optional[str] = None
    current_profession: Optional[str] = None
    current_company: Optional[str] = None
    current_designation: Optional[str] = None
    previous_experience: Optional[str] = None
    expertise: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    profile_image: Optional[str] = None
    
    # Intentionally omitted fields that cannot be updated directly
    # alumni_id, role, institution_id, is_verified

class AlumniSkillAdd(BaseModel):
    skill_id: str
    proficiency_level: Optional[int] = Field(None, ge=1, le=5)
    willing_to_mentor: Optional[bool] = False
    found_challenging: Optional[bool] = False

class AlumniSkillMentorshipUpdate(BaseModel):
    willing_to_mentor: Optional[bool] = None
    found_challenging: Optional[bool] = None

class MentorMatch(BaseModel):
    alumni_id: str
    full_name: str
    current_profession: Optional[str] = None
    current_company: Optional[str] = None
    is_verified: bool
    matched_skill: str
    gap_name: str
    reason: str
