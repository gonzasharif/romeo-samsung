from fastapi import FastAPI
from routes.api import router

app = FastAPI(
    title="Simulador de Agentes Llama", 
    description="API de FastAPI para manejar y crear perfiles de simulación de productos."
)

app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
