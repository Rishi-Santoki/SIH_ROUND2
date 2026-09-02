from fastapi import APIRouter, Depends
from supabase import Client
from app.dependencies import get_db_client

router = APIRouter(prefix="/platform", tags=["Platform Settings"])

@router.get("/matching-methodology")
def get_matching_methodology(client: Client = Depends(get_db_client)):
    # 1. Fetch current weights
    settings_res = client.table("platform_settings").select("setting_key, setting_value").in_("setting_key", ["match_score_weights", "weights_version"]).execute()
    
    weights = {
        "skills": 0.40,
        "assessments": 0.20,
        "projects": 0.15,
        "eligibility": 0.10,
        "career_interest": 0.15
    }
    
    version = 1
    
    for row in settings_res.data:
        if row["setting_key"] == "match_score_weights":
            weights = row["setting_value"]
        elif row["setting_key"] == "weights_version":
            version = int(row["setting_value"])
            
    # 2. Descriptions matching the Ingestion Pipeline seeding logic
    descriptions = {
        "skills": "Measures how well the candidate's skills align with the requirements of the opportunity, considering required proficiency levels and mandatory flags.",
        "assessments": "Reflects verified evidence from platform assessments, validating the candidate's self-reported skill proficiencies.",
        "projects": "Evaluates hands-on experience and real-world application demonstrated through completed project portfolios.",
        "eligibility": "Confirms baseline criteria such as degree program, availability, and CGPA requirements.",
        "career_interest": "Assesses alignment between the opportunity's domain and the student's stated long-term career goals."
    }
    
    return {
        "weights_version": version,
        "weights": weights,
        "descriptions": descriptions
    }
