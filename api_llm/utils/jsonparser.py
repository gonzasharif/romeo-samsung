import re
import json
from typing import Any

def extract_and_parse_json(llm_response: str) -> Any:
    """
    Toma una cadena de texto generada por el LLM (que comúnmente incluye 
    bloques de markdown como ```json ... ```) y extrae el formato JSON puro,
    devolviendo el objeto Python (dict o list) o la string limpia como fallback.
    
    Args:
        llm_response (str): La respuesta cruda del LLM. Por ejemplo:
                            "```json\n[\n  {...}\n]\n```"
                            
    Returns:
        Any: El dict/list parseado del JSON, o la string si falla.
    """
    # Usar Regex para buscar todo lo que esté delimitado por ```json ... ``` (o simples ```)
    # re.DOTALL es crítico porque el JSON ocupa varias líneas
    json_match = re.search(r'```(?:json)?\n?(.*?)\n?```', llm_response, re.DOTALL | re.IGNORECASE)
    
    if json_match:
        # Si se encontró el bloque markdown, usamos solamente su contenido interno
        cleaned = json_match.group(1).strip()
    else:
        # Si no tiene etiquetas markdown, asumimos que el LLM devolvió el JSON original  
        cleaned = llm_response.strip()
        
    # Desescapar si la cadena viene envuelta en comillas como un literal de string JSON
    if cleaned.startswith('"') and cleaned.endswith('"'):
        try:
            # json.loads decodificará un string literal ("...") a su string real
            parsed = json.loads(cleaned)
            if isinstance(parsed, str):
                cleaned = parsed.strip()
        except Exception:
            # Fallback manual: si tiene comillas iniciales y finales pero no es un JSON string válido
            # (ej. porque tiene saltos de línea sin escapar), a veces los LLMs hacen esto.
            # Removemos las comillas de los extremos y des-escapamos comillas dobles internas.
            cleaned_unquoted = cleaned[1:-1]
            cleaned_unquoted = cleaned_unquoted.replace('\\"', '"')
            cleaned = cleaned_unquoted.strip()

    # Intentar parsear el string limpio a un objeto JSON real
    try:
        return json.loads(cleaned)
    except Exception:
        return cleaned
