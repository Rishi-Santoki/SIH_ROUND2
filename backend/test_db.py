import json
from app.dependencies import get_service_client
c = get_service_client()
with open("C:/Users/LENOVO/.gemini/antigravity-ide/brain/e7c20bbf-4a51-4b77-953d-b8b2b8e25e2b/scratch/tokens.json") as f:
    t = json.load(f)["student_a"]
import jwt
uid = jwt.decode(t, options={"verify_signature": False})["sub"]
print(f"UID: {uid}")
res = c.table("users").select("*").eq("user_id", uid).execute()
print(res.data)
