from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

class ExpertiseUpdate(BaseModel):
    expertise_areas: List[str] = Field(default_factory=list, description="Array of skill IDs or free-text domains")

class AcademicianProfileUpdate(BaseModel):
    department: Optional[str] = None
    designation: Optional[str] = None
    expertise_areas: Optional[List[str]] = None
    research_interests: Optional[str] = None
    linkedin_url: Optional[str] = None
    orcid_id: Optional[str] = None
    # Note: institution_id is explicitly omitted as it's immutable via this endpoint

class CollaborationCreate(BaseModel):
    title: str
    description: str
    collaboration_type: str = Field(..., description="fdp, industrial_training, research, consultancy, guest_lecture, mentorship")
    company_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class CollaborationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class CollaborationStatusUpdate(BaseModel):
    status: str = Field(..., description="proposed, ongoing, completed")
    completion_notes: Optional[str] = None

class CopilotRequest(BaseModel):
    query: str
