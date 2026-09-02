from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from app.dependencies import get_current_student
from app.models.assessment_schemas import (
    StudentQuestionOut, AssessmentSubmit, AssessmentResultOut
)
from app.core.assessments import record_assessment_evidence

router = APIRouter(prefix="/student/assessments", tags=["Student Assessments"])

@router.get("/available")
def list_available_assessments(assessment_type: Optional[str] = None, skill_id: Optional[str] = None, student: dict = Depends(get_current_student)):
    client = student["client"]
    query = client.table("assessments").select("assessment_id, title, description, assessment_type, duration_minutes, total_marks, skill_id").eq("is_active", True)
    
    if assessment_type:
        query = query.eq("assessment_type", assessment_type)
    if skill_id:
        query = query.eq("skill_id", skill_id)
        
    res = query.execute()
    return res.data

@router.post("/{assessment_id}/start", response_model=AssessmentResultOut)
def start_assessment(assessment_id: str, student: dict = Depends(get_current_student)):
    client = student["client"]
    student_id = student["user_id"]
    
    # 1. Check if an attempt is already in progress
    in_prog = client.table("assessment_results").select("result_id").eq("student_id", student_id).eq("assessment_id", assessment_id).is_("completed_at", "null").execute()
    if in_prog.data:
        raise HTTPException(status_code=400, detail="An attempt is already in progress.")
        
    # 2. Get attempt count
    attempts = client.table("assessment_results").select("result_id", count="exact").eq("student_id", student_id).eq("assessment_id", assessment_id).execute()
    attempt_number = attempts.count + 1
    
    # 3. Create attempt
    res = client.table("assessment_results").insert({
        "student_id": student_id,
        "assessment_id": assessment_id,
        "started_at": datetime.now().isoformat(),
        "attempt_number": attempt_number
    }).execute()
    
    return res.data[0]

@router.get("/{assessment_id}/questions", response_model=List[StudentQuestionOut])
def get_assessment_questions(assessment_id: str, student: dict = Depends(get_current_student)):
    client = student["client"]
    student_id = student["user_id"]
    
    # Check in-progress attempt and timer
    res = client.table("assessment_results").select("result_id, started_at, assessments(duration_minutes)").eq("student_id", student_id).eq("assessment_id", assessment_id).is_("completed_at", "null").execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="No active attempt found. Start the assessment first.")
        
    attempt = res.data[0]
    started_at = datetime.fromisoformat(attempt["started_at"])
    duration = attempt["assessments"]["duration_minutes"]
    
    elapsed = (datetime.now() - started_at).total_seconds() / 60.0
    if elapsed > duration:
        raise HTTPException(status_code=403, detail="time_expired")
        
    # Fetch questions
    # CRITICAL: Exclude correct_answer from select clause, and use StudentQuestionOut schema which doesn't have it.
    from app.dependencies import get_service_client
    service_client = get_service_client()
    q_res = service_client.table("assessment_questions").select("question_id, assessment_id, question, question_type, options, marks, difficulty").eq("assessment_id", assessment_id).execute()
    
    return q_res.data

@router.post("/{assessment_id}/submit")
def submit_assessment(assessment_id: str, data: AssessmentSubmit, student: dict = Depends(get_current_student)):
    client = student["client"]
    student_id = student["user_id"]
    
    res = client.table("assessment_results").select("result_id, started_at, assessments(duration_minutes, total_marks)").eq("student_id", student_id).eq("assessment_id", assessment_id).is_("completed_at", "null").execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="No active attempt found.")
        
    attempt = res.data[0]
    result_id = attempt["result_id"]
    started_at = datetime.fromisoformat(attempt["started_at"])
    duration = attempt["assessments"]["duration_minutes"]
    total_marks = attempt["assessments"]["total_marks"]
    
    # Auto-submit enforcement on timer expiry
    elapsed = (datetime.now() - started_at).total_seconds() / 60.0
    
    if elapsed > duration:
        # Time expired, no score awarded for late submission since answers weren't synced incrementally
        client.table("assessment_results").update({
            "score": 0,
            "percentage": 0,
            "completed_at": datetime.now().isoformat()
        }).eq("result_id", result_id).execute()
        
        record_assessment_evidence(client, result_id)
        return {"message": "Time expired before submission. Score is 0.", "score": 0, "percentage": 0}
        
    # Auto-grading
    from app.dependencies import get_service_client
    service_client = get_service_client()
    questions_res = service_client.table("assessment_questions").select("question_id, question_type, correct_answer, marks").eq("assessment_id", assessment_id).execute()
    q_map = {q["question_id"]: q for q in questions_res.data}
    
    score = 0
    needs_manual_review = False
    
    answer_inserts = []
    
    for ans in data.answers:
        qid = ans.question_id
        q = q_map.get(qid)
        if not q: continue
        
        qtype = q["question_type"]
        submitted = ans.submitted_answer
        
        marks_awarded = None
        is_correct = False
        
        if qtype in ("mcq", "true_false"):
            if submitted == q["correct_answer"]:
                marks_awarded = q["marks"]
                score += marks_awarded
                is_correct = True
            else:
                marks_awarded = 0
                is_correct = False
        elif qtype == "short_answer":
            needs_manual_review = True
            
        answer_inserts.append({
            "result_id": result_id,
            "question_id": qid,
            "submitted_answer": submitted,
            "marks_awarded": marks_awarded,
            "is_correct": is_correct
        })
        
    # Insert answers
    if answer_inserts:
        client.table("assessment_answers").insert(answer_inserts).execute()
        
    # Update result
    percentage = (score / total_marks) * 100 if total_marks > 0 else 0
    client.table("assessment_results").update({
        "score": score,
        "percentage": percentage,
        "completed_at": datetime.now().isoformat()
    }).eq("result_id", result_id).execute()
    
    if not needs_manual_review:
        record_assessment_evidence(client, result_id)
        return {"message": "Assessment submitted and auto-graded.", "score": score, "percentage": percentage}
    else:
        return {"message": "Assessment submitted. Pending manual review for short answers."}

@router.get("/results")
def list_results(student: dict = Depends(get_current_student)):
    client = student["client"]
    student_id = student["user_id"]
    res = client.table("assessment_results").select("*, assessments(title)").eq("student_id", student_id).not_.is_("completed_at", "null").execute()
    return res.data

@router.get("/{assessment_id}/results/{result_id}")
def get_result_details(assessment_id: str, result_id: str, student: dict = Depends(get_current_student)):
    client = student["client"]
    student_id = student["user_id"]
    
    res = client.table("assessment_results").select("score, percentage, attempt_number, completed_at, student_id").eq("result_id", result_id).execute()
    if not res.data or res.data[0]["student_id"] != student_id:
        raise HTTPException(status_code=404, detail="Result not found")
        
    ans_res = client.table("assessment_answers").select(
        "submitted_answer, marks_awarded, is_correct, assessment_questions!inner(question, question_type)"
    ).eq("result_id", result_id).execute()
        
    return {
        "result": res.data[0],
        "answers": ans_res.data
    }
