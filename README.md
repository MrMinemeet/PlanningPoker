# PlanningPoker
Basic Implementation of a Web-based poker planning page

## Docker Deployment

The application can be run as a single Docker container that includes both the backend and frontend.

### Quick Start

1. **Using the provided script (easiest):**
   ```bash
   ./run-docker.sh
   ```

2. **Using Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Using Docker directly:**
   ```bash
   # Build the image
   docker build -t planning-poker:latest .
   
   # Run the container
   docker run -d \
     --name planning-poker-app \
     -p 3000:3000 \
     --restart unless-stopped \
     planning-poker:latest
   ```

### Access the Application

Once running, the application will be available at:
- **Local:** http://localhost:3000
- **Network:** http://YOUR_SERVER_IP:3000

### Container Management

```bash
# View logs
docker logs planning-poker-app

# Stop the container
docker stop planning-poker-app

# Start the container
docker start planning-poker-app

# Restart the container
docker restart planning-poker-app

# Remove the container
docker rm planning-poker-app

# Remove the image
docker rmi planning-poker:latest
```

### Production Deployment

For production deployment, consider:

1. **Using a reverse proxy** (nginx, traefik) for SSL termination
2. **Setting up persistent volumes** if you need to store data
3. **Using environment variables** for configuration
4. **Health checks and monitoring**

Example with nginx reverse proxy:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Development

For development setup, see the individual README files in the `backend/` and `frontend/` directories.
