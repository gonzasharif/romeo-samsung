# Romeo Samsung

Plataforma para validar ideas de negocio antes de invertir tiempo y dinero en construirlas. El producto combina una landing de captación con un backend preparado para gestionar usuarios, proyectos, perfiles de agentes de IA y corridas de simulación tipo focus group.

## Qué resuelve

Muchos equipos construyen primero y validan después. Este proyecto apunta a invertir ese orden.

La propuesta es simple:

- el usuario describe su empresa, producto y contexto de mercado
- el sistema genera perfiles sintéticos de potenciales clientes
- el usuario corre simulaciones con IA para testear interés, objeciones y disposición a pagar
- el frontend muestra señales agregadas de demanda para facilitar la toma de decisiones

## Estado actual

Hoy el repositorio incluye:

- una landing page en React + Vite con foco comercial
- una API en Python con FastAPI para usuarios, proyectos, agentes y simulaciones
- almacenamiento en memoria para iterar rápido sobre el flujo de producto

Todavía no incluye:

- autenticación real
- base de datos persistente
- integración efectiva con OpenAI, Gemini o Claude
- paneles de visualización conectados al backend

## Stack

### Frontend

- React 19
- TypeScript
- Vite
- CSS custom

### Backend

- Python 3
- FastAPI
- Pydantic
- Uvicorn

## Estructura del proyecto

```text
.
├── backend/
│   ├── main.py
│   └── requirements.txt
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── package.json
└── README.md
```

## Flujo de producto

1. El usuario se registra en la plataforma.
2. Crea un proyecto con el contexto de su empresa y su producto.
3. El sistema genera perfiles de agentes de IA para ese proyecto.
4. El usuario puede agregar perfiles manuales si detecta segmentos faltantes.
5. Se dispara una simulación para evaluar demanda y objeciones.
6. El frontend consume métricas agregadas e historial de corridas.

## Endpoints disponibles

### Usuarios

- `POST /users`
  Registra un nuevo cliente.
- `GET /users/{id}`
  Devuelve el perfil del cliente.
- `PUT /users/{id}`
  Reemplaza los datos editables del cliente.
- `PATCH /users/{id}`
  Actualiza parcialmente datos de empresa o facturación.

### Proyectos

- `GET /projects`
  Lista los proyectos del usuario autenticado.
- `POST /projects`
  Crea un proyecto nuevo con el formulario inicial.
- `GET /projects/{id}`
  Devuelve el detalle completo del proyecto.
- `PUT /projects/{id}`
  Actualiza el nombre o contexto del proyecto.

### Modelos de agentes

- `GET /projects/{id}/models`
  Lista los perfiles de agentes generados para el proyecto.
- `POST /projects/{id}/models`
  Agrega un agente manual.

### Métricas

- `GET /projects/{id}/stats`
  Devuelve métricas agregadas listas para graficar.

### Simulaciones

- `GET /projects/{id}/simulations`
  Lista el historial de corridas del proyecto.
- `POST /projects/{id}/simulations`
  Dispara una nueva simulación.
- `GET /projects/{id}/runs`
  Alias de historial de corridas.
- `POST /projects/{id}/runs`
  Alias para disparar una simulación.

### Salud del servicio

- `GET /health`
  Healthcheck simple del backend.

## Autenticación actual

Por ahora el backend usa una autenticación mínima basada en header:

```http
X-User-Id: user_xxxxx
```

No hay login real todavía. Primero se crea un usuario con `POST /users` y luego ese `id` se envía en el header para listar o crear proyectos.

## Cómo correr con Docker Compose (Recomendado)

La forma más rápida de levantar ambos servicios (Frontend y Backend) en modo desarrollo con recarga activa (hot reload) es usando Docker Compose.

### Requisitos
- Docker Desktop (o Docker + Docker Compose) instalado.

### Levantar el entorno
En la terminal, dentro de la raíz del proyecto, ejecuta:
```bash
docker-compose up --build

o

docker compose up --build
```

