#!/bin/bash
set -e

# Vultr CPU Instance Setup Script for Gemma 27B
# Recommended: vx1-m-96c-768gb (96 vCPUs, 768GB RAM)

echo "=== Vultr Gemma 27B CPU Setup (Ollama) ==="

# Update system
echo "Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose plugin
echo "Installing Docker Compose..."
sudo apt-get install -y docker-compose-plugin

# Create working directory
mkdir -p ~/gemma-server
cd ~/gemma-server

# Check for docker-compose.cpu.yml
if [ ! -f "docker-compose.cpu.yml" ]; then
    echo "Downloading docker-compose.cpu.yml..."
    # Copy from repo or download
    cat > docker-compose.yml << 'EOF'
version: "3.8"

services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-models:/root/.ollama
    environment:
      - OLLAMA_NUM_PARALLEL=2
      - OLLAMA_MAX_LOADED_MODELS=1
      - OLLAMA_KEEP_ALIVE=24h
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s

  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_API_BASE=http://ollama:11434
    command: --model ollama/gemma3:27b --port 8000 --host 0.0.0.0
    depends_on:
      ollama:
        condition: service_healthy
    restart: unless-stopped

volumes:
  ollama-models:
EOF
else
    cp docker-compose.cpu.yml docker-compose.yml
fi

# Start Ollama first
echo "Starting Ollama..."
docker compose up -d ollama

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
    echo "  Waiting for Ollama..."
    sleep 5
done

# Pull the Gemma 27B model (this takes 20-40 minutes)
echo ""
echo "Pulling Gemma 27B model..."
echo "This will download ~16GB and may take 20-40 minutes."
echo ""
docker exec -it $(docker ps -qf "name=ollama") ollama pull gemma3:27b

# Start LiteLLM proxy
echo "Starting LiteLLM proxy..."
docker compose up -d litellm

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Gemma 27B is running on CPU via Ollama."
echo ""
echo "Test the endpoint:"
echo "  curl http://localhost:8000/v1/models"
echo ""
echo "Test a completion:"
echo "  curl http://localhost:8000/v1/chat/completions \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"model\": \"ollama/gemma3:27b\", \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]}'"
echo ""
echo "Configure your app's .env:"
echo "  AI_PROVIDER=gemma-vultr"
echo "  VULTR_GEMMA_URL=http://$(curl -s ifconfig.me):8000"
echo ""
echo "NOTE: CPU inference is slower than GPU. Expect 15-45 seconds per request."
