from fastapi import APIRouter, Depends, status, Response, HTTPException
from models.domain import Project, AgentProfile, TargetModel, SimulationRun, StatsResponse, User
from schemas.requests import ProjectCreate, ProjectUpdate, AgentCreate, TargetModelCreate, SimulationCreate, TargetModelUpdate, AgentUpdate
from utils.common import now_utc
from services.auth_service import get_authenticated_user, get_project_or_404, assert_project_owner
from utils.supabase_client import supabase

router = APIRouter()

@router.get("/projects", response_model=list[Project])
def list_projects(user: User = Depends(get_authenticated_user)) -> list[Project]:
    proj_resp = supabase.table("projects").select("*").eq("owner_id", user.id).execute()
    projects_list = []

    for pdata in proj_resp.data or []:
        projects_list.append(Project(**pdata))

    return projects_list

@router.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    user: User = Depends(get_authenticated_user),
) -> Project:
    timestamp = now_utc().isoformat()
    
    p_data = {
        "owner_id": user.id,
        "name": payload.name,
        "context": {},
        "stats": {},
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    resp = supabase.table("projects").insert(p_data).execute()
    return Project(**resp.data[0])

@router.get("/projects/{project_id}", response_model=Project)
def get_project(project_id: str, user: User = Depends(get_authenticated_user)) -> Project:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project

@router.put("/projects/{project_id}", response_model=Project)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    user: User = Depends(get_authenticated_user),
) -> Project:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    update_data = {"updated_at": now_utc().isoformat()}
    if payload.name: update_data["name"] = payload.name
    if payload.context: update_data["context"] = payload.context.model_dump()
    
    supabase.table("projects").update(update_data).eq("id", project_id).execute()
    return get_project_or_404(project_id)

@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> Response:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    #supabase.table("simulations").delete().eq("project_id", project_id).execute()
    #supabase.table("agent_profiles").delete().eq("project_id", project_id).execute()
    #supabase.table("target_models").delete().eq("project_id", project_id).execute()
    supabase.table("projects").delete().eq("id", project_id).execute()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Target Models Sub-resources ---

@router.get("/projects/{project_id}/models", response_model=list[TargetModel])
def list_project_models(project_id: str, user: User = Depends(get_authenticated_user)) -> list[TargetModel]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    resp = supabase.table("target_models").select("*").eq("project_id", project_id).execute()
    return [TargetModel(**row) for row in resp.data]

@router.post("/projects/{project_id}/models", response_model=TargetModel, status_code=status.HTTP_201_CREATED)
def add_project_model(project_id: str, payload: TargetModelCreate, user: User = Depends(get_authenticated_user)) -> TargetModel:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    tmodel_data = {
         "project_id": project_id,
         **payload.model_dump()
    }
    resp = supabase.table("target_models").insert(tmodel_data).execute()
    supabase.table("projects").update({"updated_at": now_utc().isoformat()}).eq("id", project_id).execute()
    return TargetModel(**resp.data[0])

@router.put("/projects/{project_id}/models/{model_id}", response_model=TargetModel)
def update_project_model(project_id: str, model_id: str, payload: TargetModelUpdate, user: User = Depends(get_authenticated_user)) -> TargetModel:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        resp = supabase.table("target_models").select("*").eq("id", model_id).eq("project_id", project_id).execute()
        if not resp.data: raise HTTPException(status_code=404, detail="Model not found")
        return TargetModel(**resp.data[0])
        
    resp = supabase.table("target_models").update(update_data).eq("id", model_id).eq("project_id", project_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Model not found")
        
    supabase.table("projects").update({"updated_at": now_utc().isoformat()}).eq("id", project_id).execute()
    return TargetModel(**resp.data[0])

@router.delete("/projects/{project_id}/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_model(project_id: str, model_id: str, user: User = Depends(get_authenticated_user)) -> Response:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    supabase.table("agent_profiles").delete().eq("model_id", model_id).eq("project_id", project_id).execute()
    supabase.table("target_models").delete().eq("id", model_id).eq("project_id", project_id).execute()
    
    supabase.table("projects").update({"updated_at": now_utc().isoformat()}).eq("id", project_id).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Agents Sub-resources ---

@router.get("/projects/{project_id}/agents", response_model=list[AgentProfile])
def list_project_agents(project_id: str, user: User = Depends(get_authenticated_user)):
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)

    resp = (
        supabase.table("agent_profiles")
        .select("*, target_models!inner(project_id)")
        .eq("target_models.project_id", project_id)
        .execute()
    )

    agents = []
    for row in resp.data:
        row.pop("target_models", None) 
        agents.append(AgentProfile(**row))

    return agents

@router.post("/projects/{project_id}/agents", response_model=AgentProfile, status_code=status.HTTP_201_CREATED)
def add_project_agent(project_id: str, payload: AgentCreate, user: User = Depends(get_authenticated_user)) -> AgentProfile:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    tm_resp = supabase.table("target_models").select("id").eq("id", payload.model_id).eq("project_id", project_id).execute()
    if not tm_resp.data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="model_id no fue encontrado en este proyecto")
        
    agent_data = {
         "project_id": project_id,
         **payload.model_dump()
    }
    resp = supabase.table("agent_profiles").insert(agent_data).execute()
    supabase.table("projects").update({"updated_at": now_utc().isoformat()}).eq("id", project_id).execute()
    return AgentProfile(**resp.data[0])

