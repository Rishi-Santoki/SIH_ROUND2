from fastapi import APIRouter, Depends
from supabase import Client
from typing import Optional
from app.dependencies import get_db_client, get_current_institution_admin

router = APIRouter(prefix="/institution/reports", tags=["Institution Reports"])

@router.get("/summary")
def get_summary_report(format: Optional[str] = "json", admin: dict = Depends(get_current_institution_admin)):
    institution_id = admin["institution_id"]
    client: Client = admin["client"]
    
    # Example report combining metrics
    students_res = client.table("student_profiles").select("student_id, current_year, department").eq("institution_id", institution_id).execute()
    total_students = len(students_res.data)
    
    # At-risk
    at_risk_count = sum(1 for s in students_res.data if s["current_year"] in [3, 4]) # Naive proxy for MVP
    
    # In a real scenario, this would aggregate data heavily or trigger a background job to generate a CSV/PDF
    report = {
        "institution_id": institution_id,
        "total_students": total_students,
        "at_risk_students_flagged": at_risk_count,
        "summary": "Institution analytics summary report."
    }
    
    if format == "csv":
        import io
        import csv
        from fastapi import Response
        from app.core.matching import get_skill_gaps, calculate_readiness_percentage

        # Fetch detailed students for rich real CSV
        st_res = client.table("student_profiles").select("student_id, current_year, department, target_career_id, users(full_name, email)").eq("institution_id", institution_id).execute()
        
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Student ID", "Full Name", "Email", "Department", "Current Year", "Readiness (%)", "Status"])
        
        for s in (st_res.data or []):
            u = s.get("users") or {}
            readiness = 0.0
            if s.get("target_career_id"):
                gaps = get_skill_gaps(client, s["student_id"], s["target_career_id"])
                readiness = calculate_readiness_percentage(gaps)
            
            status_label = "Placement Ready" if readiness >= 70 else ("At-Risk" if readiness < 40 else "Developing")
            writer.writerow([
                s.get("student_id"),
                u.get("full_name", "Student"),
                u.get("email", ""),
                s.get("department", "General"),
                f"Year {s.get('current_year', 1)}",
                f"{round(readiness, 1)}%",
                status_label
            ])
            
        csv_content = output.getvalue()
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=institution_master_report.csv"
            }
        )
        
    return report
