from fastapi import APIRouter, status, HTTPException


router = APIRouter()

@app.get("/models")
async def get_remote_models():
    """Obtiene los modelos disponibles en el servidor remoto."""
    try:
        response = await client.get("/get_model")
        response.raise_for_status()
        return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Error en API remota: {str(e)}")

@app.post("/generate-profiles")
async def generate_profiles(payload: PromptRequest):
    """Genera perfiles de consumidor y limpia el JSON del Markdown."""
    try:
        response = await client.post("/create_people_model/", json={"prompt": payload.prompt})
        response.raise_for_status()
        raw_data = response.json()
        respuesta_llm = raw_data.get("response", "")
