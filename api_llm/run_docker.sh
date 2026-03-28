#!/bin/bash
set -e

IMAGE_NAME="llama-api-gpu"
PORT=8000

# 1. Detectar automáticamente si se necesita sudo para Docker
DOCKER_CMD="docker"
if ! docker info >/dev/null 2>&1; then
    DOCKER_CMD="sudo docker"
fi

# 2. Argumento opcional para forzar la compilación (./run_docker.sh --build)
BUILD=false
if [[ "$1" == "--build" || "$1" == "-b" ]]; then
    BUILD=true
fi

# 3. Si la imagen no está cacheada, forzamos la compilación
if ! $DOCKER_CMD image inspect $IMAGE_NAME >/dev/null 2>&1; then
    echo "[!] La imagen local '$IMAGE_NAME' no existe. Forzando compilación..."
    BUILD=true
fi

if [ "$BUILD" = true ]; then
    echo "[+] 🛠️ Construyendo imagen de Docker (compilando CUDA)..."
    $DOCKER_CMD build -t $IMAGE_NAME .
else
    echo "[*] ✔️ Imagen base detectada. Omitiendo compilación."
    echo "    (Para actualizar dependencias, ejecuta: './run_docker.sh --build')"
fi

echo ""
echo "[+] 🚀 Iniciando API de FastAPI con aceleración GPU de NVIDIA..."
echo "       Documentación Activa en: http://localhost:$PORT/docs"
echo ""

# 4. Levantar el contenedor montando los scripts en vivo
$DOCKER_CMD run --rm -it \
    --gpus all \
    -p $PORT:$PORT \
    -v "$(pwd):/app" \
    --name llama_api \
    $IMAGE_NAME
