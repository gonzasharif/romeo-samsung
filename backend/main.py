from fastapi import FastAPI
from routes import health, users, projects

app = FastAPI(
    title="Romeo Samsung API",
    version="0.1.0",
    description="API base para usuarios, proyectos y simulaciones de focus groups con IA.",
)

app.include_router(health.router)
app.include_router(users.router)
app.include_router(projects.router)
