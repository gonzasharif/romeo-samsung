import requests
import os
import sys

# URL base de nuestra API corriendo localmente
BASE_URL = "http://localhost:8000/api"

def main():
    print("==========================================")
    print("     INICIANDO TEST SECUENCIAL DE API     ")
    print("==========================================")
    
    # 1. Test get_model
    print("\n[+] 1. Solicitando listado de modelos locales (GET /get_model)...")
    try:
        resp1 = requests.get(f"{BASE_URL}/get_model")
        resp1.raise_for_status()
        data1 = resp1.json()
        print(f"      Respuesta: {data1}")
        
        modelos = [m for m in data1.get("models", []) if m.endswith(".gguf") or m.endswith(".bin")]
        if not modelos:
            print("      [!] No hay archivos .gguf o modelos dentro de la carpeta 'models/'. Pongo un mockup temporal para continuar el test.")
            primer_modelo = "gemma-dummy.gguf"
        else:
            primer_modelo = modelos[0]
            print(f"      Modelo seleccionado automáticamente para el resto del test: '{primer_modelo}'")
    except Exception as e:
        print(f"      [!] Error conectando a la API: {e}. ¿Seguro que el servidor Uvicorn está corriendo?")
        sys.exit(1)

    # 2. Test create_people_model
    # Nota: Tu petición pedía probar create_people_model y guardar el ID, pero dicho endpoint,
    # por la forma en la que está estructurado, responde el JSON/texto directamente y muere.
    # El endpoint que genera un ID persistente es start_model, probaremos ambos en orden.
    producto_prueba = "una bebida red bull sabor aceitunas"
    print(f"\n[+] 2. Ejecutando perfilado efímero (POST /create_people_model/)...")
    print(f"      Parámetro enviado: '{producto_prueba}'")
    try:
        resp2 = requests.post(
            f"{BASE_URL}/create_people_model/", 
            json={"prompt": producto_prueba}
        )
        if resp2.status_code == 200:
            print("      [Exito] Script devolvió la respuesta del LLM (Omitiendo logs largos).")
        else:
            print(f"      [Falló] Código {resp2.status_code}: {resp2.text}")
    except Exception as e:
        print(f"      [!] Excepción: {e}")

    # 3. Test start_model
    print(f"\n[+] 3. Reservando memoria e iniciando el modelo VRAM (POST /start_model)...")
    print(f"      Enviando Request usando el agent_context: '{producto_prueba}'")
    try:
        resp3 = requests.post(f"{BASE_URL}/start_model", json={
            "model_name": primer_modelo,
            "agent_context": producto_prueba,
            "n_gpu_layers": -1,
            "n_ctx": 4096
        })
        
        if resp3.status_code != 200:
            print(f"      [!] Error fatal iniciando el modelo. (Asegúrate de que {primer_modelo} exista y esté mapeado). Error: {resp3.text}")
            sys.exit(1)
            
        data3 = resp3.json()
        model_id = data3.get("model_id")
        print(f"      [Exito] Modelo iniciado. ID asignado: {model_id}")
    except Exception as e:
        print(f"      [!] Excepción en Start Model: {e}")
        sys.exit(1)

    # 4. Test ask_model leyéndolo del archivo
    test_agent_path = os.path.join(os.path.dirname(__file__), "test_agent.txt")
    if not os.path.exists(test_agent_path):
        with open(test_agent_path, "w", encoding="utf-8") as f:
            f.write("Evaluá este producto con brutal honestidad.")
            
    with open(test_agent_path, "r", encoding="utf-8") as f:
        pregunta_test = f.read().strip()
        
    print(f"\n[+] 4. Generando inferencia con el modelo cargado (POST /ask_model/{{model_id}})...")
    print(f"      Consultando con contenido de test_agent.txt: '{pregunta_test}'")
    try:
        # FastAPI recibe `prompt` por query parameter en la firma actual (def ask_model_endpoint(model_id: str, prompt: str):)
        resp4 = requests.post(f"{BASE_URL}/ask_model/{model_id}", params={"prompt": pregunta_test})
        if resp4.status_code == 200:
            print(f"\n>>>> RESPUESTA API >>>>\n{resp4.json().get('response')}\n<<<<<<<<<<<<<<<<<<<<<<<\n")
        else:
            print(f"      [Falló] Error en la generación: {resp4.text}")
    except Exception as e:
         print(f"      [!] Excepción: {e}")
         
    # 5. Test stop_model
    print(f"\n[+] 5. Limpiando y liberando VRAM de la GPU (POST /stop_model/{{model_id}})...")
    try:
        resp5 = requests.post(f"{BASE_URL}/stop_model/{model_id}")
        if resp5.status_code == 200:
            print(f"      [Exito] {resp5.json().get('message')}")
        else:
            print(f"      [Falló] No se pudo detener el modelo: {resp5.text}")
    except Exception as e:
        print(f"      [!] Excepción deteniendo modelo: {e}")

    print("\n==========================================")
    print("           TODOS LOS TESTS FINALIZADOS      ")
    print("==========================================")

if __name__ == "__main__":
    main()
