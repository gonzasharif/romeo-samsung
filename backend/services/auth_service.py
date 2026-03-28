from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.db import USERS, PROJECTS
from models.domain import User, Project
from utils.supabase_client import supabase

security = HTTPBearer()

def get_user_or_404(user_id: str) -> User:
    user = USERS.get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

def get_project_or_404(project_id: str) -> Project:
    project = PROJECTS.get(project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

def get_authenticated_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
        user_id = user_response.user.id
        
        user = USERS.get(user_id)
        if not user:
            from models.domain import CompanyProfile
            from utils.common import now_utc
            meta = user_response.user.user_metadata or {}
            user = User(
                id=user_id,
                full_name=meta.get("full_name", "Usuario"),
                email=user_response.user.email or "",
                company=CompanyProfile(name=meta.get("company_name", "Empresa")),
                created_at=now_utc(),
                updated_at=now_utc()
            )
            USERS[user_id] = user
            
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

def assert_project_owner(project: Project, user: User) -> None:
    if project.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