Una vez que termine de descargar las imágenes y levantar los contenedores, tus servicios estarán disponibles en:
- **Frontend (Sitio Web):** http://localhost:5173
- **Backend API:** http://localhost:8000
- **Documentación Interactiva (Swagger):** http://localhost:8000/docs

Para detener la ejecución, presiona `Ctrl+C`. Para borrar los contenedores puedes usar `docker-compose down`.

### Configuración del servidor de modelos LLM (api_llm)

El contenedor del backend asume por defecto que el modelo LLM está corriendo en tu máquina (host) en el puerto `8000`. Si tu API de LLM corre en otra IP u otro puerto, puedes configurar la variable `LLM_API_URL` antes de usar el Compose:

**Opción 1: En línea de comandos (Linux / Mac / Git Bash)**
```bash
LLM_API_URL="http://192.168.1.100:9000" docker compose up --build
```

**Opción 2: Usar un archivo `.env` local**
Crea un archivo llamado `.env` en la raíz del proyecto (junto a `docker-compose.yml`) y añade:
```env
LLM_API_URL=http://tu_ip_aqui:tu_puerto
```
Docker Compose tomará automáticamente esta URL al levantar el backend.

## Cómo correr el frontend (Manualmente)

### Requisitos

- Node.js 20 o superior
- npm

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Build de producción

```bash
npm run build
```

### Preview local

```bash
npm run preview
```

## Cómo correr el backend (Manualmente)

### Requisitos

- Python 3.11 o superior
- pip

### Instalación

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

### Desarrollo

```bash
uvicorn backend.main:app --reload
```

Una vez levantado, la documentación interactiva queda disponible en:

- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`

## Ejemplo de uso básico

### 1. Crear usuario

```bash
curl -X POST http://127.0.0.1:8000/users \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ada Founder",
    "email": "ada@example.com",
    "password": "supersecreto",
    "company": {
      "name": "Ada Labs",
      "industry": "SaaS",
      "description": "Herramientas para validar ideas"
    }
  }'
```

### 2. Crear proyecto

Reemplazá `user_xxxxx` por el `id` devuelto en el paso anterior.

```bash
curl -X POST http://127.0.0.1:8000/projects \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user_xxxxx" \
  -d '{
    "name": "Focus group para app de viandas",
    "context": {
      "company_summary": "Startup de alimentación saludable",
      "product_name": "LunchFlow",
      "product_description": "Suscripción de viandas listas para oficina",
      "target_audience": "Profesionales con poco tiempo",
      "pricing_notes": "Plan mensual"
    }
  }'
```

### 3. Correr simulación

Reemplazá `proj_xxxxx` por el `id` del proyecto creado.

```bash
curl -X POST http://127.0.0.1:8000/projects/proj_xxxxx/simulations \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user_xxxxx" \
  -d '{
    "scenario_name": "Precio base",
    "provider": "mock",
    "questions": [
      "¿Comprarías este producto?",
      "¿Qué te genera dudas?"
    ]
  }'
