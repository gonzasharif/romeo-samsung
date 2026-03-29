import os
import httpx
from fastapi import HTTPException
from interfaces.llm_translator import translate_llm_to_target_model
from utils.supabase_client import supabase
# URL base de la api_llm.
# Se inyecta desde docker-compose.yml, apuntando al host donde corra el otro contenedor o máquina.
LLM_API_URL = "http://api:8080"

async def get_models():
    """Obtiene la lista de modelos disponibles llamando a la api_llm."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{LLM_API_URL}/api/get_model", timeout=10.0)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Error conectando a api_llm: {str(e)}, {LLM_API_URL}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Error en api_llm: {e.response.text}")

async def start_model(request_data: dict):
    """Levanta un modelo en la api_llm."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{LLM_API_URL}/api/start_model", json=request_data, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Error conectando a api_llm: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Error en api_llm: {e.response.text}")

async def ask_model(model_id: str, prompt: str):
    """Consulta a un modelo activo."""
    async with httpx.AsyncClient() as client:
        try:
            # Observación: El endpoint original de api_llm espera prompt como query param: /ask_model/{model_id}?prompt=...
            response = await client.post(f"{LLM_API_URL}/api/ask_model/{model_id}", params={"prompt": prompt}, timeout=120.0)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Error conectando a api_llm: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Error en api_llm: {e.response.text}")

async def stop_model(model_id: str):
    """Detiene un modelo en la api_llm."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{LLM_API_URL}/api/stop_model/{model_id}", timeout=10.0)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Error conectando a api_llm: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Error en api_llm: {e.response.text}")

async def create_people_model(request_data: dict):
    """Genera respuesta usando el modelo de perfilamiento (create_people_model)."""
    
    project_id = request_data.get("project_id")
    llm_payload = {"prompt": request_data.get("prompt")}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{LLM_API_URL}/api/create_people_model", json=llm_payload, timeout=120.0)
            response.raise_for_status()
            
            data = response.json()
            llm_response = data.get("response", [])
            
            if project_id and isinstance(llm_response, list):   
                saved_models = []
                for profile in llm_response:
                    target_model = translate_llm_to_target_model(profile, project_id)
                    db_response = supabase.table("target_models").insert(target_model.model_dump()).execute()
                    if db_response.data:
                        saved_models.append(db_response.data[0])
                        
                data["saved_models"] = saved_models
            
            return data
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Error conectando a api_llm: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Error en api_llm: {e.response.text}")
