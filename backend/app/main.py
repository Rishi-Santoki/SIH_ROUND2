from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    profile,
    skills,
    gaps,
    readiness,
    learning,
    matching,
    applications,
    portfolio,
    notifications,
    copilot,
    student_assessments
)

from app.routers.industry import (
    company as industry_company,
    profile as industry_profile,
    opportunities as industry_opportunities,
    candidates as industry_candidates,
    applications as industry_applications,
    pipeline as industry_pipeline,
    notifications as industry_notifications,
    copilot as industry_copilot
)

from app.routers.academician import (
    profile as academician_profile,
    discover as academician_discover,
    collaborations as academician_collaborations,
    skill_pulse as academician_skill_pulse,
    notifications as academician_notifications,
    copilot as academician_copilot
)

from app.routers.institution import (
    profile as institution_profile,
    students as institution_students,
    analytics as institution_analytics,
    industry as institution_industry,
    interventions as institution_interventions,
    reports as institution_reports,
    notifications as institution_notifications,
    copilot as institution_copilot
)

from app.routers import assessments_manage
from app.routers import super_admin
from app.routers import complaints
from app.routers import admin_knowledge
from app.routers import admin_matching
from app.routers import seed_outcomes
from app.routers import platform
from app.routers import student_alumni
from app.routers import academician_alumni
from app.routers.alumni import profile as alumni_profile
from app.routers.alumni import skills as alumni_skills
from app.routers.alumni import verification as alumni_verification
from app.routers import community_messaging
from app.routers import student_roadmap
app = FastAPI(
    title="Academia-Industry Collaboration Portal - API",
    description="Backend Phase 1-6 API (Student, Industry, Academician, Institution)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path
from starlette.requests import Request
from fastapi.responses import FileResponse

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

NO_CACHE_HEADERS = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
}

@app.middleware("http")
async def serve_spa_on_browser_navigation(request: Request, call_next):
    if request.method == "GET":
        path = request.url.path
        accept = request.headers.get("accept", "")
        # If the browser is requesting a page directly in the address bar
        if (
            "text/html" in accept 
            and not path.startswith(("/docs", "/redoc", "/openapi.json", "/assets", "/files", "/health"))
            and "format=csv" not in str(request.query_params)
            and not path.endswith(".csv")
        ):
            index_file = FRONTEND_DIST / "index.html"
            if index_file.exists():
                return FileResponse(index_file, headers=NO_CACHE_HEADERS)
    return await call_next(request)

from app.routers import auth
from app.routers import files

# Include all module routers
app.include_router(files.router)
app.include_router(auth.router)
app.include_router(admin_knowledge.router)
app.include_router(admin_matching.router)
app.include_router(seed_outcomes.router)
app.include_router(platform.router)
app.include_router(profile.router)
app.include_router(skills.router)
app.include_router(gaps.router)
app.include_router(readiness.router)
app.include_router(learning.router)
app.include_router(matching.router)
app.include_router(applications.router)
app.include_router(portfolio.router)
app.include_router(notifications.router)
app.include_router(copilot.router)
app.include_router(student_assessments.router)
app.include_router(student_alumni.router)
app.include_router(student_roadmap.router)

# Alumni modules
app.include_router(alumni_profile.router)
app.include_router(alumni_skills.router)
app.include_router(alumni_verification.router)

# Industry modules
app.include_router(industry_company.router)
app.include_router(industry_profile.router)
app.include_router(industry_opportunities.router)
app.include_router(industry_candidates.router)
app.include_router(industry_applications.router)
app.include_router(industry_pipeline.router)
app.include_router(industry_notifications.router)
app.include_router(industry_copilot.router)

# Academician modules
app.include_router(academician_profile.router)
app.include_router(academician_collaborations.router)
app.include_router(academician_discover.router)
app.include_router(academician_skill_pulse.router)
app.include_router(academician_notifications.router)
app.include_router(academician_copilot.router)
app.include_router(academician_alumni.router)

# Institution modules
app.include_router(institution_profile.router)
app.include_router(institution_students.router)
app.include_router(institution_analytics.router)
app.include_router(institution_industry.router)
app.include_router(institution_interventions.router)
app.include_router(institution_reports.router)
app.include_router(institution_notifications.router)
app.include_router(institution_copilot.router)

# Staff Management modules
app.include_router(assessments_manage.router)

# Super Admin modules
app.include_router(super_admin.router)

# Shared modules
app.include_router(complaints.router)
app.include_router(community_messaging.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Frontend Integration: Serve both Frontend and Backend on one host
from fastapi.staticfiles import StaticFiles

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    async def serve_root():
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file, headers=NO_CACHE_HEADERS)
        return {"message": "API running. Frontend build not found."}

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file, headers=NO_CACHE_HEADERS)
        return {"error": "Not found"}

