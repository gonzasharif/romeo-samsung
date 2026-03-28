FROM nvidia/cuda:12.2.2-devel-ubuntu22.04

# Prevenir prompts interactivos durante apt
ENV DEBIAN_FRONTEND=noninteractive

# Instalar Python 3 y dependencias de compilación
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python-is-python3 \
    ninja-build \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Forzar la compilación con CUDA e instalar dependencias
ENV CMAKE_ARGS="-DGGML_CUDA=on"
RUN pip3 install --no-cache-dir llama-cpp-python fastapi uvicorn[standard] pydantic

# Establecer directorio de trabajo
WORKDIR /app

# Exponer el puerto de la API
EXPOSE 8000

# Al iniciar, levantar el server de Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
