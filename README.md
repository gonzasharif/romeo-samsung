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
