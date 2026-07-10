#!/bin/bash
# ZAKSOFT AI Secure Platform — Deploy (run on VPS)
set -e

APP_DIR="/opt/zaksoft"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "=== Deploying ZAKSOFT ==="

cd "$APP_DIR"

# Pull latest code
git pull origin main

# Rebuild & restart
$COMPOSE down
$COMPOSE up -d --build

# Remove dangling images
docker image prune -f

echo "✅ Deployed! Checking health..."
sleep 5
curl -sf http://localhost/api/health && echo " — API OK" || echo " — API not responding yet (give it 10s)"
