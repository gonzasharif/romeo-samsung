import uuid
from typing import Dict, Any, Optional

from models.domain import TargetModel

def parse_income_level(income_str: str) -> Optional[int]:
    """
    Convierte el nivel socioeconómico (string) provisto por el LLM
    en un valor numérico validado por el TargetModel.
    (0: Bajo, 1: Medio, 2: Alto)
    """
    if not isinstance(income_str, str):
        return None
        
    normalized = income_str.strip().lower()
    if normalized == "bajo":
        return 0
    elif normalized == "medio":
        return 1
    elif normalized == "alto":
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
    nombre = llm_data.get("nombre", "Persona Desconocida")
    
    # Edad (Pasada como age_range en TargetModel. Se castea de int a str por el tipado)
    edad = llm_data.get("edad")
    age_range = str(edad) if edad is not None else None
    
    # Ingresos Económicos
    nivel_str = llm_data.get("nivel socioeconomico")
    income_level = parse_income_level(nivel_str)
    
    # Geografía, Savviness y Actitud
    geography = llm_data.get("geography")
    tech_savviness = llm_data.get("tech_savviness")
    attitude = llm_data.get("personalidad")
    
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
