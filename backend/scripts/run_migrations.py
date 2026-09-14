import os
import psycopg2

db_url = "postgresql://postgres.bxvjouemddbwxvbmuyoh:Admin%4012345@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

migrations_to_run = [
    "../supabase/migrations/20240101000015_super_admin.sql",
    "../supabase/migrations/20240101000024_alumni_directory.sql",
    "../supabase/migrations/20240101000025_community_messaging.sql"
]

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

for migration in migrations_to_run:
    print(f"Applying {migration}...")
    with open(migration, "r") as f:
        sql = f.read()
    try:
        cur.execute(sql)
        print("Success.")
    except Exception as e:
        print(f"Error: {e}")

cur.close()
conn.close()
