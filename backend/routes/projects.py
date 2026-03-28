from fastapi import APIRouter, Depends, status, Response
from models.domain import Project, AgentProfile, SimulationRun, StatsResponse, User
from models.db import PROJECTS
from schemas.requests import ProjectCreate, ProjectUpdate, AgentCreate, SimulationCreate
from utils.common import now_utc, new_id
from services.auth_service import get_authenticated_user, get_project_or_404, assert_project_owner
from services.project_service import default_agents, default_stats

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
    project = Project(
        id=new_id("proj"),
        owner_id=user.id,
        name=payload.name,
        context=payload.context,
        models=default_agents(payload.context),
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


# --- Models Sub-resources ---

@router.get("/projects/{project_id}/models", response_model=list[AgentProfile])
def list_project_models(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> list[AgentProfile]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project.models

@router.post(
    "/projects/{project_id}/models",
    response_model=AgentProfile,
    status_code=status.HTTP_201_CREATED,
)
def add_project_model(
    project_id: str,
    payload: AgentCreate,
    user: User = Depends(get_authenticated_user),
) -> AgentProfile:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    agent = AgentProfile(id=new_id("agent"), source="manual", **payload.model_dump())
    project.models.append(agent)
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
        status="completed",
        questions=payload.questions,
        overrides=payload.overrides,
        models_snapshot=[model.model_copy(deep=True) for model in project.models],
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
