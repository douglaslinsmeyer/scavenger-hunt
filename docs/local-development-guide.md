# Local Development Guide

This guide will help you set up and run the Scavenger Hunt application in your local development environment using Kubernetes and Skaffold.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** with Kubernetes enabled (or Minikube/Kind)
- **kubectl** - Kubernetes command-line tool
- **Skaffold** v2.16+ - For automated development workflow
- **Node.js** 22+ - For local development without containers
- **npm** - Package manager

### Installing Prerequisites

#### macOS
```bash
# Install Skaffold
brew install skaffold

# Install kubectl
brew install kubectl

# Enable Kubernetes in Docker Desktop
# Go to Docker Desktop → Preferences → Kubernetes → Enable Kubernetes
```

#### Linux/WSL
```bash
# Install Skaffold
curl -Lo skaffold https://storage.googleapis.com/skaffold/releases/latest/skaffold-linux-amd64
sudo install skaffold /usr/local/bin/

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

## Initial Setup

### 1. Verify Kubernetes is Running

```bash
kubectl cluster-info
```

You should see output indicating the Kubernetes control plane is running.

### 2. Install NGINX Gateway Controller

The application uses NGINX Gateway Fabric for ingress. If not already installed:

```bash
# Check if nginx gatewayclass exists
kubectl get gatewayclass

# If not present, install NGINX Gateway Fabric
# Follow the official installation guide at:
# https://docs.nginx.com/nginx-gateway-fabric/installation/
```

### 3. Create Development Namespace

The development namespace will be created automatically by Skaffold, but you can create it manually if needed:

```bash
kubectl create namespace scavenger-hunt-dev
```

## Running the Application

### Quick Start with Skaffold

From the project root directory, simply run:

```bash
skaffold dev
```

This command will:
1. Build all Docker images (backend, admin, player)
2. Deploy all Kubernetes resources
3. Set up port forwarding
4. Watch for file changes and automatically redeploy

### What Gets Deployed

- **Backend API** - Express.js API server
- **Admin Dashboard** - Next.js admin interface
- **Player App** - Next.js player interface
- **PostgreSQL** - Database with persistent storage
- **Redis** - Session store and caching
- **NGINX Gateway** - Ingress controller with routing rules

### Access Points

Once Skaffold is running, you can access:

- **Backend API**: http://localhost:3000
  - Health check: http://localhost:3000/api/health
  - API documentation: http://localhost:3000/api-docs
  
- **Player App**: http://localhost:3001
  - Health check: http://localhost:3001/health
  
- **Admin Dashboard**: http://localhost:3002
  - Health check: http://localhost:3002/admin/health

## Development Workflow

### Hot Reload

Skaffold is configured with file sync for rapid development:

- **Backend**: TypeScript files in `src/` are synced and the server restarts
- **Frontend**: Next.js hot reload works automatically
- **Database changes**: Require manual migration (see Database section)

### Making Changes

1. Edit your code normally
2. Skaffold detects changes and syncs/rebuilds as needed
3. Changes appear automatically (frontend) or after restart (backend)

### Viewing Logs

```bash
# View all logs
skaffold dev

# View specific service logs
kubectl logs -f deployment/dev-backend -n scavenger-hunt-dev
kubectl logs -f deployment/dev-admin -n scavenger-hunt-dev
kubectl logs -f deployment/dev-player -n scavenger-hunt-dev
```

### Debugging

```bash
# Check pod status
kubectl get pods -n scavenger-hunt-dev

# Describe a pod for more details
kubectl describe pod <pod-name> -n scavenger-hunt-dev

# Execute commands in a running container
kubectl exec -it <pod-name> -n scavenger-hunt-dev -- /bin/sh
```

## Database Management

### Accessing PostgreSQL

```bash
# Get postgres pod name
kubectl get pods -n scavenger-hunt-dev | grep postgres

# Connect to PostgreSQL
kubectl exec -it <postgres-pod-name> -n scavenger-hunt-dev -- psql -U postgres -d scavenger_hunt
```

### Running Migrations

```bash
# From your local machine (ensure DATABASE_URL is set)
cd backend
npm run migrate:dev

# Or exec into the backend pod
kubectl exec -it <backend-pod-name> -n scavenger-hunt-dev -- npm run migrate:dev
```

### Database Persistence

The development environment uses PersistentVolumeClaims to maintain data between restarts. Data is stored in:
- PostgreSQL: 1Gi PVC
- Redis: 512Mi PVC

## Environment Configuration

### Backend Environment Variables

Default development values are set in the ConfigMap:
- `NODE_ENV=development`
- `DATABASE_URL=postgresql://postgres:password@dev-postgres:5432/scavenger_hunt`
- `REDIS_URL=redis://dev-redis:6379`

### Frontend Environment Variables

- `NODE_ENV=development`
- `API_URL=http://dev-backend:3000`
- Player app runs on port 3001
- Admin app runs on port 3002 with basePath `/admin`

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n scavenger-hunt-dev

# Common causes:
# - Image pull errors: Ensure Docker is running
# - Health check failures: Check the health endpoints
# - Resource limits: Ensure Docker has enough resources
```

#### 2. Port Forwarding Not Working

```bash
# Kill any existing port forwards
pkill -f "kubectl port-forward"

# Restart Skaffold
skaffold dev
```

#### 3. Database Connection Issues

```bash
# Verify PostgreSQL is running
kubectl get pod -n scavenger-hunt-dev | grep postgres

# Check PostgreSQL logs
kubectl logs deployment/dev-postgres -n scavenger-hunt-dev
```

#### 4. Admin App Health Check Failures

The admin app uses a basePath of `/admin`, so health checks must use `/admin/health` not just `/health`.

### Clean Slate

To completely reset your development environment:

```bash
# Stop Skaffold (Ctrl+C)

# Delete the namespace
kubectl delete namespace scavenger-hunt-dev

# Restart
skaffold dev
```

## Advanced Configuration

### Using Different Profiles

```bash
# Run with staging configuration
skaffold dev -p staging

# Run with production configuration
skaffold dev -p production
```

### Building Without Deploying

```bash
# Just build images
skaffold build

# Build and push to registry
skaffold build --push
```

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend/player && npm test
cd frontend/admin && npm test

# Integration tests (requires running environment)
npm run test:integration
```

## Tips and Best Practices

1. **Resource Usage**: The full stack uses ~2GB RAM. Ensure Docker Desktop has at least 4GB allocated.

2. **File Watching**: Skaffold watches for changes in:
   - `backend/src/**/*.ts`
   - `frontend/*/app/**/*.tsx`
   - `frontend/*/app/**/*.ts`

3. **Debugging**: Use `kubectl logs -f` to tail logs in real-time

4. **Performance**: For faster builds, ensure Docker BuildKit is enabled (default in recent versions)

5. **Cleanup**: Always use `Ctrl+C` to stop Skaffold - it will clean up resources automatically

## Next Steps

- Review the [Architecture Documentation](./architecture-plan.md)
- Check the [API Specification](./api-specification.md)
- Read about [Feature Development](./features/README.md)
- Learn about [Deployment](./INFRASTRUCTURE.md)

## Getting Help

- Check container logs for error messages
- Review the Skaffold output for build/deploy issues
- Ensure all prerequisites are correctly installed
- Verify Kubernetes cluster is healthy with `kubectl cluster-info`

For more help, consult the project README or open an issue in the repository.