from fastapi import APIRouter
from schemas.api_llm import StartModelRequest, AskModelRequest, CreatePeopleModelRequest
from services import api_llm_service

router = APIRouter(prefix="/api-llm", tags=["API LLM"])

@router.get("/models")
async def get_models():
    """Obtiene la lista de los modelos disponibles desde la API de IA."""
    return await api_llm_service.get_models()

@router.post("/start")
async def start_model(req: StartModelRequest):
    """Levanta un modelo LLM y carga su contexto."""
    return await api_llm_service.start_model(req.model_dump())

@router.post("/{model_id}/ask")
async def ask_model(model_id: str, req: AskModelRequest):
    """Envía un prompt a un modelo en memoria y devuelve la respuesta."""
    return await api_llm_service.ask_model({"model_id": model_id, "prompt": req.prompt})

@router.post("/{model_id}/stop")
async def stop_model(model_id: str):
    """Cierra la conexión con el modelo y libera VRAM."""
    return await api_llm_service.stop_model(model_id)

@router.post("/{project_id}/create_people_model")
async def create_people_model(project_id: str, req: CreatePeopleModelRequest):
    """Consulta al modelo predefinido de creación de perfiles y los guarda."""
    payload = req.model_dump()
    payload["project_id"] = project_id
    return await api_llm_service.create_people_model(payload)