```

## Scripts útiles

### Frontend

- `npm run dev`: levanta Vite en modo desarrollo
- `npm run build`: compila TypeScript y genera build de producción
- `npm run lint`: ejecuta ESLint
- `npm run preview`: sirve el build localmente

### Backend

- `uvicorn backend.main:app --reload`: levanta la API en desarrollo

## Decisiones de implementación

- El backend usa almacenamiento en memoria para facilitar prototipado rápido.
- Los agentes de IA iniciales se generan automáticamente al crear un proyecto.
- Las métricas están mockeadas con estructura realista para desacoplar frontend y backend.
- El endpoint de simulaciones ya está modelado para integrar proveedores reales más adelante.

## Próximos pasos recomendados

- conectar la landing con registro real
- persistir usuarios y proyectos en SQLite o Postgres
- agregar autenticación y autorización reales
- disparar simulaciones asíncronas con cola de trabajos
- integrar proveedores LLM reales y almacenar resultados por corrida
- construir dashboard de análisis y comparación entre escenarios

## Nota

Este repositorio está orientado a validar rápido el flujo de producto. La implementación actual privilegia claridad y velocidad de iteración por encima de robustez productiva.


## Prueba de concepto

A continuación se puede observar una prueba de concepto de la API LLM. Esta representa el flujo de trabajo mínimo que se espera implementar en el sistema.
Nótese como el modelo es capaz de generar perfiles de usuarios plausiblemente interesados en un producto o servicio y, como sus reacciones se ven enormemente influenciadas por tipo de producto que se les presenta. A continuación tenemos dos ejemplos de simulación: una con un producto "convencional" y otra con un producto "innovador" en donde se puede apreciar esta diferencia.


```
8:22:44 dante@darkstar test main ? python3 test_api.py
==========================================
     INICIANDO TEST SECUENCIAL DE API     
==========================================

[+] 1. Solicitando listado de modelos locales (GET /get_model)...
      [Éxito] Endpoint /get_model respondió correctamente.
      Modelos disponibles encontrados (1):
        1. gemma-3-4b-it-Q4_K_M.gguf

[+] 2. Ejecutando perfilado efímero (POST /create_people_model/)...
      >> Ingrese la descripción del producto que desea evaluar: Un jugo natural hecho a base de pasto.  
      Enviando request con producto: 'Un jugo natural hecho a base de pasto.' al servidor...
      [Éxito] Endpoint /create_people_model/ respondió correctamente.
      ------------------------------------------------------------
      (Datos JSON ya estructurados por la API)
      [
        {
          "nombre": "Daniela Ríos",
          "edad": 32,
          "ocupacion": "Diseñadora Gráfica Freelance",
          "nivel socioeconomico": "Medio",
          "personalidad": [
            "Creativa",
            "Experimentadora",
            "Saludable"
          ]
        },
        {
          "nombre": "Carlos Mendoza",
          "edad": 28,
          "ocupacion": "Desarrollador Web Junior",
          "nivel socioeconomico": "Bajo",
          "personalidad": [
            "Curioso",
            "Práctico",
            "Innovador"
          ]
        },
        {
          "nombre": "Sofía Vargas",
          "edad": 45,
          "ocupacion": "Profesora de Yoga",
          "nivel socioeconomico": "Medio-Alto",
          "personalidad": [
            "Consciente",
            "Natural",
            "Bienestar"
          ]
        },
        {
          "nombre": "Ricardo Gómez",
          "edad": 58,
          "ocupacion": "Retirado - Ingeniero Agrónomo",
          "nivel socioeconomico": "Alto",
          "personalidad": [
            "Reflexivo",
            "Tradicional",
            "Curioso"
          ]
        },
        {
          "nombre": "Lucía Sánchez",
          "edad": 24,
          "ocupacion": "Estudiante de Biología",
          "nivel socioeconomico": "Bajo",
          "personalidad": [
            "Inteligente",
            "Ecológica",
            "Aventurera"
          ]
        }
      ]
      ------------------------------------------------------------

      [+] Validando datos estructurados con Pydantic (ConsumerProfile)...
      [Éxito] Se estructuraron correctamente 5 perfiles.

[+] 3. Reservando memoria e iniciando el modelo VRAM (POST /start_model)...
      Modelo seleccionado: 'gemma-3-4b-it-Q4_K_M.gguf'
      Contexto base guardado: 'Un jugo natural hecho a base de pasto.'...
      [Éxito] Modelo iniciado correctamente.
      ID de sesión asignado: 3f04d6c9-8c1e-4bc2-a9b6-2ad23ab101f5

