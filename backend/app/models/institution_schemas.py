from pydantic import BaseModel, HttpUrl, EmailStr
from typing import Optional, List
from datetime import date

class InstitutionOnboarding(BaseModel):
    institution_id: Optional[UUID4] = None
    new_institution_name: Optional[str] = None
    designation: Optional[str] = None

class InstitutionProfileUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    location: Optional[str] = None
    website: Optional[HttpUrl] = None

class AdminInvite(BaseModel):
    email: EmailStr
    designation: str

class VerificationRequestCreate(BaseModel):
    document_url: HttpUrl
    comments: Optional[str] = None

class InterventionCreate(BaseModel):
    insight: str
    action: str
    mode: str = "notification" # "notification" or "collaboration"
    target_student_ids: Optional[List[str]] = None
    proposed_collaboration_type: Optional[str] = None
    
class InterventionResponse(BaseModel):
    intervention_id: str
    status: str
    message: str
