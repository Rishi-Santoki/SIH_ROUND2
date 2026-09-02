from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

# Management / Authoring Schemas
class AssessmentCreate(BaseModel):
    title: str
    description: str
    assessment_type: str = Field(pattern="^(technical|aptitude|soft_skill)$")
    skill_id: Optional[str] = None
    duration_minutes: int
    total_marks: int

class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assessment_type: Optional[str] = Field(None, pattern="^(technical|aptitude|soft_skill)$")
    skill_id: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[int] = None

class AssessmentOut(BaseModel):
    assessment_id: str
    title: str
    description: str
    assessment_type: str
    skill_id: Optional[str]
    created_by: str
    duration_minutes: int
    total_marks: int
    is_active: bool
    created_at: datetime
    
class AssessmentQuestionCreate(BaseModel):
    question: str
    question_type: str = Field(pattern="^(mcq|true_false|short_answer)$")
    options: Optional[Dict[str, Any]] = None
    correct_answer: Optional[str] = None
    marks: int
    difficulty: str = Field(pattern="^(easy|medium|hard)$")

class AssessmentQuestionUpdate(BaseModel):
    question: Optional[str] = None
    question_type: Optional[str] = Field(None, pattern="^(mcq|true_false|short_answer)$")
    options: Optional[Dict[str, Any]] = None
    correct_answer: Optional[str] = None
    marks: Optional[int] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")

# Student taking surface schemas
class StudentQuestionOut(BaseModel):
    question_id: str
    assessment_id: str
    question: str
    question_type: str
    options: Optional[Dict[str, Any]]
    marks: int
    difficulty: str

class AnswerSubmission(BaseModel):
    question_id: str
    submitted_answer: str
    
class AssessmentSubmit(BaseModel):
    answers: List[AnswerSubmission]

class AssessmentResultOut(BaseModel):
    result_id: str
    student_id: str
    assessment_id: str
    score: Optional[float]
    percentage: Optional[float]
    started_at: datetime
    completed_at: Optional[datetime]
    attempt_number: int

# Manual grading schema
class ManualGradeSubmit(BaseModel):
    marks: int

class ManualGradeResponse(BaseModel):
    question_id: str
    submitted_answer: str
    marks: int

class GradeUpdate(BaseModel):
    grades: List[ManualGradeResponse]
