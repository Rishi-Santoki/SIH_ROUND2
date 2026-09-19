from fastapi import FastAPI
from app.main import app as core_app

app = FastAPI(
    title=core_app.title,
    description=core_app.description,
    version=core_app.version
)

# Support both /api/... prefixes (forwarded by Vercel) and direct paths
app.mount("/api", core_app)
app.mount("", core_app)
