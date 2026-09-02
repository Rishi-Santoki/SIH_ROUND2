from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.dependencies import get_current_assessment_staff
from app.models.assessment_schemas import (
    AssessmentCreate, AssessmentUpdate, AssessmentOut,
    AssessmentQuestionCreate, AssessmentQuestionUpdate,
    GradeUpdate
)
from app.core.assessments import record_assessment_evidence

router = APIRouter(prefix="/assessments/manage", tags=["Assessments Management"])

# --- MODULE 1: Assessment Authoring ---

@router.post("", response_model=AssessmentOut)
def create_assessment(data: AssessmentCreate, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    res = client.table("assessments").insert({
        "title": data.title,
        "description": data.description,
        "assessment_type": data.assessment_type,
        "skill_id": data.skill_id,
        "created_by": staff["user_id"],
        "duration_minutes": data.duration_minutes,
        "total_marks": data.total_marks,
        "is_active": False
    }).execute()
    return res.data[0]

@router.patch("/{assessment_id}", response_model=AssessmentOut)
def update_assessment(assessment_id: str, data: AssessmentUpdate, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    
    # Check if active and has results
    curr = client.table("assessments").select("is_active").eq("assessment_id", assessment_id).execute()
    if not curr.data:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    is_active = curr.data[0]["is_active"]
    has_results = False
    
    res_count = client.table("assessment_results").select("result_id", count="exact").eq("assessment_id", assessment_id).execute()
    if res_count.count > 0:
        has_results = True
        
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    
    # Block duration_minutes and total_marks if active AND has results
    if is_active and has_results:
        if "duration_minutes" in update_data or "total_marks" in update_data:
            raise HTTPException(status_code=400, detail="Cannot edit duration or marks once active and attempted.")
            
    if update_data:
        res = client.table("assessments").update(update_data).eq("assessment_id", assessment_id).execute()
        return res.data[0]
        
    return client.table("assessments").select("*").eq("assessment_id", assessment_id).execute().data[0]

@router.patch("/{assessment_id}/activate")
def activate_assessment(assessment_id: str, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    
    # Validate questions exist and marks sum matches total_marks
    asm_res = client.table("assessments").select("total_marks, skill_id").eq("assessment_id", assessment_id).execute()
    if not asm_res.data:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    total_marks = asm_res.data[0]["total_marks"]
    main_skill_id = asm_res.data[0]["skill_id"]
    
    q_res = client.table("assessment_questions").select("marks, skill_id").eq("assessment_id", assessment_id).execute()
    if not q_res.data:
        raise HTTPException(status_code=400, detail="Cannot activate assessment with zero questions.")
        
    sum_marks = sum(q["marks"] for q in q_res.data)
    if sum_marks != total_marks:
        raise HTTPException(status_code=400, detail=f"Cannot activate: Sum of question marks ({sum_marks}) does not match assessment total_marks ({total_marks}).")
        
    client.table("assessments").update({"is_active": True}).eq("assessment_id", assessment_id).execute()
    
    # Check for coverage warnings
    warning = None
    if main_skill_id:
        topic_res = client.table("skill_topic_weights").select("child_skill_id").eq("parent_skill_id", main_skill_id).execute()
        if topic_res.data:
            expected_topics = set(t["child_skill_id"] for t in topic_res.data)
            actual_topics = set(q["skill_id"] for q in q_res.data if q["skill_id"])
            missing = expected_topics - actual_topics
            if missing:
                warning = f"Warning: Assessment activated, but {len(missing)} sub-topics have zero questions."
    
    resp = {"message": "Assessment activated"}
    if warning:
        resp["warning"] = warning
    return resp

@router.patch("/{assessment_id}/deactivate")
def deactivate_assessment(assessment_id: str, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    client.table("assessments").update({"is_active": False}).eq("assessment_id", assessment_id).execute()
    return {"message": "Assessment deactivated"}

@router.get("/{assessment_id}/coverage-preview")
def preview_coverage(assessment_id: str, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    asm_res = client.table("assessments").select("skill_id").eq("assessment_id", assessment_id).execute()
    if not asm_res.data:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    main_skill_id = asm_res.data[0]["skill_id"]
    if not main_skill_id:
        return {"topics": [], "message": "Assessment has no main skill assigned."}
        
    topic_res = client.table("skill_topic_weights").select("child_skill_id, skills!child_skill_id(name)").eq("parent_skill_id", main_skill_id).execute()
    q_res = client.table("assessment_questions").select("skill_id").eq("assessment_id", assessment_id).execute()
    
    question_counts = {}
    for q in q_res.data:
        sid = q["skill_id"]
        if sid:
            question_counts[sid] = question_counts.get(sid, 0) + 1
            
    coverage = []
    for t in topic_res.data:
        cid = t["child_skill_id"]
        coverage.append({
            "skill_id": cid,
            "name": t["skills"]["name"],
            "question_count": question_counts.get(cid, 0)
        })
        
    return {"topics": coverage}

@router.get("")
def list_assessments(staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    # Only list assessments created by this staff/institution. RLS handles visibility if policy set.
    # Otherwise, filter by created_by. For simplicity, filtering by created_by here.
    res = client.table("assessments").select("*, assessment_questions(count), assessment_results(count)").eq("created_by", staff["user_id"]).execute()
    return res.data

@router.delete("/{assessment_id}")
def delete_assessment(assessment_id: str, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    res_count = client.table("assessment_results").select("result_id", count="exact").eq("assessment_id", assessment_id).execute()
    if res_count.count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete assessment that has student attempts. Deactivate instead.")
        
    client.table("assessments").delete().eq("assessment_id", assessment_id).execute()
    return {"message": "Assessment deleted"}

# --- MODULE 2: Question Bank Management ---

def check_active_lock(client, assessment_id: str):
    res = client.table("assessments").select("is_active").eq("assessment_id", assessment_id).execute()
    if res.data and res.data[0]["is_active"]:
        raise HTTPException(status_code=400, detail="Cannot modify questions while assessment is active.")

@router.post("/{assessment_id}/questions")
def add_question(assessment_id: str, data: AssessmentQuestionCreate, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    check_active_lock(client, assessment_id)
    
    asm_res = client.table("assessments").select("skill_id").eq("assessment_id", assessment_id).execute()
    if not asm_res.data:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    main_skill_id = asm_res.data[0]["skill_id"]
    if main_skill_id and data.skill_id != main_skill_id:
        # Check if it's a valid subtopic
        topic_res = client.table("skill_topic_weights").select("child_skill_id").eq("parent_skill_id", main_skill_id).eq("child_skill_id", data.skill_id).execute()
        if not topic_res.data:
            raise HTTPException(status_code=400, detail="Provided skill_id is not a valid subtopic of the assessment's skill.")
            
    res = client.table("assessment_questions").insert({
        "assessment_id": assessment_id,
        "skill_id": data.skill_id,
        "question": data.question,
        "question_type": data.question_type,
        "options": data.options,
        "correct_answer": data.correct_answer,
        "marks": data.marks,
        "difficulty": data.difficulty
    }).execute()
    return res.data[0]

@router.patch("/{assessment_id}/questions/{question_id}")
def update_question(assessment_id: str, question_id: str, data: AssessmentQuestionUpdate, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    check_active_lock(client, assessment_id)
    
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if update_data:
        res = client.table("assessment_questions").update(update_data).eq("question_id", question_id).execute()
        return res.data[0]
    return {"message": "No changes requested"}

@router.delete("/{assessment_id}/questions/{question_id}")
def delete_question(assessment_id: str, question_id: str, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    check_active_lock(client, assessment_id)
    
    client.table("assessment_questions").delete().eq("question_id", question_id).execute()
    return {"message": "Question deleted"}

@router.get("/{assessment_id}/questions")
def list_questions_for_management(assessment_id: str, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    # This explicitly returns correct_answer because it's the authoring surface
    res = client.table("assessment_questions").select("*").eq("assessment_id", assessment_id).execute()
    return res.data

# --- MODULE 3b: Manual Grading ---

@router.get("/{assessment_id}/results/{result_id}/pending-review")
def get_pending_review(assessment_id: str, result_id: str, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    # Fetch answers for short_answer questions that are ungraded (marks_awarded is null)
    res = client.table("assessment_answers").select(
        "answer_id, question_id, submitted_answer, assessment_questions!inner(question_type)"
    ).eq("result_id", result_id).eq("assessment_questions.question_type", "short_answer").is_("marks_awarded", "null").execute()
    return res.data

@router.patch("/{assessment_id}/results/{result_id}/grade")
def submit_manual_grades(assessment_id: str, result_id: str, data: GradeUpdate, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    
    # 1. Update grades for the specified questions (assuming assessment_answers table or similar logic).
    # 2. Recompute the attempt's final score/percentage.
    
    # Fetch result
    res = client.table("assessment_results").select("score, assessments(total_marks)").eq("result_id", result_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Result not found")
        
    result_data = res.data[0]
    total_marks = result_data["assessments"]["total_marks"]
    current_score = result_data.get("score") or 0.0
    
    # Add manual marks
    added_marks = sum(g.marks for g in data.grades)
    new_score = current_score + added_marks
    new_percentage = (new_score / total_marks) * 100 if total_marks > 0 else 0
    
    client.table("assessment_results").update({
        "score": new_score,
        "percentage": new_percentage
    }).eq("result_id", result_id).execute()
    
    # Also update the assessment_answers table with the awarded marks
    for g in data.grades:
        client.table("assessment_answers").update({
            "marks_awarded": g.marks
        }).eq("result_id", result_id).eq("question_id", g.question_id).execute()
    
    # Call Module 4 evidence write-back now that grading is finalized
    record_assessment_evidence(client, result_id)
    
    return {"message": "Manual grading complete, evidence recorded"}

# --- MODULE 5: Results & History (Analytics) ---

@router.get("/{assessment_id}/analytics")
def get_assessment_analytics(assessment_id: str, staff: dict = Depends(get_current_assessment_staff)):
    client = staff["client"]
    res = client.table("assessment_results").select("score, percentage, attempt_number, completed_at").eq("assessment_id", assessment_id).not_.is_("completed_at", "null").execute()
    
    results = res.data
    total_attempts = len(results)
    if total_attempts == 0:
        return {"average_score": 0, "average_percentage": 0, "total_attempts": 0}
        
    avg_score = sum(r["score"] for r in results if r["score"] is not None) / total_attempts
    avg_pct = sum(r["percentage"] for r in results if r["percentage"] is not None) / total_attempts
    
    return {
        "assessment_id": assessment_id,
        "total_attempts": total_attempts,
        "average_score": avg_score,
        "average_percentage": avg_pct
    }
