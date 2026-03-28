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
    except (ValueError, TypeError):
        company_data = {"name": data.get("company") or "Empresa"}

    if not isinstance(company_data, dict):
        company_data = {"name": str(company_data)}
    if "name" not in company_data:
        company_data["name"] = "Empresa"

    data["company"] = company_data
    
    # Aseguramos que los timestamps nunca falten
    from utils.common import now_utc
    data["created_at"] = data.get("created_at") or now_utc().isoformat()
    data["updated_at"] = data.get("updated_at") or now_utc().isoformat()
    data["full_name"] = data.get("full_name") or "Usuario"
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
        
        return get_user_or_404(user_response.user.id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

def assert_project_owner(project: Project, user: User) -> None:
    if project.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
