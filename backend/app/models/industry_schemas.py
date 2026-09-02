from pydantic import BaseModel, UUID4
from typing import List, Optional
from datetime import date, datetime

class IndustryOnboarding(BaseModel):
    company_id: Optional[UUID4] = None
    new_company_name: Optional[str] = None
    designation: Optional[str] = None

class CompanyUpdate(BaseModel):
    description: Optional[str] = None
    industry_type: Optional[str] = None
    website: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    logo_url: Optional[str] = None

class RecruiterInvite(BaseModel):
    email: str

class RecruiterProfileUpdate(BaseModel):
    designation: Optional[str] = None
    department: Optional[str] = None

class OpportunityCreate(BaseModel):
    title: str
    description: str
    opportunity_type: str # 'internship', 'job', 'apprenticeship', 'fdp', 'project'
    location: str
    work_mode: str
    duration: Optional[str] = None
    stipend: Optional[str] = None
    application_deadline: datetime
    min_cgpa: Optional[float] = None
    create_faculty_collaboration: Optional[bool] = False # For FDP/project

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    work_mode: Optional[str] = None
    duration: Optional[str] = None
    stipend: Optional[str] = None
    application_deadline: Optional[datetime] = None
    min_cgpa: Optional[float] = None

class OpportunitySkillAdd(BaseModel):
    skill_id: UUID4
    required_level: int
    importance_weight: float
    is_mandatory: bool

class ApplicationStatusUpdate(BaseModel):
    status: str # 'shortlisted', 'interview', 'selected', 'rejected'
    recruiter_notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class MilestoneCreate(BaseModel):
    milestone: str

class MilestoneUpdate(BaseModel):
    status: str
    mentor_feedback: Optional[str] = None
    mentor_rating: Optional[float] = None
