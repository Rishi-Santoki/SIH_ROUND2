from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv
import os

ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"
if ENV_FILE.exists():
    load_dotenv(str(ENV_FILE))

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://bxvjouemddbwxvbmuyoh.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dmpvdWVtZGRid3h2Ym11eW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxNTQ1MTksImV4cCI6MjEwMzczMDUxOX0.4rO4nWBoId7cMpIXSz9pBqySW9XsziB1acqO2eKit9o")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    class Config:
        env_file = str(ENV_FILE)
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
