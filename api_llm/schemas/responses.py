from pydantic import BaseModel, Field
from typing import List

class ConsumerProfile(BaseModel):
    name: str
    age: int
    occupation: str
    socioeconomic_level: str
    personality: List[str]

    class Config:
        populate_by_name = True
