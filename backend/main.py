from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

# Fix relative imports when running from root folder
sys.path.insert(0, str(Path(__file__).resolve().parent))

from routes import health, users, projects, auth, api_llm

app = FastAPI(
    title="Romeo Samsung API",
    version="0.1.0",
    description="API base para usuarios, proyectos y simulaciones de focus groups con IA.",
)

# Enable CORS for React frontend (Vite's default is 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(api_llm.router)
