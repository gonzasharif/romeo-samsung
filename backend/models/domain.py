from datetime import datetime
from typing import Literal, Optional
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

class TargetModel(BaseModel):
    id: str
    project_id: str
    name: str
    age_range: str | None = None
    income_level: Literal[0, 1, 2] | None = None
    geography: str | None = None
    tech_savviness: str | None = None
    attitude: list[str] = Field(default_factory=list)

class AgentProfile(BaseModel):
    id: str
    model_id: str
    name: str
    gender: str | None = None
    segment: str
    motivations: list[str] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)

class ProjectContext(BaseModel):
    company_summary: str | None = None
    product_name: str | None = None
    product_description: str | None = None
    target_audience: str | None = None
    pricing_notes: str | None = None
    market_context: str | None = None
    category: str | None = None

class StatsResponse(BaseModel):
    demand_score: Optional[float] = Field(None, ge=0, le=100)
    willingness_to_pay_score: Optional[float] = Field(None, ge=0, le=100)
    clarity_score: Optional[float] = Field(None, ge=0, le=100)
    
    objection_distribution: Optional[dict[str, int]] = Field(None)
    sentiment_distribution: Optional[dict[str, int]] = Field(None)
class SimulationRun(BaseModel):
    id: str
    project_id: str
    scenario_name: str
    provider: str
    status: Literal[0, 1, 2] # 0: queued, 1: running, 2: completed
    questions: list[str]
    overrides: dict[str, str | int | float | bool]
    agents_snapshot: list[TargetModel]
    started_at: datetime
    completed_at: datetime | None = None
    summary: dict[str, str | dict[str, str]] | str | list[str] = Field(default_factory=list) 

class Project(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    id: str
    owner_id: str
    name: str
    context: ProjectContext | None = None
    target_models: list[TargetModel] = Field(default_factory=list)
    agents: list[AgentProfile] = Field(default_factory=list)
    stats: StatsResponse | None = None
    simulations: list[SimulationRun] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
