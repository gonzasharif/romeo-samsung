# LLM API Server

Esta es una API en FastAPI estructurada para gestionar y servir modelos de lenguaje (LLM) en formato local usando `llama-cpp-python` con soporte para aceleración por GPU (CUDA).

## 🚀 Despliegue con Docker

El proyecto incluye un script de automatización (`run_docker.sh`) que facilita la compilación, creación de la imagen en caché y la ejecución de la API utilizando rutinas de Docker acopladas a la GPU.

### Prerrequisitos
- Tener Docker instalado.
- Disponer de drivers de NVIDIA y el NVIDIA Container Toolkit configurado en Docker.

### Instrucciones

Para levantar la API localmente, otorga previamente permisos de ejecución (si no los tiene) y corre el script:

```bash
chmod +x run_docker.sh
./run_docker.sh
```

- Este script detectará si necesitas permisos sudo.
- Si la imagen `llama-api-gpu` no se encuentra en el equipo, la construirá instalando las capas correspondientes de CUDA.
- Un volumen sincroniza tu carpeta de trabajo (`/app`) dentro del entorno del contenedor, por lo que **cualquier cambio en código** que realices se reflejará sin que tengas que reiniciar el contenedor.
- Se levantará el servicio exponiendo el puerto `8000`.

Si en algún momento sumas dependencias en tu API y necesitas forzar la **reconstrucción de la imagen** desde cero:
```bash
./run_docker.sh --build
```

---

## 📁 Ubicación de los Modelos LLM

Para que la API detecte e inicialice los inteligencias artificiales, debes guardar todos tus weights y archivos de modelos locales (como los formatos `.gguf` o `.bin`) de forma imperativa en esta carpeta:

```text
/models/
```
Por ejemplo: `/models/gemma-3-4b-it-Q4_K_M.gguf`

---

## 🔌 Referencia de Endpoints (API)

Al estar construido sobre FastAPI, este servidor posee un Swagger UI listo para usar donde puedes analizar todas las rutas, ver esquemas y hacer peticiones de prueba directamente desde la web.

👉 **Documentación interactiva disponible en: [http://localhost:8000/docs](http://localhost:8000/docs)**

A continuación el detalle de los endpoints primarios bajo el path general `/api`:

### 1. Obtener modelos válidos
**`GET /api/get_model`**
*   **Descripción:** Consulta la carpeta de `/models/` y devuelve todos los archivos presentes que son compatibles.
*   **Respuesta JSON:** `{"models": ["modelo_a.gguf", "modelo_b.gguf"]}`

### 2. Crear y ejecutar perfil de usuario efímero
**`POST /api/create_people_model/`**
*   **Descripción:** Un endpoint "One-Shot" que inicia un LLM, carga una instrucción general o template configurado ("user persona"), genera inferencia en base al producto consultado en el objeto JSON y retorna su resultado.
*   **Body (JSON):** 
    ```json
    { "prompt": "una bebida red bull sabor aceitunas" }
    ```

### 3. Iniciar modelo en GPU (Sesión Continua)
**`POST /api/start_model`**
*   **Descripción:** Carga dinámicamente en la VRAM de la placa de video un modelo especificado junto a un contexto (System Prompt). Mantendrá estos recursos ocupados para poder aceptar futuras peticiones con alta velocidad hasta que el servicio dicte su detención.
*   **Body (JSON):**
    ```json
    {
      "model_name": "gemma-3.gguf",
      "agent_context": "Actúa de manera profesional y fría.",
      "n_gpu_layers": -1,
      "n_ctx": 4096
    }
    ```
*   **Respuesta JSON:** `{"status": "success", "model_id": "993a-8b1c..."}`

### 4. Consultar modelo persistente
**`POST /api/ask_model/{model_id}?prompt=tu_pregunta`**
*   **Descripción:** Recibe como *query parameter* la pregunta o la interacción de turno a enviar y la direcciona hacia la instancia activa correspondiente al UUID (`model_id`) que se pasó por ruta.
*   **Respuesta JSON:** `{"response": "..."}`

### 5. Detener modelo y liberar recursos
**`POST /api/stop_model/{model_id}`**
*   **Descripción:** Corta la conexión con el motor de C++, anula el contexto y limpia por completo la memoria VRAM ocupada para evitar problemas de _OutOfMemory_ en la tarjeta gráfica.
*   **Respuesta JSON:** `{"message": "Modelo detenido exitosamente"}`
