import os
import sys
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_key:
    sys.exit("Error: SUPABASE_SERVICE_ROLE_KEY not found.")

supabase = create_client(supabase_url, supabase_key)

# Get Kabir's application
kabir_app = supabase.table("applications").select("*").eq("match_score", "88").execute()

if kabir_app.data:
    app_id = kabir_app.data[0]["application_id"]
    
    # Check if tracking exists
    existing = supabase.table("internship_tracking").select("*").eq("application_id", app_id).execute()
    if not existing.data:
        supabase.table("internship_tracking").insert({
            "application_id": app_id, "milestone": "Mid-term Evaluation",
            "status": "in_progress", "mentor_feedback": "Doing well, progressing on tasks.", "mentor_rating": 4
        }).execute()
        print("Inserted internship tracking for Kabir.")
    else:
        print("Internship tracking already exists.")
else:
    print("Kabir's application not found.")
