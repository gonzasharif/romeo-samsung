from fastapi import APIRouter, Depends, status, Response, HTTPException
import json
from models.domain import Project, TargetModel, SimulationRun, StatsResponse, User
from schemas.requests import ProjectCreate, ProjectUpdate, TargetModelCreate, SimulationCreate, TargetModelUpdate
from utils.common import now_utc
from services.auth_service import get_authenticated_user, get_project_or_404, assert_project_owner
from utils.supabase_client import supabase
from services.api_llm_service import start_model, ask_model, stop_model, create_people_model
import asyncio
import uuid

router = APIRouter()

def normalize_simulation_row(row: dict) -> dict:
    normalized = dict(row)

    if normalized.get("questions") is None:
        normalized["questions"] = []

    agents_snapshot = normalized.get("agents_snapshot")
    if agents_snapshot is None:
        normalized["agents_snapshot"] = []
    elif isinstance(agents_snapshot, str):
        try:
          normalized["agents_snapshot"] = json.loads(agents_snapshot)
        except (TypeError, ValueError):
          normalized["agents_snapshot"] = []

    summary = normalized.get("summary")
    if summary is None:
        normalized["summary"] = []

    return normalized

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
        "context": payload.context.model_dump() if payload.context else {},
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
    
    supabase.table("projects").delete().eq("id", project_id).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Target Models (User Agents) Sub-resources ---

@router.get("/projects/{project_id}/models", response_model=list[TargetModel])
def list_project_models(project_id: str, user: User = Depends(get_authenticated_user)) -> list[TargetModel]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    resp = supabase.table("target_models").select("*").eq("project_id", project_id).execute()
    return [TargetModel(**row) for row in resp.data]

@router.post("/projects/{project_id}/generate_agents", response_model=list[TargetModel], status_code=status.HTTP_201_CREATED)
def generate_project_agents(project_id: str, user: User = Depends(get_authenticated_user)) -> list[TargetModel]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    ctx = project.context
    desc = ctx.description if ctx and ctx.description else "No description"
    age = ctx.target_age if ctx and ctx.target_age else "Any"
    gender = ctx.target_gender if ctx and ctx.target_gender else "Any"
    price = ctx.suggested_price if ctx and ctx.suggested_price else "Any"
    
    prompt = f"Product: {desc}. Audience: {age}. Gender: {gender}. Price: {price}."
    
    payload = {"prompt": prompt, "project_id": project_id}
    data = asyncio.run(create_people_model(payload))
    
    return data.get("saved_models", [])

@router.delete("/projects/{project_id}/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_model(project_id: str, model_id: str, user: User = Depends(get_authenticated_user)) -> Response:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    supabase.table("target_models").delete().eq("id", model_id).eq("project_id", project_id).execute()
    supabase.table("projects").update({"updated_at": now_utc().isoformat()}).eq("id", project_id).execute()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Simulations Sub-resources ---

@router.get("/projects/{project_id}/simulations", response_model=list[SimulationRun])
def list_simulations(project_id: str, user: User = Depends(get_authenticated_user)) -> list[SimulationRun]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    resp = supabase.table("simulation_runs").select("*").eq("project_id", project_id).execute()
    return [SimulationRun(**normalize_simulation_row(row)) for row in (resp.data or [])]

@router.post("/projects/{project_id}/simulations", response_model=SimulationRun, status_code=status.HTTP_202_ACCEPTED)
def create_simulation(project_id: str, payload: SimulationCreate, user: User = Depends(get_authenticated_user)) -> SimulationRun:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    
    timestamp = now_utc().isoformat()

    agents = list_project_models(project_id, user)
    run_data = {
        "id": str(uuid.uuid4()),
        "project_id": str(project_id),
        "scenario_name": payload.scenario_name,
        "provider": payload.provider,
        "status": 2,
        "questions": payload.questions,
        "overrides": {},
        "agents_snapshot": [agent.model_dump() for agent in agents],
        "started_at": timestamp,
        "completed_at": timestamp,
        "summary": [] # Initially empty array
    }
    
    # Store initial simulation run in database
    supabase.table("simulation_runs").insert(run_data).execute()

    # Generate complete context for the product
    ctx = project.context
    product_desc = ctx.description if ctx and ctx.description else ""
    age_range = ctx.target_age if ctx and ctx.target_age else ""
    sex = ctx.target_gender if ctx and ctx.target_gender else ""
    price = ctx.suggested_price if ctx and ctx.suggested_price else ""
    
    agent_context = (
        f"Description: {product_desc}. "
        f"Audience: {age_range}. "
        f"Gender: {sex}. "
        f"Price: {price}."
    )

    model = asyncio.run(start_model({"model_name": "gemma-3-4b-it-Q4_K_M.gguf", "agent_context": agent_context}))

    agent_responses = []

    for agent in agents:
        agent_dict = agent.model_dump()
        prompt_json = json.dumps(agent_dict, ensure_ascii=False)
        
        ask_payload = {
            "model_id": model.get("model_id"),
            "prompt": prompt_json
            # Note: project_id is omitted so ask_model ignores redundant inserts
        }
        answer_data = asyncio.run(ask_model(ask_payload))
        resp_json = answer_data.get("response", {"error": "Sin respuesta"})
        
        agent_responses.append({
            "User": agent.name,
            "Feedback": resp_json
        })
   
    asyncio.run(stop_model(model.get("model_id")))

    # Update row with the final summary
    supabase.table("simulation_runs").update({
        "summary": agent_responses,
        "completed_at": now_utc().isoformat()
    }).eq("id", run_data["id"]).execute()

    # Touch project's updated_at
    supabase.table("projects").update({"updated_at": timestamp}).eq("id", project_id).execute()

    run_data["summary"] = agent_responses
    return SimulationRun(**normalize_simulation_row(run_data))
