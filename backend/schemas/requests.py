from typing import Literal
from pydantic import BaseModel, Field
from models.domain import CompanyProfile, BillingProfile, ProjectContext

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

class ProjectCreate(BaseModel):
    name: str
    context: ProjectContext

class ProjectUpdate(BaseModel):
    name: str | None = None
    context: ProjectContext | None = None

class AgentCreate(BaseModel):
    name: str
    age_range: str | None = None
    segment: str
    motivations: list[str] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)

class SimulationCreate(BaseModel):
    scenario_name: str
    questions: list[str] = Field(default_factory=list)
    overrides: dict[str, str | int | float | bool] = Field(default_factory=dict)
    provider: Literal["openai", "gemini", "claude", "mock"] = "mock"
