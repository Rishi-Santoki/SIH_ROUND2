import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env")
    sys.exit(1)

client = create_client(url, key)

print("--- Running Test ---")
from backend.app.routers.admin_matching import propose_weight_adjustment

# First we need an opportunity and students. Let's assume the DB has some from earlier seeding
# Let's hit the logic from seed_outcomes.py first
print("Seeding outcomes...")
from backend.app.routers.seed_outcomes import seed_outcomes
res = seed_outcomes({"client": client, "user_id": "test_admin"})
print(res)

print("Proposing weight adjustment...")
prop = propose_weight_adjustment(client)
print(prop)
