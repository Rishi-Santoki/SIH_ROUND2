from pydantic import BaseModel, UUID4, AnyHttpUrl
from typing import List, Optional, Any
from datetime import date, datetime

# Module 1
class ProfileUpdate(BaseModel):
    department: Optional[str] = None
    current_year: Optional[int] = None
    cgpa: Optional[float] = None
    graduation_year: Optional[int] = None
    target_career_id: Optional[UUID4] = None
    resume_url: Optional[str] = None
    bio: Optional[str] = None

class TargetRoleUpdate(BaseModel):
    target_career_id: UUID4

# Module 2
class SkillEvidenceItem(BaseModel):
    evidence_type: str
    evidence_ref_id: UUID4
    weight: float
    verified_by: Optional[UUID4] = None

class StudentSkillResponse(BaseModel):
    skill_id: UUID4
    skill_name: str
    proficiency_level: int
    confidence_score: float
    verification_status: str
    evidence: List[SkillEvidenceItem]

class SkillDeclareRequest(BaseModel):
    skill_id: Optional[UUID4] = None
    skill_name: Optional[str] = None
    proficiency_level: int = 1

# Module 3
class SkillGapItem(BaseModel):
    skill_name: str
    required_level: int
    current_level: int
    gap: int
    is_mandatory: bool
    importance_weight: float
    status: str

class SkillGapSummary(BaseModel):
    met: int
    partial: int
    missing: int
    completion_percentage: float

# Module 4
class SkillBreakdownItem(BaseModel):
    skill: str
    current: int
    target: int

class Recommendation(BaseModel):
    rank: int
    action: str
    linked_gap: str

class DigitalTwinResponse(BaseModel):
    target_role: str
    skill_breakdown: List[SkillBreakdownItem]
    readiness_percentage: float
    recommendations: List[Recommendation]
    last_recalculated: datetime

class RoadmapResponse(BaseModel):
    target_role: str
    current_state: dict
    gaps: List[SkillGapItem]
    learning_plan: List[dict]
    matched_opportunities: List[dict]
    next_milestone: str

# Module 5
class LearningProgressUpdate(BaseModel):
    progress_percentage: int
    status: str

# Module 6
class MatchBreakdown(BaseModel):
    skill_compatibility: float
    assessment_evidence: float
    projects_experience: float
    eligibility: float
    career_interest: float

class OpportunityMatchResponse(BaseModel):
    opportunity_id: UUID4
    match_score: float
    breakdown: MatchBreakdown
    matched: List[str]
    partially_matched: List[str]
    missing: List[str]
    next_best_action: Optional[str]

# Module 7
class ApplicationCreate(BaseModel):
    opportunity_id: str

# Module 8
class ProjectCreate(BaseModel):
    title: str
    description: str
    github_url: Optional[str] = None
    project_url: Optional[str] = None
    media_url: Optional[str] = None
    skill_id: Optional[UUID4] = None

class CertificationCreate(BaseModel):
    title: str
    provider: str
    issue_date: date
    credential_id: str
    credential_url: Optional[str] = None
    skill_id: Optional[UUID4] = None

# Module 10
class CopilotRequest(BaseModel):
    query: str

class CopilotResponse(BaseModel):
    answer: str
    sources: List[str]
    next_action: Optional[str] = None
