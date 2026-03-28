import os
import httpx
from fastapi import HTTPException

# URL base de la api_llm. Puede configurarse por variables de entorno.
# El valor por defecto asume que corre en el mismo host o es accesible por docker
LLM_API_URL = os.getenv("LLM_API_URL", "http://127.0.0.1:8001")

async def get_models():
    """Obtiene la lista de modelos disponibles llamando a la api_llm."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{LLM_API_URL}/api/get_model", timeout=10.0)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Error conectando a api_llm: {str(e)}")
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
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{LLM_API_URL}/api/create_people_model/", json=request_data, timeout=120.0)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Error conectando a api_llm: {str(e)}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Error en api_llm: {e.response.text}")
