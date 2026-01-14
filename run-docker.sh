#!/bin/bash

# Script to build and run the Planning Poker Docker container

echo "Building Planning Poker Docker image..."
docker build -t planning-poker:latest .

echo "Stopping any existing container..."
docker stop planning-poker-app 2>/dev/null || true
docker rm planning-poker-app 2>/dev/null || true

echo "Starting Planning Poker container..."
docker run -d \
  --name planning-poker-app \
  -p 3000:3000 \
  --restart unless-stopped \
  planning-poker:latest

echo "Planning Poker is now running on http://localhost:3000"
echo ""
echo "To view logs: docker logs planning-poker-app"
echo "To stop: docker stop planning-poker-app"
echo "To restart: docker restart planning-poker-app"