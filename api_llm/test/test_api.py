import requests
import sys
import os
import json
import re

# Agregamos el directorio principal al PYTHONPATH para poder importar schemas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from schemas.responses import ConsumerProfile

BASE_URL = "http://localhost:8080/api"

def test_get_model():
    """Prueba el endpoint /get_model y retorna la lista de modelos disponibles."""
    print("\n[+] 1. Solicitando listado de modelos locales (GET /get_model)...")
    try:
        response = requests.get(f"{BASE_URL}/get_model")
        response.raise_for_status()
        data = response.json()
        
        modelos_disponibles = data.get("models", [])
        
        print(f"      [Éxito] Endpoint /get_model respondió correctamente.")
        print(f"      Modelos disponibles encontrados ({len(modelos_disponibles)}):")
        
        for i, modelo in enumerate(modelos_disponibles, 1):
            print(f"        {i}. {modelo}")
            
        if not modelos_disponibles:
            print("      [!] No hay modelos disponibles (archivos .gguf o .bin) en el servidor.")
            print("          Por favor, añade un modelo antes de continuar evaluando los demás endpoints.")
            sys.exit(1)
            
        return modelos_disponibles
        
    except requests.exceptions.RequestException as e:
        print(f"      [Falló] Error conectando a la API: {e}. ¿Asegúrate de que el servidor FastAPI está corriendo?")
        sys.exit(1)

def test_create_people_model():
    """Prueba el endpoint /create_people_model/ leyendo el producto de proyect-idea.txt."""
    print("\n[+] 2. Ejecutando perfilado efímero (POST /create_people_model/)...")
    
    # Leer el producto desde el archivo proyect-idea.txt
    file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "proyect-idea.txt")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            producto_prueba = f.read().strip()
    except Exception as e:
        print(f"      [Falló] No se pudo leer el archivo '{file_path}': {e}")
        sys.exit(1)
        
    print(f"      Enviando request con producto: '{producto_prueba}' al servidor...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/create_people_model/", 
            json={"prompt": producto_prueba}
        )
        response.raise_for_status()
        data = response.json()
        
        print(f"      [Éxito] Endpoint /create_people_model/ respondió correctamente.")
        print("      " + "-" * 60)
        
        # Formatear la respuesta por consola
        respuesta_llm = data.get("response", "")
        
        parsed_data = None
        if isinstance(respuesta_llm, str):
            for linea in respuesta_llm.split('\n'):
                print(f"      {linea}")
            
            # Buscar el bloque JSON por si viene en formato markdown
            json_match = re.search(r'```(?:json)?\n?(.*?)\n?```', respuesta_llm, re.DOTALL)
            json_str = json_match.group(1) if json_match else respuesta_llm.strip()
            try:
                parsed_data = json.loads(json_str)
            except json.JSONDecodeError:
                print(f"      [!] No se encontró JSON válido en la respuesta del modelo.")
                parsed_data = []
        else:
            # Ya es un objeto parseado (la API internamente ya lo leyó y nos retornó la Lista o Dict)
            print("      (Datos JSON ya estructurados por la API)")
            print(f"      {json.dumps(respuesta_llm, indent=2, ensure_ascii=False).replace(chr(10), chr(10) + '      ')}")
            parsed_data = respuesta_llm
            
        print("      " + "-" * 60 + "\n")
        
        # --- PARSEANDO LA ESTRUCTURA DE DATOS ---
        print("      [+] Validando datos estructurados con Pydantic (ConsumerProfile)...")
        
        perfiles_pydantic = []
        if parsed_data:
            # En caso de que venga envuelto en un dict, p. ej {"perfiles": [...]}
            if isinstance(parsed_data, dict):
                for v in parsed_data.values():
                    if isinstance(v, list):
                        parsed_data = v
                        break
            
            if not isinstance(parsed_data, list):
                parsed_data = [parsed_data]
                
            for item in parsed_data:
                # Comprobar que sea un dict
                if not isinstance(item, dict):
                    continue
                try:
                    perfil = ConsumerProfile(**item)
                    perfiles_pydantic.append(perfil)
                except Exception as e:
                    print(f"      [!] Advertencia: Perfil omitido por formato inválido - {e}")
                    
            print(f"      [Éxito] Se estructuraron correctamente {len(perfiles_pydantic)} perfiles.")
        
        return producto_prueba, perfiles_pydantic
        
    except requests.exceptions.RequestException as e:
        print(f"      [Falló] Error conectando a la API: {e}")
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"      Detalles HTTP: {response.text}")
        sys.exit(1)


