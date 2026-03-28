from pydantic import BaseModel
from typing import Optional

class StartModelRequest(BaseModel):
    model_name: str
    agent_context: str
    n_gpu_layers: int = -1
    n_ctx: int = 4096

class AskModelRequest(BaseModel):
    prompt: str

class CreatePeopleModelRequest(BaseModel):
    prompt: str
