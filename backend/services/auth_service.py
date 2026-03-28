from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.domain import User, Project
from utils.supabase_client import supabase
import json

security = HTTPBearer()

def get_user_or_404(user_id: str) -> User:
    response = supabase.table("users").select("*").eq("id", user_id).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    data = response.data[0]
    
    try:
        if isinstance(data.get("company"), str):
            company_data = json.loads(data["company"])
        else:
            company_data = data.get("company") or {}
    except json.JSONDecodeError:
        company_data = {"name": data.get("company")}

    data["company"] = company_data
    return User(**data)

def get_project_or_404(project_id: str) -> Project:
    proj_resp = supabase.table("projects").select("*").eq("id", project_id).execute()
    if not proj_resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    proj_data = proj_resp.data[0]
    
    tm_resp = supabase.table("target_models").select("*").eq("project_id", project_id).execute()
    ag_resp = supabase.table("agents").select("*").eq("project_id", project_id).execute()
    sim_resp = supabase.table("simulations").select("*").eq("project_id", project_id).execute()
    
    proj_data["target_models"] = tm_resp.data
    proj_data["agents"] = ag_resp.data
    proj_data["simulations"] = sim_resp.data
    
    return Project(**proj_data)

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
        return get_user_or_404(user_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

def assert_project_owner(project: Project, user: User) -> None:
    if project.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
