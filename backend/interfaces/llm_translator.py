import uuid
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from models.domain import TargetModel, SimulationRun

def parse_income_level(income_str: str) -> Optional[int]:
    """
    Convierte el nivel socioeconómico (string) provisto por el LLM
    en un valor numérico validado por el TargetModel.
    (0: Bajo, 1: Medio, 2: Alto)
    """
    if not isinstance(income_str, str):
        return None
        
    normalized = income_str.strip().lower()
    if normalized == "low":
        return 0
    elif normalized == "medium":
        return 1
    elif normalized == "high":
        return 2
    return None

def translate_llm_to_target_model(
    llm_data: Dict[str, Any], 
    project_id: str, 
    target_id: Optional[str] = None
) -> TargetModel:
    """
    Traduce el JSON resultante del modelo LLM (dict) a una entidad TargetModel abstracta,
    para que concuerde con el esquema de la base de datos de Supabase.
    
    Args:
        llm_data (dict): Objeto JSON cargado y parseado devuelto por LLM (extract_and_parse_json).
        project_id (str): ID del proyecto / producto al cual asociar este target model.
        target_id (str, optional): ID opcional en caso de que ya se conozca de antemano.
        
    Returns:
        TargetModel: Entidad lista para usar e insertar en la base de datos de supabase.
    """
    
    # Genera el ID automáticamente si no se proporciona uno por parámetro explícito.
    _id = target_id if target_id else str(uuid.uuid4())
    
    # Nombre
    nombre = llm_data.get("name", "Unknown Person")
    
    # Edad (Pasada como age_range en TargetModel. Se castea de int a str por el tipado)
    edad = llm_data.get("age")
    age_range = str(edad) if edad is not None else None
    
    # Ingresos Económicos
    nivel_str = llm_data.get("socioeconomic_level")
    income_level = parse_income_level(nivel_str)
    
    # Geografía, Savviness y Actitud
    geography = llm_data.get("geography")
    tech_savviness = llm_data.get("tech_savviness")
    attitude = llm_data.get("personality")
    
    return TargetModel(
        id=_id,
        project_id=project_id,
        name=nombre,
        age_range=age_range,
        income_level=income_level,
        geography=geography,
        tech_savviness=tech_savviness,
        attitude=attitude
    )



def translate_llm_to_simulation_run(
    llm_data: Any,
    project_id: str,
    scenario_name: str,
    provider: str,
    questions: list[str],
    overrides: dict,
    agents_snapshot: list,
    simulation_id: Optional[str] = None,
    started_at: Optional[datetime] = None
) -> SimulationRun:
    """
    Traduce el output del LLM (proveniente de ask_model) y los metadatos del proyecto
    a una entidad SimulationRun para persistir en la base de datos.
    
    Args:
        llm_data (Any): El resultado de ask_model, puede ser un dict (parseado) o un str.
        project_id (str): ID del proyecto.
        scenario_name (str): Nombre del escenario.
        provider (str): El proveedor (ej. 'mock').
        questions (list[str]): Lista de preguntas hechas.
        overrides (dict): Campos sobreescritos en el contexto.
        agents_snapshot (list): Lista de diccionarios con el snapshot de los agentes.
        simulation_id (str, optional): UUID de la simulación. Se genera uno si no se provee.
        started_at (datetime, optional): Fecha de inicio. Si no se indica, usa la fecha actual.
        
    Returns:
        SimulationRun: Instancia pydantic lista para insertar.
    """
    _id = simulation_id if simulation_id else str(uuid.uuid4())
    
    # Extraer el summary/respuesta del output de la IA
    # Solo incluir summary si existe explícitamente, de otra forma dejar vacío
    summary_text = ""
    if isinstance(llm_data, dict):
        summary_text = llm_data.get("summary", llm_data.get("response", ""))
    elif isinstance(llm_data, list) and llm_data:
        # Si es una lista y no está vacía, podría intentar extraer algo significativo
        summary_text = ""
    else:
        # Para otros tipos, dejar vacío en lugar de convertir a string
        summary_text = ""

    now = datetime.now(timezone.utc)
    start_time = started_at if started_at else now
    
    return SimulationRun(
        id=_id,
        project_id=project_id,
        scenario_name=scenario_name,
        provider=provider,
        status=2, # statu = completed
        questions=questions,
        overrides=overrides,
        agents_snapshot=agents_snapshot,
        started_at=start_time,
        completed_at=now,
        summary=summary_text
    )