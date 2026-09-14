import os, sys
from dotenv import load_dotenv
load_dotenv(r"c:\Users\LENOVO\OneDrive\Desktop\SIH_ROUND2\backend\.env")
from supabase import create_client
url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
sb = create_client(url, key)
try:
    res = sb.auth.admin.create_user({"email": "student_b_test@ldrp.ac.in", "password": "TestPassword123!", "email_confirm": True})
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