[+] 4. Ejecutando consultas por perfil (POST /ask_model/{model_id})...

      --- Perfil 1: Daniela Ríos ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Daniela Ríos",
        "interes_compra": "muy bajo + No me gusta la idea de beber pasto, suena a algo muy extraño y poco apetecible.",
        "percepcion_precio": "caro + El precio no está justificado para algo que suena tan poco atractivo.",
        "probabilidad_recomendacion": "no lo recomendaría + A nadie, salvo a alguien con una fascinación muy particular por lo exótico y poco convencional.",
        "comprension": {
          "nivel": "claro",
          "interpretacion": "Quieren vender un jugo hecho con pasto, lo que suena a un producto natural y saludable."
        },
        "caracteristica_destacable": "innovador",
        "caracteristica_repudiable": "poco innovador"
      }
      ----------------------------------------

      --- Perfil 2: Carlos Mendoza ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Carlos Mendoza",
        "interes_compra": "muy bajo + No entiendo por qué alguien querría beber pasto, parece un experimento loco.",
        "percepcion_precio": "barato + Asumo que el precio es muy bajo, considerando lo que es.",
        "probabilidad_recomendacion": "no lo recomendaría + No hay forma de que alguien me lo recomiende, ¡es extraño!",
        "comprension": {
          "nivel": "bastante claro",
          "interpretacion": "Quieren vender un jugo hecho con pasto, es algo bastante directo."
        },
        "caracteristica_destacable": "práctico",
        "caracteristica_repudiable": "poco innovador"
      }
      ----------------------------------------

      --- Perfil 3: Sofía Vargas ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Sofía Vargas",
        "interes_compra": "muy bajo - No entiendo por qué alguien querría beber pasto. ¡Demasiado salvaje para mí!",
        "percepcion_precio": "caro - ¿Por qué pagar tanto por algo que es, esencialmente, hierba?",
        "probabilidad_recomendacion": "no lo recomendaría - No lo recomendaría a mis alumnos de yoga, ni a nadie.",
        "comprension": {
          "nivel": "claro",
          "interpretacion": "Quieren hacerme saber que su jugo es hecho de pasto, y que eso es un ingrediente natural."
        },
        "caracteristica_destacable": "buen slogan",
        "caracteristica_repudiable": "poco innovador"
      }
      ----------------------------------------

      --- Perfil 4: Ricardo Gómez ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Ricardo Gómez",
        "interes_compra": "muy bajo - La idea de un jugo de pasto me parece algo salvaje y sin atractivo, no encaja con mi estilo de vida saludable y bien establecido.",
        "percepcion_precio": "caro -  No justifica el precio por la naturaleza del producto, parece un producto de nicho con un marketing exagerado.",
        "probabilidad_recomendacion": "no lo recomendaría -  No veo ninguna razón para recomendar un jugo de pasto, es un producto peculiar y poco atractivo.",
        "comprension": {
          "nivel": "claro",
          "interpretacion": "Quieren vender un jugo hecho con pasto, lo que suena poco convencional y posiblemente de baja calidad."
        },
        "caracteristica_destacable": "poco innovador",
        "caracteristica_repudiable": "mala calidad percibida"
      }
      ----------------------------------------

      --- Perfil 5: Lucía Sánchez ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Lucía Sánchez",
        "interes_compra": "muy bajo + No entiendo por qué alguien querría beber pasto.  Es un poco repugnante.",
        "percepcion_precio": "barato + El precio sería una ganga si fuera comestible.",
        "probabilidad_recomendacion": "no lo recomendaría +  Es un producto que no recomendaría a nadie, es un riesgo.",
        "comprension": {
          "nivel": "confuso",
          "interpretacion": "Quieren que crean que es un jugo saludable hecho con pasto, lo cual me parece un poco extraño."
        },
        "caracteristica_destacable": "práctico",
        "caracteristica_repudiable": "mala calidad percibida"
      }
      ----------------------------------------

[+] 5. Limpiando y liberando VRAM de la GPU (POST /stop_model/{model_id})...
      ID de modelo a detener: 3f04d6c9-8c1e-4bc2-a9b6-2ad23ab101f5
      [Éxito] Modelo detenido exitosamente