def test_start_model(model_name: str, context: str):
    """Prueba el endpoint /start_model iniciando el LLM con el producto como contexto."""
    print(f"\n[+] 3. Reservando memoria e iniciando el modelo VRAM (POST /start_model)...")
    print(f"      Modelo seleccionado: '{model_name}'")
    print(f"      Contexto base guardado: '{context}'...")
    
    try:
        response = requests.post(f"{BASE_URL}/start_model", json={
            "model_name": model_name,
            "agent_context": context,
            "n_gpu_layers": -1,
            "n_ctx": 4096
        })
        response.raise_for_status()
        
        data = response.json()
        model_id = data.get("model_id")
        
        print(f"      [Éxito] Modelo iniciado correctamente.")
        print(f"      ID de sesión asignado: {model_id}")
        
        return model_id
        
    except requests.exceptions.RequestException as e:
        print(f"      [Falló] Error en start_model: {e}")
        if 'response' in locals() and hasattr(response, 'text'):
            print(f"      Detalles HTTP: {response.text}")
        sys.exit(1)

def test_ask_model(model_id: str, perfiles: list):
    """Llama al endpoint /ask_model/{model_id} una vez por cada perfil."""
    print(f"\n[+] 4. Ejecutando consultas por perfil (POST /ask_model/{{model_id}})...")

    for i, perfil in enumerate(perfiles, 1):
        print(f"\n      --- Perfil {i}: {perfil.name} ---")

        perfil_dict = perfil.model_dump()

        # El prompt es SOLO el perfil serializado
        prompt = json.dumps(perfil_dict, ensure_ascii=False)

        try:
            response = requests.post(
                f"{BASE_URL}/ask_model/{model_id}",
                params={"prompt": prompt}  # 🔑 CLAVE: usar params, no json
            )

            if response.status_code == 200:
                data = response.json()
                respuesta = data.get("response", "")

                print("      Respuesta del modelo:")
                print("      " + "-" * 40)
                if isinstance(respuesta, str):
                    for linea in respuesta.split("\n"):
                        print(f"      {linea}")
                else:
                    formatted_json = json.dumps(respuesta, indent=2, ensure_ascii=False)
                    for linea in formatted_json.split("\n"):
                        print(f"      {linea}")
                print("      " + "-" * 40)
            else:
                print(f"      [Falló] Error HTTP: {response.text}")

        except Exception as e:
            print(f"      [!] Excepción en perfil {perfil.name}: {e}")

def test_stop_model(model_id: str):
    """Detiene el modelo activo y libera recursos (VRAM)."""
    print(f"\n[+] 5. Limpiando y liberando VRAM de la GPU (POST /stop_model/{{model_id}})...")
    print(f"      ID de modelo a detener: {model_id}")

    try:
        response = requests.post(f"{BASE_URL}/stop_model/{model_id}")

        if response.status_code == 200:
            data = response.json()
            mensaje = data.get("message", "Modelo detenido correctamente.")
            print(f"      [Éxito] {mensaje}")
        else:
            print(f"      [Falló] No se pudo detener el modelo.")
            print(f"      Detalles HTTP: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"      [!] Error de conexión al detener el modelo: {e}")


def main():
    print("==========================================")
    print("     INICIANDO TEST SECUENCIAL DE API     ")
    print("==========================================")
    
    # Paso 1: Obtener la lista de modelos
    modelos = test_get_model()
    
    # Paso 2: Crear perfiles leyendo el archivo y estructurarlos
    producto, perfiles = test_create_people_model()
    
    # Paso 3: Iniciar el proxy LLM en memoria enviando la petición
    if not modelos:
        print("\n[!] Error crítico: no hay modelos en el servidor para iniciar.")
        sys.exit(1)
        
    primer_modelo = modelos[0]
    model_id = test_start_model(primer_modelo, producto)
    
    # Paso 4: Ejecutar consultas por perfil
    test_ask_model(model_id, perfiles)

    # Paso 5: Detener el modelo y liberar VRAM
    test_stop_model(model_id)

if __name__ == "__main__":
    main()
