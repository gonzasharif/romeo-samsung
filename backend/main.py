from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field


app = FastAPI(
    title="Romeo Samsung API",
    version="0.1.0",
    description="API base para usuarios, proyectos y simulaciones de focus groups con IA.",
)


def now_utc() -> datetime:
    return datetime.now(UTC)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


class CompanyProfile(BaseModel):
    name: str
    website: str | None = None
    industry: str | None = None
    description: str | None = None


class BillingProfile(BaseModel):
    contact_name: str | None = None
    email: str | None = None
    tax_id: str | None = None
    address: str | None = None


class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str = Field(min_length=8)
    company: CompanyProfile
    billing: BillingProfile | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    company: CompanyProfile | None = None
    billing: BillingProfile | None = None


class User(BaseModel):
    id: str
    full_name: str
    email: str
    company: CompanyProfile
    billing: BillingProfile | None = None
    created_at: datetime
    updated_at: datetime


class AgentProfile(BaseModel):
    id: str
    name: str
    age_range: str | None = None
    segment: str
    motivations: list[str] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)
    source: Literal["system", "manual"] = "system"


class ProjectContext(BaseModel):
    company_summary: str
    product_name: str
    product_description: str
    target_audience: str
    pricing_notes: str | None = None
    market_context: str | None = None


class ProjectCreate(BaseModel):
    name: str
    context: ProjectContext


class ProjectUpdate(BaseModel):
    name: str | None = None
    context: ProjectContext | None = None


class StatsResponse(BaseModel):
    demand_score: float = Field(ge=0, le=100)
    willingness_to_pay_score: float = Field(ge=0, le=100)
    clarity_score: float = Field(ge=0, le=100)
    objection_distribution: dict[str, int] = Field(default_factory=dict)
    sentiment_distribution: dict[str, int] = Field(default_factory=dict)


class SimulationCreate(BaseModel):
    scenario_name: str
    questions: list[str] = Field(default_factory=list)
    overrides: dict[str, str | int | float | bool] = Field(default_factory=dict)
    provider: Literal["openai", "gemini", "claude", "mock"] = "mock"


class SimulationRun(BaseModel):
    id: str
    project_id: str
    scenario_name: str
    provider: str
    status: Literal["queued", "running", "completed"]
    questions: list[str]
    overrides: dict[str, str | int | float | bool]
    models_snapshot: list[AgentProfile]
    started_at: datetime
    completed_at: datetime | None = None
    summary: str | None = None


class Project(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str
    owner_id: str
    name: str
    context: ProjectContext
    models: list[AgentProfile] = Field(default_factory=list)
    stats: StatsResponse
    simulations: list[SimulationRun] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


USERS: dict[str, User] = {}
PROJECTS: dict[str, Project] = {}


def default_agents(context: ProjectContext) -> list[AgentProfile]:
    product_name = context.product_name
    return [
        AgentProfile(
            id=new_id("agent"),
            name="Comprador pragmático",
            age_range="30-45",
            segment="Profesionales ocupados",
            motivations=[f"Quiere resolver rápido la necesidad que cubre {product_name}"],
            objections=["Necesita ver retorno claro de la compra"],
        ),
        AgentProfile(
            id=new_id("agent"),
            name="Early adopter",
            age_range="24-35",
            segment="Usuarios curiosos por soluciones nuevas",
            motivations=["Prueba productos nuevos si la propuesta se entiende fácil"],
            objections=["Abandona si la propuesta se siente genérica"],
        ),
        AgentProfile(
            id=new_id("agent"),
            name="Escéptico racional",
            age_range="35-55",
            segment="Compradores comparativos",
            motivations=["Compra si la propuesta supera alternativas conocidas"],
            objections=["Duda del precio y de la diferenciación"],
        ),
    ]


def default_stats() -> StatsResponse:
    return StatsResponse(
        demand_score=72,
        willingness_to_pay_score=63,
        clarity_score=58,
        objection_distribution={
            "precio": 4,
            "claridad": 3,
            "confianza": 2,
        },
        sentiment_distribution={
            "positivo": 6,
            "neutral": 3,
            "negativo": 2,
        },
    )


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


def get_authenticated_user(x_user_id: str = Header(..., alias="X-User-Id")) -> User:
    return get_user_or_404(x_user_id)


def assert_project_owner(project: Project, user: User) -> None:
    if project.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@app.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate) -> User:
    timestamp = now_utc()
    user = User(
        id=new_id("user"),
        full_name=payload.full_name,
        email=payload.email,
        company=payload.company,
        billing=payload.billing,
        created_at=timestamp,
        updated_at=timestamp,
    )
    USERS[user.id] = user
    return user


@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: str) -> User:
    return get_user_or_404(user_id)


@app.put("/users/{user_id}", response_model=User)
@app.patch("/users/{user_id}", response_model=User)
def update_user(user_id: str, payload: UserUpdate) -> User:
    current = get_user_or_404(user_id)
    updated = current.model_copy(
        update=payload.model_dump(exclude_unset=True) | {"updated_at": now_utc()}
    )
    USERS[user_id] = updated
    return updated


@app.get("/projects", response_model=list[Project])
def list_projects(user: User = Depends(get_authenticated_user)) -> list[Project]:
    return [project for project in PROJECTS.values() if project.owner_id == user.id]


@app.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
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


@app.get("/projects/{project_id}", response_model=Project)
def get_project(project_id: str, user: User = Depends(get_authenticated_user)) -> Project:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project


@app.put("/projects/{project_id}", response_model=Project)
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


class AgentCreate(BaseModel):
    name: str
    age_range: str | None = None
    segment: str
    motivations: list[str] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)


@app.get("/projects/{project_id}/models", response_model=list[AgentProfile])
def list_project_models(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> list[AgentProfile]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project.models


@app.post(
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


@app.get("/projects/{project_id}/stats", response_model=StatsResponse)
def get_project_stats(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> StatsResponse:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project.stats


@app.get("/projects/{project_id}/simulations", response_model=list[SimulationRun])
def list_simulations(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> list[SimulationRun]:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    return project.simulations


@app.post(
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


@app.post("/projects/{project_id}/runs", response_model=SimulationRun, status_code=status.HTTP_202_ACCEPTED)
def create_run_alias(
    project_id: str,
    payload: SimulationCreate,
    user: User = Depends(get_authenticated_user),
) -> SimulationRun:
    return create_simulation(project_id, payload, user)


@app.get("/projects/{project_id}/runs", response_model=list[SimulationRun])
def list_runs_alias(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> list[SimulationRun]:
    return list_simulations(project_id, user)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    user: User = Depends(get_authenticated_user),
) -> Response:
    project = get_project_or_404(project_id)
    assert_project_owner(project, user)
    PROJECTS.pop(project_id, None)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
