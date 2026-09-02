import os
from supabase import create_client

def main():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return
        
    client = create_client(supabase_url, supabase_key)
    
    # Let's seed an example for Python
    # Python is an existing skill in the DB (usually from seed_data.sql)
    # We will find "Python" skill
    res = client.table("skills").select("skill_id").eq("name", "Python").execute()
    if not res.data:
        print("Skill 'Python' not found in database. Please seed the skills first.")
        return
        
    parent_id = res.data[0]["skill_id"]
    
    # Topics to create
    topics = [
        {"name": "Python Data Types", "description": "Strings, lists, dicts, ints, etc.", "weight": 0.2, "mandatory": True},
        {"name": "Python OOP", "description": "Classes, inheritance, polymorphism.", "weight": 0.4, "mandatory": True},
        {"name": "Python AsyncIO", "description": "Asynchronous programming.", "weight": 0.1, "mandatory": False},
        {"name": "Python Decorators", "description": "Decorators and closures.", "weight": 0.3, "mandatory": True}
    ]
    
    for t in topics:
        # Check if topic already exists
        child_res = client.table("skills").select("skill_id").eq("name", t["name"]).execute()
        if not child_res.data:
            ins = client.table("skills").insert({
                "name": t["name"],
                "description": t["description"],
                "parent_skill_id": parent_id
            }).execute()
            child_id = ins.data[0]["skill_id"]
        else:
            child_id = child_res.data[0]["skill_id"]
            
        # Create weight
        weight_res = client.table("skill_topic_weights").select("*").eq("parent_skill_id", parent_id).eq("child_skill_id", child_id).execute()
        if not weight_res.data:
            client.table("skill_topic_weights").insert({
                "parent_skill_id": parent_id,
                "child_skill_id": child_id,
                "weight": t["weight"],
                "is_mandatory": t["mandatory"]
            }).execute()
            print(f"Added topic weight for {t['name']}")
        else:
            print(f"Topic weight for {t['name']} already exists.")
            
    print("Seeding completed successfully.")

if __name__ == "__main__":
    main()