8:23:30 dante@darkstar test main ? python3 test_api.py
==========================================
     INICIANDO TEST SECUENCIAL DE API     
==========================================

[+] 1. Solicitando listado de modelos locales (GET /get_model)...
      [Éxito] Endpoint /get_model respondió correctamente.
      Modelos disponibles encontrados (1):
        1. gemma-3-4b-it-Q4_K_M.gguf

[+] 2. Ejecutando perfilado efímero (POST /create_people_model/)...
      >> Ingrese la descripción del producto que desea evaluar: Un nuevo modelo de iphone
      Enviando request con producto: 'Un nuevo modelo de iphone' al servidor...
      [Éxito] Endpoint /create_people_model/ respondió correctamente.
      ------------------------------------------------------------
      (Datos JSON ya estructurados por la API)
      [
        {
          "nombre": "Daniel Ramirez",
          "edad": 32,
          "ocupacion": "Desarrollador de Software Junior",
          "nivel socioeconomico": "Medio",
          "personalidad": [
            "Innovador",
            "Analítico",
            "Conectado"
          ]
        },
        {
          "nombre": "Sofía Mendoza",
          "edad": 28,
          "ocupacion": "Diseñadora Gráfica Freelance",
          "nivel socioeconomico": "Medio",
          "personalidad": [
            "Creativa",
            "Estética",
            "Profesional"
          ]
        },
        {
          "nombre": "Carlos Sánchez",
          "edad": 55,
          "ocupacion": "Gerente de Ventas (Sector Tecnología)",
          "nivel socioeconomico": "Alto",
          "personalidad": [
            "Confiado",
            "Pragmático",
            "Orientado al éxito"
          ]
        },
        {
          "nombre": "Elena Vargas",
          "edad": 41,
          "ocupacion": "Médica - Especialista en Pediatría",
          "nivel socioeconomico": "Alto",
          "personalidad": [
            "Organizada",
            "Responsable",
            "Atenta"
          ]
        },
        {
          "nombre": "Mateo Torres",
          "edad": 19,
          "ocupacion": "Estudiante de Ingeniería Informática",
          "nivel socioeconomico": "Bajo-Medio",
          "personalidad": [
            "Entusiasta",
            "Curioso",
            "Digital"
          ]
        }
      ]
      ------------------------------------------------------------

      [+] Validando datos estructurados con Pydantic (ConsumerProfile)...
      [Éxito] Se estructuraron correctamente 5 perfiles.

[+] 3. Reservando memoria e iniciando el modelo VRAM (POST /start_model)...
      Modelo seleccionado: 'gemma-3-4b-it-Q4_K_M.gguf'
      Contexto base guardado: 'Un nuevo modelo de iphone'...
      [Éxito] Modelo iniciado correctamente.
      ID de sesión asignado: 8996f94e-74d8-42cd-8401-f3ce0a8841c6

