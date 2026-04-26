#!/bin/bash
set -e

# Vultr GPU Instance Setup Script for Gemma 4
# Recommended: NVIDIA A100 or A40 instance with Ubuntu 22.04

echo "=== Vultr Gemma 4 Setup ==="

# Update system
echo "Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install NVIDIA Container Toolkit
echo "Installing NVIDIA Container Toolkit..."
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker

# Verify GPU access
echo "Verifying GPU access..."
nvidia-smi

# Create working directory
mkdir -p ~/gemma-server
cd ~/gemma-server

# Copy docker-compose.yml (assumes it's in the same directory as this script)
if [ -f "docker-compose.yml" ]; then
    echo "docker-compose.yml found"
else
    echo "ERROR: docker-compose.yml not found. Copy it to ~/gemma-server/"
    exit 1
fi

# Check for HuggingFace token
if [ -z "$HUGGING_FACE_HUB_TOKEN" ]; then
    echo ""
    echo "WARNING: HUGGING_FACE_HUB_TOKEN not set."
    echo "You need a HuggingFace token with access to google/gemma-3-27b-it"
    echo ""
    echo "To set it:"
    echo "  export HUGGING_FACE_HUB_TOKEN=your_token_here"
    echo ""
    echo "Then run: docker compose up -d"
    exit 0
fi

# Start the service
echo "Starting vLLM server with Gemma 4..."
docker compose up -d

echo ""
echo "=== Setup Complete ==="
echo ""
echo "The vLLM server is starting. This may take 5-10 minutes on first run"
echo "as it downloads the Gemma 4 model weights (~50GB)."
echo ""
echo "Check status: docker compose logs -f"
echo "Test endpoint: curl http://localhost:8000/v1/models"
echo ""
echo "Once running, set in your app's .env:"
echo "  AI_PROVIDER=gemma-vultr"
echo "  VULTR_GEMMA_URL=http://YOUR_VULTR_IP:8000"
