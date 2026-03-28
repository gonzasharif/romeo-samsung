from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class CompanyProfile(BaseModel):
    name: str
    website: str | None = None
    industry: str | None = None
    description: str | None = None

class User(BaseModel):
    id: str
    full_name: str
    email: str
    company: CompanyProfile
    created_at: datetime
    updated_at: datetime

class AgentProfile(BaseModel):
    id: str
    name: str
    age_range: str | None = None
    segment: str
    motivations: list[str] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)
    attitude: Literal[0, 1, 2, 3] | None = None
    tech_savviness: Literal[0, 1, 2] | None = None
    income_level: Literal[0, 1, 2] | None = None
    geography: str | None = None

class ProjectContext(BaseModel):
    company_summary: str
    product_name: str
    product_description: str
    target_audience: str
    pricing_notes: str | None = None
    market_context: str | None = None

class StatsResponse(BaseModel):
    demand_score: float = Field(ge=0, le=100)
    willingness_to_pay_score: float = Field(ge=0, le=100)
    clarity_score: float = Field(ge=0, le=100)
    objection_distribution: dict[str, int] = Field(default_factory=dict)
    sentiment_distribution: dict[str, int] = Field(default_factory=dict)

class SimulationRun(BaseModel):
    id: str
    project_id: str
    scenario_name: str
    provider: str
    status: Literal[0, 1, 2] # 0: queued, 1: running, 2: completed
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
