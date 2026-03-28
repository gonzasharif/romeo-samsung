from typing import Literal
from pydantic import BaseModel, Field
from models.domain import CompanyProfile, ProjectContext

class UserCreate(BaseModel):
    full_name: str
    email: str
    password: str = Field(min_length=8)
    company: CompanyProfile

class LoginRequest(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    company: CompanyProfile | None = None

class ProjectCreate(BaseModel):
    name: str
    context: ProjectContext

class ProjectUpdate(BaseModel):
    name: str | None = None
    context: ProjectContext | None = None

class TargetModelCreate(BaseModel):
    name: str
    age_range: str | None = None
    income_level: Literal[0, 1, 2] | None = None
    geography: str | None = None
    tech_savviness: Literal[0, 1, 2] | None = None
    attitude: Literal[0, 1, 2, 3] | None = None

class AgentCreate(BaseModel):
    name: str
    gender: str | None = None
    segment: str
    motivations: list[str] = Field(default_factory=list)
    objections: list[str] = Field(default_factory=list)

class TargetModelUpdate(BaseModel):
    name: str | None = None
    age_range: str | None = None
    income_level: Literal[0, 1, 2] | None = None
    geography: str | None = None
    tech_savviness: Literal[0, 1, 2] | None = None
    attitude: Literal[0, 1, 2, 3] | None = None

class AgentUpdate(BaseModel):
    model_id: str | None = None
    name: str | None = None
    gender: str | None = None
    segment: str | None = None
    motivations: list[str] | None = None
    objections: list[str] | None = None

class SimulationCreate(BaseModel):
    scenario_name: str
    questions: list[str] = Field(default_factory=list)
    overrides: dict[str, str | int | float | bool] = Field(default_factory=dict)
    provider: Literal["openai", "gemini", "claude", "mock"] = "mock"
