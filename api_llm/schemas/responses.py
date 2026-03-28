from pydantic import BaseModel, Field
from typing import List

class ConsumerProfile(BaseModel):
    nombre: str
    edad: int
    ocupacion: str
    nivel_socioeconomico: str = Field(alias="nivel socioeconomico")
    personalidad: List[str]

    class Config:
        populate_by_name = True