[+] 4. Ejecutando consultas por perfil (POST /ask_model/{model_id})...

      --- Perfil 1: Daniel Ramirez ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Daniel Ramirez",
        "interes_compra": "alto - Como desarrollador, siempre estoy buscando herramientas que mejoren mi productividad y me mantengan al día con las últimas tecnologías.",
        "percepcion_precio": "adecuado - El precio es competitivo considerando las características que ofrece, aunque siempre hay margen para negociar.",
        "probabilidad_recomendacion": "probablemente sí - Si lo pruebo y funciona bien, lo recomendaría a otros desarrolladores, especialmente a los más jóvenes.",
        "comprension": {
          "nivel": "bastante claro",
          "interpretacion": "Es un nuevo modelo de iPhone con mejoras en la cámara, el procesador y la duración de la batería, dirigido a usuarios que buscan un teléfono de alta gama."
        },
        "caracteristica_destacable": "innovador",
        "caracteristica_repudiable": "ninguna"
      }
      ----------------------------------------

      --- Perfil 2: Sofía Mendoza ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Sofía Mendoza",
        "interes_compra": "medio - Me gusta la tecnología, pero necesito que el diseño sea impecable y que tenga funciones que realmente me sirvan, no solo que sean 'cool'.",
        "percepcion_precio": "caro - Los iPhones siempre son caros, y aunque son buenos, hay otras opciones con mejor relación calidad-precio.",
        "probabilidad_recomendacion": "dudoso - Depende mucho de lo que ofrezca en términos de innovación y de si justifica el precio elevado.",
        "comprension": {
          "nivel": "bastante claro",
          "interpretacion": "Quieren vender un nuevo iPhone, destacando probablemente su cámara y diseño, pero sin entrar en detalles técnicos."
        },
        "caracteristica_destacable": "buen diseño",
        "caracteristica_repudiable": "caro"
      }
      ----------------------------------------

      --- Perfil 3: Carlos Sánchez ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Carlos Sánchez",
        "interes_compra": "alto - Como gerente, siempre estoy buscando herramientas que optimicen mi trabajo y me den una ventaja competitiva. Este iPhone parece tener funciones que me ayudarían a ser más productivo.",
        "percepcion_precio": "caro -  Aunque mi nivel socioeconómico lo permite, 1000€ por un teléfono es una inversión importante.  Necesito ver un retorno claro de la inversión.",
        "probabilidad_recomendacion": "probablemente sí - Si el rendimiento es como dicen y realmente me facilita la gestión de mis contactos y presentaciones, lo recomendaría a otros colegas.",
        "comprension": {
          "nivel": "bastante claro",
          "interpretacion": "Me está vendiendo el iPhone como una herramienta de productividad y conectividad avanzada, ideal para alguien como yo que está en el sector tecnológico."
        },
        "caracteristica_destacable": "innovador",
        "caracteristica_repudiable": "caro"
      }
      ----------------------------------------

      --- Perfil 4: Elena Vargas ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Elena Vargas",
        "interes_compra": "medio - Como médica, valoro la tecnología que facilita mi trabajo y el bienestar de mis pacientes, pero el precio de un iPhone es un compromiso.",
        "percepcion_precio": "caro -  Son muy caros, especialmente considerando que hay alternativas más enfocadas en mi profesión.",
        "probabilidad_recomendacion": "dudoso -  Depende de las funcionalidades específicas y si realmente mejoran mi flujo de trabajo. Necesito ver más detalles.",
        "comprension": {
          "nivel": "bastante claro",
          "interpretacion": "Es un nuevo modelo de iPhone con características avanzadas, probablemente enfocado en la fotografía y la productividad."
        },
        "caracteristica_destacable": "buen diseño",
        "caracteristica_repudiable": "caro"
      }
      ----------------------------------------

      --- Perfil 5: Mateo Torres ---
      Respuesta del modelo:
      ----------------------------------------
      {
        "nombre": "Mateo Torres",
        "interes_compra": "alto - Como estudiante, siempre estoy buscando la última tecnología y este iPhone parece tener muchas funciones interesantes para la productividad y el entretenimiento.",
        "percepcion_precio": "bajo - Para mi presupuesto, parece una buena oferta, especialmente considerando las actualizaciones que ofrece.",
        "probabilidad_recomendacion": "seguro lo recomendaría - Tiene todo lo que necesito en un teléfono y además es una marca de confianza.",
        "comprension": {
          "nivel": "claro",
          "interpretacion": "Quieren venderme el nuevo modelo de iPhone, destacando sus funciones avanzadas y su diseño innovador."
        },
        "caracteristica_destacable": "innovador",
        "caracteristica_repudiable": "ninguna"
      }
      ----------------------------------------

[+] 5. Limpiando y liberando VRAM de la GPU (POST /stop_model/{model_id})...
      ID de modelo a detener: 8996f94e-74d8-42cd-8401-f3ce0a8841c6
      [Éxito] Modelo detenido exitosamente

```