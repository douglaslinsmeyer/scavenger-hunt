# Scavenger Hunt Application

A location-based scavenger hunt web application with real-time updates and offline capabilities.

## Project Structure

```
scavenger-hunt/
├── backend/           # Express.js API server
├── frontend/
│   ├── player/       # Next.js player application
│   └── admin/        # Next.js admin dashboard
├── kustomize/        # Kubernetes configurations
├── .github/          # GitHub Actions CI/CD
└── docker-compose.yml # Local development
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- kubectl (for Kubernetes deployment)
- Skaffold (optional, for K8s development)

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/douglaslinsmeyer/scavenger-hunt.git
   cd scavenger-hunt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start with Docker Compose:
   ```bash
   docker-compose up
   ```

5. Access the applications:
   - Backend API: http://localhost:3000/health
   - Player App: http://localhost:3001
   - Admin Dashboard: http://localhost:3002
   - Nginx Proxy: http://localhost

### Running Tests

Run all tests:
```bash
npm test
```

Run deployment tests:
```bash
npm run test:deployment
```

### Kubernetes Development

Using Skaffold:
```bash
skaffold dev
```

Using kubectl:
```bash
kubectl apply -k kustomize/overlays/development
```

## CI/CD Pipeline

The GitHub Actions pipeline automatically:
1. Runs tests on all components
2. Builds Docker images
3. Pushes to GitHub Container Registry
4. Deploys to Kubernetes (when configured)

## Architecture

- **Backend**: Express.js with TypeScript (modular monolith)
- **Frontend**: Two Next.js applications (player and admin)
- **Database**: PostgreSQL (future implementation)
- **Cache**: Redis (future implementation)
- **Real-time**: Socket.io (future implementation)
- **Deployment**: Kubernetes with Kustomize

## Testing

Following TDD principles with:
- Unit tests for all components
- Integration tests for APIs
- E2E tests for critical flows
- Deployment verification tests
- Minimum 80% code coverage target

## License

MIT