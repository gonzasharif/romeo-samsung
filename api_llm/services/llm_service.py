import os
import uuid
from typing import Dict, Any
from llama_cpp import Llama

# Estructura global para almacenar modelos activos y su contexto (system prompt)
_active_models: Dict[str, Dict[str, Any]] = {}

def get_models() -> list:
    model_dir = "models"
    valid_extensions = (".gguf", ".bin")

    os.makedirs(model_dir, exist_ok=True)

    models = []
    for f in os.listdir(model_dir):
        path = os.path.join(model_dir, f)
        if (
            os.path.isfile(path)
            and not f.startswith(".")
            and f.lower().endswith(valid_extensions)
        ):
            models.append(f)

    return models

def start_model(model_name: str, agent_context: str, n_gpu_layers: int = -1, n_ctx: int = 4096) -> str:
    path = os.path.join("models", model_name)
    
    if not os.path.exists(path):
        raise ValueError(f"El modelo {model_name} no existe en la carpeta models.")
        
    # Cargar agente base
    template_path = os.path.join(os.path.dirname(__file__), "agent_template.txt")
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            template = f.read().strip()
    except FileNotFoundError:
        # Intento leer desde root local si no está en services/
        try:
            with open("agent_template.txt", "r", encoding="utf-8") as f:
                template = f.read().strip()
        except FileNotFoundError:
            template = "Eres un asistente evaluador inteligente."

    system_prompt = f"{template}\n{agent_context}"

    model_id = str(uuid.uuid4())
    llm = Llama(
        model_path=path,
        n_gpu_layers=n_gpu_layers,
        n_ctx=n_ctx,
        verbose=False
    )
    
    _active_models[model_id] = {
        "instance": llm,
        "system_prompt": system_prompt
    }
    return model_id

def ask_model(model_id: str, prompt: str) -> str:
    if model_id not in _active_models:
        raise ValueError("ID de modelo no encontrado o inactivo.")
    
    model_data = _active_models[model_id]
    llm = model_data["instance"]
    system_prompt = model_data["system_prompt"]
    
    # Tratamos el prompt con el modelo precargado y el context encolado
    response = llm.create_chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1024,
        temperature=0.7,
        stream=False
    )
    
    return response["choices"][0]["message"]["content"]

def stop_model(model_id: str) -> bool:
    if model_id in _active_models:
        del _active_models[model_id] # Al borrar la referencia, Python libere la RAM/VRAM con Garbage Collector
        return True
    return False

DEFAULT_PEOPLE_MODEL = "gemma-3-4b-it-Q4_K_M.gguf"

def create_people_model(prompt: str) -> str:
    # 1. Cargar el system prompt base (busca en services/ y en root)
    template_path = os.path.join(os.path.dirname(__file__), "people_model_template.txt")
    try:
        with open(template_path, "r", encoding="utf-8") as f:
            system_prompt = f.read().strip()
    except FileNotFoundError:
        try:
            with open("people_model_template.txt", "r", encoding="utf-8") as f:
                system_prompt = f.read().strip()
        except FileNotFoundError:
            system_prompt = "Sos un evaluador simulado."

    path = os.path.join("models", DEFAULT_PEOPLE_MODEL)
    if not os.path.exists(path):
        raise ValueError(f"El modelo constante {DEFAULT_PEOPLE_MODEL} no existe.")
        
    # 2. Iniciar el modelo bajo demanda
    llm = Llama(
        model_path=path,
        n_gpu_layers=-1,
        n_ctx=4096,
        verbose=False
    )
    
    # 3. Generar la respuesta enviando el system_prompt y el nuevo prompt de usuario
    response = llm.create_chat_completion(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1024,
        temperature=0.7,
        stream=False
    )
    
    return response["choices"][0]["message"]["content"]
