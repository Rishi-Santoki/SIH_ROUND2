import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"
DIST_DIR = FRONTEND_DIR / "dist"

def ensure_frontend_built():
    """Build frontend if dist doesn't exist."""
    if not (DIST_DIR / "index.html").exists():
        print("[*] Building frontend assets...")
        cmd = "npm run build" if sys.platform != "win32" else "cmd /c npx vite build"
        subprocess.run(cmd, cwd=str(FRONTEND_DIR), shell=True, check=True)
        print("[+] Frontend build completed successfully.")

def main():
    ensure_frontend_built()
    
    # Add backend directory to sys.path so app modules import cleanly
    sys.path.insert(0, str(BACKEND_DIR))
    os.chdir(str(BACKEND_DIR))

    host = "127.0.0.1"
    port = 8000
    single_link = f"http://localhost:{port}"

    print("=" * 64)
    print("  ACADEMIA-INDUSTRY COLLABORATION PLATFORM")
    print("=" * 64)
    print(f"  --> Unified URL (Frontend & Backend): {single_link}")
    print(f"  --> Frontend UI:                      {single_link}/")
    print(f"  --> Backend Interactive API Docs:     {single_link}/docs")
    print(f"  --> Backend ReDoc:                    {single_link}/redoc")
    print(f"  --> Health Check:                     {single_link}/health")
    print("=" * 64)
    print("Starting server... Press Ctrl+C to stop.\n")

    import uvicorn
    uvicorn.run("app.main:app", host=host, port=port, log_level="info")

if __name__ == "__main__":
    main()
