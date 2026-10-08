#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 CAB SYSTEM - DEPLOY TO LOCAL DOCKER ENGINE"
echo "=========================================================="

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

USERNAME=${DOCKERHUB_USERNAME:-nguyenhuuloc0303}
export DOCKERHUB_USERNAME=$USERNAME

echo "📦 Using Docker Hub Username: $DOCKERHUB_USERNAME"

echo ""
echo "[1/3] Pulling latest images from Docker Hub..."
docker compose -f docker-compose-prod.yaml pull

echo ""
echo "[2/3] Starting containers on Local Docker Engine..."
docker compose -f docker-compose-prod.yaml up -d --remove-orphans

echo ""
echo "[3/3] Checking container health status..."
sleep 5

if curl -s http://localhost:3000/health | grep -q '"status":"UP"'; then
  echo "✅ Health Check Succeeded!"
  curl -s http://localhost:3000/health
else
  echo "⚠️ Containers are still warming up. Check status with: docker compose -f docker-compose-prod.yaml ps"
fi

echo ""
echo "Deployment completed! 🎉"
