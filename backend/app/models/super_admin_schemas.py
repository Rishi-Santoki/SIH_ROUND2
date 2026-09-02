from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
from datetime import datetime

# Verification Queues
class VerificationAction(BaseModel):
    notes: Optional[str] = None

class RejectVerification(BaseModel):
    notes: str = Field(..., description="Reason for rejection")

# User Management
class SuspendUser(BaseModel):
    reason: str = Field(..., description="Reason for suspension")

# Role Management
class RoleChange(BaseModel):
    new_role: str = Field(..., description="Target role (e.g., industry, academician)")

# Skill Taxonomy Management
class SkillCreate(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    parent_skill_id: Optional[str] = None

class SkillUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    parent_skill_id: Optional[str] = None

class SkillMerge(BaseModel):
    merge_into_skill_id: str

class CareerRoleCreate(BaseModel):
    title: str
    category: str
    description: str

class CareerRoleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class RoleSkillCreate(BaseModel):
    skill_id: str
    required_level: int
    importance_weight: float
    is_mandatory: bool

class RoleSkillUpdate(BaseModel):
    required_level: Optional[int] = None
    importance_weight: Optional[float] = None
    is_mandatory: Optional[bool] = None

class KnowledgeDocumentCreateText(BaseModel):
    title: str
    content: str
    document_type: str
    source: Optional[str] = "manual"
    access_level: str

# Assessment Oversight
class ForceDeactivateAssessment(BaseModel):
    reason: str

# Course Management
class LearningProgramCreate(BaseModel):
    title: str
    description: str
    program_type: str
    mode: str
    duration: str
    url: str
    is_free: bool
    provider_id: Optional[str] = None
    is_active: bool = True

class LearningProgramUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    program_type: Optional[str] = None
    mode: Optional[str] = None
    duration: Optional[str] = None
    url: Optional[str] = None
    is_free: Optional[bool] = None
    is_active: Optional[bool] = None

# Opportunity Moderation
class ModerateOpportunity(BaseModel):
    action: str = Field(..., description="approve | remove")
    reason: Optional[str] = None

# Complaints
class ComplaintCreate(BaseModel):
    against_entity_type: str = Field(..., description="user | opportunity | company | institution | assessment")
    against_entity_id: str
    category: str
    description: str

class ComplaintStatusUpdate(BaseModel):
    status: str = Field(..., description="open | investigating | resolved | dismissed")
    resolution_notes: Optional[str] = None

# System Settings
class PlatformSettingUpdate(BaseModel):
    setting_value: Any
