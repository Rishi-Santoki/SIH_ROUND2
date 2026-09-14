import json, jwt
with open(r"C:\Users\LENOVO\.gemini\antigravity-ide\brain\e7c20bbf-4a51-4b77-953d-b8b2b8e25e2b\scratch\tokens.json") as f:
    t = json.load(f)["student_a"]
print(jwt.get_unverified_header(t))
print(jwt.decode(t, options={"verify_signature": False}))
