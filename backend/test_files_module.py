from fastapi.testclient import TestClient
from app.main import app
import pytest

client = TestClient(app)

def test_files_router_exists():
    """Verify the files router was successfully attached to the app."""
    # Since we need auth, it should return 401, not 404
    response = client.post("/files/upload", data={"context": "resume"})
    assert response.status_code != 404, "Files upload endpoint is missing"
    assert response.status_code == 401, "Files upload endpoint should require authentication"

def test_get_signed_url_exists():
    response = client.get("/files/signed-url?bucket=resumes&path=test/file.pdf")
    assert response.status_code != 404, "Signed URL endpoint is missing"
    assert response.status_code == 401, "Signed URL endpoint should require authentication"

def test_delete_file_exists():
    response = client.delete("/files?bucket=resumes&path=test/file.pdf")
    assert response.status_code != 404, "Delete endpoint is missing"
    assert response.status_code == 401, "Delete endpoint should require authentication"
