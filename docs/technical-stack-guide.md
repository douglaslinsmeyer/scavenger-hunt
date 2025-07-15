# Technical Stack Guide - Scavenger Hunt Application

## Overview
This guide outlines the recommended technical stack for each component of the scavenger hunt application, covering both local development and production deployment via Kubernetes.

## Component Architecture

### 1. Backend API Service
**Purpose**: REST API server handling business logic, authentication, and database operations

**Tech Stack**:
- **Runtime**: Node.js v20 LTS
- **Framework**: Express.js with TypeScript
- **WebSockets**: Socket.io for real-time updates
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Authentication**: 
  - Passport.js with JWT strategy
  - Social auth providers (Google, Facebook OAuth2)
- **API Documentation**: OpenAPI/Swagger with swagger-ui-express
- **Validation**: Joi for request validation
- **File Upload**: Multer for photo handling
- **Testing**: Jest, Supertest
- **Logging**: Winston with correlation IDs
- **Process Management**: PM2 (production) or nodemon (development)

### 2. Admin Dashboard
**Purpose**: React-based admin panel for platform management

**Tech Stack**:
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Material-UI (MUI)
- **State Management**: Redux Toolkit with RTK Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with Yup validation
- **Charts**: Recharts for analytics
- **Tables**: TanStack Table (React Table v8)
- **Authentication**: JWT stored in httpOnly cookies
- **Testing**: Vitest, React Testing Library

**Production Build**:
- Static build served via Nginx
- Environment variable injection at runtime
- Code splitting and lazy loading

### 3. Player Frontend
**Purpose**: Mobile-first web app for hunt participants

**Tech Stack**:
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand for client state
- **Real-time**: Socket.io-client
- **Maps**: Leaflet for GPS tasks
- **Camera**: `react-camera-pro` to provide a consistent abstraction over the native camera API, normalizing for different devices and capabilities.
- **Offline**: Service Workers with Workbox
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form
- **Testing**: Jest, React Testing Library, Playwright (E2E)

**Production Optimizations**:
- Image optimization with next/image
- Font optimization
- API route handlers for a Backend-For-Frontend (BFF) pattern, acting as a simple proxy to the main backend to start, with the flexibility to add aggregation or transformation logic later.
- Static generation where possible
- Incremental Static Regeneration (ISR)

## Shared Services

### 4. PostgreSQL Database
**Configuration**:
- Version: PostgreSQL 15+
- Extensions: UUID (standard latitude/longitude calculations are sufficient for GPS features, so PostGIS is not required).

### 5. Redis Cache
**Purpose**: Session storage, real-time data, and caching
- Version: Redis 7+
- Use cases:
  - JWT blacklist
  - Socket.io adapter
  - API response caching
  - Rate limiting storage

### 6. File Storage
**Local Development**: Docker volume mount
**Production**: 
- Primary: Kubernetes PersistentVolume (simple file storage on a persistent volume)

## Development and Deployment Strategy

### Local Kubernetes Development
Local development should mirror the production environment by using a local Kubernetes cluster. Tools like **Minikube** or **Kind** are recommended.

This approach ensures that developers work in an environment that is as close to production as possible. Tools like `skaffold` can be used to automate the build and deploy cycle to the local cluster, providing a seamless development experience.

### Environment Configuration with Kustomize
To manage the differences between local, staging, and production environments, **Kustomize** will be used. This allows for a declarative approach to configuration, keeping a clean separation between base configurations and environment-specific overrides.

The recommended structure is as follows:
- **`kustomize/base`**: Contains the base Kubernetes resource manifests (Deployments, Services, Ingress, etc.) that are common across all environments.
- **`kustomize/overlays/local`**: Contains patches for local development (e.g., lower replica counts, different resource limits, `NodePort` services).
- **`kustomize/overlays/staging`**: Contains patches for the staging environment.
- **`kustomize/overlays/production`**: Contains patches for the production environment (e.g., higher replica counts, production resource limits, production environment variables).

The CI/CD pipeline will then use `kubectl apply -k kustomize/overlays/<environment>` to deploy the appropriate configuration.

## Kubernetes Production Deployment Manifests
This section contains examples of the base Kubernetes manifests. Environment-specific values will be applied via Kustomize overlays.

### Namespace Structure
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: scavenger-hunt-prod
---
apiVersion: v1
kind: Namespace
metadata:
  name: scavenger-hunt-staging
```

### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
  namespace: scavenger-hunt-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend-api
  template:
    # ... template spec ...
```

### Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: scavenger-hunt-ingress
  namespace: scavenger-hunt-prod
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/proxy-body-size: "10m" # 10MB limit is a reasonable default for photo uploads.
# ... spec ...
```

### Persistent Storage
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: photo-storage
  namespace: scavenger-hunt-prod
spec:
  accessModes:
    - ReadWriteOnce # Sufficient for single-pod access. For multi-pod, S3-compatible storage is recommended.
  storageClassName: standard
  resources:
    requests:
      storage: 50Gi
```

## CI/CD Pipeline (GitHub Actions)
The CI/CD pipeline automates testing and deployment. The strategy is as follows:
- **Unit Tests**: Run on every commit.
- **Integration Tests**: Run on every commit, spinning up a temporary database.
- **End-to-End (E2E) Tests**: Run on every pull request to `main`, deploying the app to a temporary environment and testing user flows with Playwright.

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ... test jobs (unit, integration) ...

  build-and-push:
    # ... build and push docker images ...

  deploy-to-production:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: build-and-push
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # Update the image tag in the production overlay using Kustomize
          cd kustomize/overlays/production
          kustomize edit set image your-registry/scavenger-hunt-backend=your-registry/scavenger-hunt-backend:${{ github.sha }}
          # ... repeat for other images ...
          
          # Apply the kustomized configuration to the cluster
          kubectl apply -k .
```

## Monitoring and Observability

### Prometheus Metrics
- API response times
- WebSocket connections
- Database query performance
- Photo upload sizes
- Hunt participation rates

### Grafana Dashboards
- System health overview
- Hunt activity metrics
- User engagement analytics
- Error rate tracking

### ELK Stack for Logging
- Elasticsearch for log storage
- Logstash for log processing
- Kibana for visualization

## Security Considerations

1. **Network Policies**: Restrict pod-to-pod communication
2. **Secrets Management**: Use Kubernetes secrets or external secret manager
3. **RBAC**: Implement proper role-based access control
4. **Image Scanning**: Scan Docker images for vulnerabilities
5. **TLS**: Enforce HTTPS everywhere with cert-manager
6. **WAF**: Consider a Web Application Firewall for additional protection

## Backup and Disaster Recovery

1. **Database Backups**: Automated daily PostgreSQL backups to object storage
2. **Photo Backups**: Replicate photo storage to backup location
3. **Configuration Backups**: All Kubernetes configurations stored in version control (Infrastructure as Code).
4. **Disaster Recovery Plan**: Document RTO/RPO requirements and procedures

## Performance Optimization

1. **CDN**: Use CloudFlare or similar for static assets
2. **Database Indexing**: Proper indexes on frequently queried columns
3. **Caching Strategy**: Redis for API responses and session data
4. **Horizontal Pod Autoscaling**: Scale based on CPU/memory usage
5. **Image Optimization**: Compress and resize photos on upload

## Development Workflow

1. **Feature Branches**: Create feature branches from develop
2. **Environment Promotion**: dev → staging → production
3. **Database Migrations**: Use Prisma migrations with version control
4. **Code Reviews**: Required PR reviews before merging
5. **Testing Requirements**: Minimum 80% code coverage