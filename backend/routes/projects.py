from fastapi import APIRouter, Depends, status, Response
from models.domain import Project, AgentProfile, TargetModel, SimulationRun, StatsResponse, User
from models.db import PROJECTS
from schemas.requests import ProjectCreate, ProjectUpdate, AgentCreate, TargetModelCreate, SimulationCreate
from utils.common import now_utc, new_id
from services.auth_service import get_authenticated_user, get_project_or_404, assert_project_owner
from services.project_service import generate_defaults, default_stats

router = APIRouter()

@router.get("/projects", response_model=list[Project])
def list_projects(user: User = Depends(get_authenticated_user)) -> list[Project]:
    return [project for project in PROJECTS.values() if project.owner_id == user.id]

@router.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    user: User = Depends(get_authenticated_user),
) -> Project:
    timestamp = now_utc()
    project_id = new_id("proj")
    target_models, agents = generate_defaults(payload.context, project_id)
    
    project = Project(
        id=project_id,
        owner_id=user.id,
        name=payload.name,
        context=payload.context,
        target_models=target_models,
        agents=agents,
        stats=default_stats(),
        created_at=timestamp,
        updated_at=timestamp,
    )
    PROJECTS[project.id] = project
    return project

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
    updated = project.model_copy(
        update=payload.model_dump(exclude_unset=True) | {"updated_at": now_utc()}
    )
    PROJECTS[project_id] = updated
    return updated

@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> Response:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    PROJECTS.pop(project_id, None)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Target Models Sub-resources ---

@router.get("/projects/{project_id}/models", response_model=list[TargetModel])
def list_project_models(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> list[TargetModel]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project.target_models

@router.post(
    "/projects/{project_id}/models",
    response_model=TargetModel,
    status_code=status.HTTP_201_CREATED,
)
def add_project_model(
    project_id: str,
    payload: TargetModelCreate,
    user: User = Depends(get_authenticated_user),
) -> TargetModel:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    target_model = TargetModel(id=new_id("model"), project_id=project_id, **payload.model_dump())
    project.target_models.append(target_model)
    project.updated_at = now_utc()
    return target_model


# --- Agents Sub-resources ---

@router.get("/projects/{project_id}/agents", response_model=list[AgentProfile])
def list_project_agents(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> list[AgentProfile]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project.agents

@router.post(
    "/projects/{project_id}/agents",
    response_model=AgentProfile,
    status_code=status.HTTP_201_CREATED,
)
def add_project_agent(
    project_id: str,
    payload: AgentCreate,
    user: User = Depends(get_authenticated_user),
) -> AgentProfile:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    # verify model exists
    if not any(m.id == payload.model_id for m in project.target_models):
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="model_id no fue encontrado en este proyecto")
        
    agent = AgentProfile(id=new_id("agent"), **payload.model_dump())
    project.agents.append(agent)
    project.updated_at = now_utc()
    return agent


# --- Stats Sub-resources ---

@router.get("/projects/{project_id}/stats", response_model=StatsResponse)
def get_project_stats(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> StatsResponse:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project.stats


# --- Simulations Sub-resources ---

@router.get("/projects/{project_id}/simulations", response_model=list[SimulationRun])
def list_simulations(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> list[SimulationRun]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project.simulations

@router.post(
    "/projects/{project_id}/simulations",
    response_model=SimulationRun,
    status_code=status.HTTP_202_ACCEPTED,
)
def create_simulation(
    project_id: str,
    payload: SimulationCreate,
    user: User = Depends(get_authenticated_user),
) -> SimulationRun:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)

    started_at = now_utc()
    run = SimulationRun(
        id=new_id("run"),
        project_id=project.id,
        scenario_name=payload.scenario_name,
        provider=payload.provider,
        status=2,
        questions=payload.questions,
        overrides=payload.overrides,
        agents_snapshot=[agent.model_copy(deep=True) for agent in project.agents],
        started_at=started_at,
        completed_at=now_utc(),
        summary=(
            "Simulación creada. En una integración real, este endpoint dispararía "
            "la ejecución contra OpenAI, Gemini o Claude."
        ),
    )
    project.simulations.append(run)
    project.updated_at = now_utc()
    return run

# Aliases
@router.post("/projects/{project_id}/runs", response_model=SimulationRun, status_code=status.HTTP_202_ACCEPTED)
def create_run_alias(
    project_id: str,
    payload: SimulationCreate,
    user: User = Depends(get_authenticated_user),
) -> SimulationRun:
    return create_simulation(project_id, payload, user=user)

@router.get("/projects/{project_id}/runs", response_model=list[SimulationRun])
def list_runs_alias(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> list[SimulationRun]:
    return list_simulations(project_id, user=user)