@router.put("/projects/{project_id}/agents/{agent_id}", response_model=AgentProfile)
def update_project_agent(project_id: str, agent_id: str, payload: AgentUpdate, user: User = Depends(get_authenticated_user)) -> AgentProfile:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    update_data = payload.model_dump(exclude_unset=True)
    if "model_id" in update_data:
        tm_resp = supabase.table("target_models").select("id").eq("id", payload.model_id).eq("project_id", project_id).execute()
        if not tm_resp.data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="model_id no fue encontrado en este proyecto")
            
    if not update_data:
        resp = supabase.table("agent_profiles").select("*").eq("id", agent_id).eq("project_id", project_id).execute()
        if not resp.data: raise HTTPException(status_code=404, detail="Agent not found")
        return AgentProfile(**resp.data[0])
        
    resp = supabase.table("agent_profiles").update(update_data).eq("id", agent_id).eq("project_id", project_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    supabase.table("projects").update({"updated_at": now_utc().isoformat()}).eq("id", project_id).execute()
    return AgentProfile(**resp.data[0])

@router.delete("/projects/{project_id}/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_agent(project_id: str, agent_id: str, user: User = Depends(get_authenticated_user)) -> Response:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    supabase.table("agent_profiles").delete().eq("id", agent_id).eq("project_id", project_id).execute()
    supabase.table("projects").update({"updated_at": now_utc().isoformat()}).eq("id", project_id).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Stats Sub-resources ---

@router.get("/projects/{project_id}/stats", response_model=StatsResponse)
def get_project_stats(project_id: str, user: User = Depends(get_authenticated_user)) -> StatsResponse:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project.stats

# --- Simulations Sub-resources ---

@router.get("/projects/{project_id}/simulations", response_model=list[SimulationRun])
def list_simulations(project_id: str, user: User = Depends(get_authenticated_user)) -> list[SimulationRun]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    resp = supabase.table("simulation_runs").select("*").eq("project_id", project_id).execute()
    return [SimulationRun(**row) for row in resp.data]

@router.post("/projects/{project_id}/simulations", response_model=SimulationRun, status_code=status.HTTP_202_ACCEPTED)
def create_simulation(project_id: str, payload: SimulationCreate, user: User = Depends(get_authenticated_user)) -> SimulationRun:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    timestamp = now_utc().isoformat()
    run_data = {
        "id": new_id("run"),
        "project_id": project_id,
        "scenario_name": payload.scenario_name,
        "provider": payload.provider,
        "status": 2,
        "questions": payload.questions,
        "overrides": payload.overrides,
        "agents_snapshot": [m.model_dump() for m in project.agents],
        "started_at": timestamp,
        "completed_at": timestamp,
        "summary": "Simulación mockeada en supabase."
    }
    resp = supabase.table("simulations").insert(run_data).execute()
    supabase.table("projects").update({"updated_at": timestamp}).eq("id", project_id).execute()
    return SimulationRun(**resp.data[0])

@router.post("/projects/{project_id}/runs", response_model=SimulationRun, status_code=status.HTTP_202_ACCEPTED)
def create_run_alias(project_id: str, payload: SimulationCreate, user: User = Depends(get_authenticated_user)) -> SimulationRun:
    return create_simulation(project_id, payload, user=user)

@router.get("/projects/{project_id}/runs", response_model=list[SimulationRun])
def list_runs_alias(project_id: str, user: User = Depends(get_authenticated_user)) -> list[SimulationRun]:
    return list_simulations(project_id, user=user)
