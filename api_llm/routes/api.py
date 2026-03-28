from fastapi import APIRouter, HTTPException
from schemas.requests import StartModelRequest, CreatePeopleModelRequest
from services import llm_service

router = APIRouter()

@router.get("/get_model")
def get_model_endpoint():
    """Devuelve un listado de todos los modelos disponibles en la carpeta models."""
    try:
        model_list = llm_service.get_models()
        return {"models": model_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start_model")
def start_model_endpoint(req: StartModelRequest):
    """Levanta y carga el modelo LLM en memoria junto con su contexto. Devuelve un ID único."""
    try:
        model_id = llm_service.start_model(req.model_name, req.agent_context, req.n_gpu_layers, req.n_ctx)
        return {"status": "success", "model_id": model_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask_model/{model_id}")
def ask_model_endpoint(model_id: str, prompt: str):
    """Envía el prompt al modelo instanciado con ese ID y genera la respuesta final del agente."""
    try:
        response = llm_service.ask_model(model_id, prompt)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop_model/{model_id}")
def stop_model_endpoint(model_id: str):
    """Finaliza la conexión, borra la instancia y libera la memoria en la VRAM."""
    if llm_service.stop_model(model_id):
        return {"message": "Modelo detenido exitosamente"}
    raise HTTPException(status_code=404, detail="Modelo no encontrado")

@router.post("/create_people_model/")
def create_people_model_endpoint(req: CreatePeopleModelRequest):
    """Inicia el modelo predefinido y genera una respuesta con el prompt y la plantilla."""
    try:
        respuesta = llm_service.create_people_model(req.prompt)
        return {"response": respuesta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
