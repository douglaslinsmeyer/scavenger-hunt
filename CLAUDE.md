# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scavenger Hunt is a web application for organizing and participating in location-based scavenger hunts. Key characteristics:
- Private hunts accessed via invitation links (no public discovery)
- Dual authentication: Social login for organizers, simple username/PIN for players
- Real-time updates via WebSockets
- Photo submission tasks with manual verification
- Offline-first design with sync capabilities

## Architecture

### Backend: Modular Monolith
- **Framework**: Express.js with TypeScript
- **Structure**: Feature-based modules (Auth, Hunts, Tasks, etc.)
- **Patterns**: Repository pattern, Service layer, Dependency Injection (tsyringe/InversifyJS)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Real-time**: Socket.io with room-based architecture
- **Cache**: Redis for sessions, WebSocket adapter, rate limiting

### Frontend Applications
1. **Admin Dashboard**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
2. **Player App**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui

### Key Architectural Decisions
- REST API over GraphQL (simpler for defined requirements)
- Modular monolith over microservices (reduced complexity)
- JWT authentication with role-based access control
- WebSockets (Socket.io) for real-time features
- Kubernetes deployment with Kustomize for environment management

## Data Model

### Users vs Players
- **Users**: Admins/Organizers with social auth (Google/Facebook)
- **Players**: Hunt-specific accounts with username/PIN (no email required)

### Core Entities
- Hunt (states: draft → active → paused/completed)
- Task (types: photo, checkbox, GPS)
- TaskCompletion (with photo submissions)
- HuntOrganizer (many-to-many)
- HuntPlayer (with team assignments)

## Development Commands

```bash
# Install all dependencies (uses npm workspaces)
npm install

# Development (all services)
npm run dev                     # Start all services concurrently
docker-compose up               # Start with Docker
docker-compose up -d            # Start in background

# Backend development
cd backend
npm run dev                     # Start with hot reload
npm run test                    # Run tests (80% coverage required)
npm run test:deployment         # Run deployment tests
npm run lint                    # ESLint with TypeScript rules
npm run build                   # TypeScript compilation
npm run migrate:dev             # Prisma migrations (when implemented)

# Player frontend
cd frontend/player
npm run dev                     # Next.js dev server (port 3001)
npm run build                   # Production build
npm run test                    # Jest tests
npm run test:deployment         # Deployment tests
npm run lint                    # ESLint

# Admin dashboard
cd frontend/admin
npm run dev                     # Next.js dev server (port 3002)
npm run build                   # Production build
npm run test                    # Jest tests
npm run test:deployment         # Deployment tests
npm run lint                    # ESLint

# Docker/Kubernetes local development
docker-compose up -d            # Start all services
docker-compose ps               # Check service status
docker-compose logs [service]   # View logs
docker-compose down             # Stop and remove containers

# Kubernetes with Skaffold (PREFERRED for development)
skaffold dev                    # Hot reload with automatic port forwarding
# Access points when running:
# - Backend API: http://localhost:3000
# - Player App: http://localhost:3001  
# - Admin Dashboard: http://localhost:3002/admin
# Note: Admin app has basePath /admin, so health check is at /admin/health

kubectl apply -k kustomize/overlays/development

# Tests
npm test                        # Run all tests
npm run test:deployment         # Run deployment tests

# Database (when fully implemented)
docker-compose up postgres redis  # Local services
npx prisma studio                # Database GUI
```

## Project Structure

```
backend/
  src/
    modules/         # Feature modules (auth, hunts, tasks)
    shared/          # Cross-cutting concerns
    infrastructure/  # External services, database
frontend/
  player/           # Next.js player app
  admin/            # React admin dashboard
kustomize/          # Kubernetes configurations
  base/
  overlays/         # Environment-specific configs
```

## Key Implementation Notes

### Authentication Flow
- Organizers: OAuth2 social login → JWT tokens
- Players: Hunt invite link → Username selection → 4-digit PIN → Hunt-specific JWT

### Real-time Updates
- Hunt-specific Socket.io rooms
- Events: task completions, leaderboard updates, hunt state changes
- Automatic reconnection with state sync

### Photo Handling
- Client-side compression before upload
- EXIF data stripped for privacy
- Manual verification by organizers
- Stored in Kubernetes PersistentVolume

### Offline Capabilities
- Service Workers with Workbox
- Queue system for photo uploads
- Local storage for task completions
- Automatic sync on reconnection

### Performance Targets
- Designed for 10-20 concurrent users per hunt
- <3s page load time
- <500ms WebSocket message delivery

## Testing Strategy

- Unit tests: Services, utilities (Jest/Vitest)
- Integration tests: API endpoints, database operations
- E2E tests: Critical user flows (Playwright)
- Minimum 80% code coverage

## Security Considerations

- HTTPS everywhere (enforced in production)
- Input validation with express-validator/zod
- Rate limiting on all endpoints
- CORS configured per environment
- JWT tokens with appropriate expiration
- Photo uploads limited by size and type

## Local Development Setup

### Prerequisites
- Docker Desktop with Kubernetes enabled (or Minikube/Kind)
- Skaffold v2.16+ for automated development workflow
- kubectl for Kubernetes management
- NGINX Gateway Controller installed in cluster (gatewayclass: nginx)

### Known Issues & Solutions
1. **GatewayClass conflict**: The base kustomization includes gatewayclass.yaml but this conflicts with existing NGINX Gateway Controller. Removed from base/gateway-api/kustomization.yaml
2. **ObservabilityPolicy API version**: Must use v1alpha2, not v1alpha1. Only tracing is supported in v1alpha2.
3. **Admin health checks**: The admin app uses basePath `/admin`, so health checks must use `/admin/health` not `/health`
4. **Next.js standalone builds**: Both frontend apps use `output: 'standalone'` for smaller Docker images

### Development Workflow
1. Run `skaffold dev` from project root
2. Wait for all pods to be ready (check with `kubectl get pods -n scavenger-hunt-dev`)
3. Access services via localhost with automatic port forwarding
4. File changes trigger automatic rebuilds/redeployments
5. Use Ctrl+C to stop - Skaffold will clean up resources

## Deployment

- **Local**: Docker Desktop/Minikube/Kind with Skaffold
- **Staging/Production**: Kubernetes on Rackspace
- **CI/CD**: GitHub Actions with automated tests
- **Monitoring**: Prometheus + Grafana, ELK stack for logs

## Important Business Rules

1. All hunts are private - no public listing/search
2. Players don't need email addresses
3. PIN reset is manual by admins/organizers
4. Cooperative mode shares points among all players
5. Photo tasks require manual verification
6. Points can be disabled per hunt
7. Bulk task import supports JSON format
8. Multi-language support with i18n

## Dependency Management
- We should use the most recent versions of all dependencies that we can.