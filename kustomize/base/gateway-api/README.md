# NGINX Fabric Gateway Configuration

This directory contains the NGINX Fabric Gateway configuration for the Scavenger Hunt application using the Kubernetes Gateway API.

## Overview

NGINX Fabric Gateway provides a modern, scalable gateway solution that replaces traditional Ingress controllers with the more flexible Gateway API standard.

## Architecture

### Components

1. **NGINX Fabric Controller** - Manages Gateway API resources
2. **Gateway** - Entry point for all traffic
3. **HTTPRoutes** - Define routing rules for services
4. **Policies** - Configure rate limiting, timeouts, observability, etc.

### Traffic Flow

```
Internet → LoadBalancer → NGINX Gateway → HTTPRoutes → Services
                                         ↓
                                    Policies Applied
```

## Resources

### Gateway API Resources

- **GatewayClass**: Defines NGINX Fabric as the controller
- **Gateway**: Configures listeners for HTTP, HTTPS, and WebSocket traffic
- **HTTPRoutes**: 
  - `backend-api-route`: Routes `/api/*` and `/socket.io/*` to backend
  - `admin-dashboard-route`: Routes `/admin/*` to admin app
  - `player-app-route`: Routes `/` to player app (default)
  - `https-redirect`: Redirects HTTP to HTTPS

### Policy Resources

- **Rate Limiting**: Different limits for API (100/min), Admin (300/min), Player (500/min)
- **Timeouts**: Standard 30s for API, extended 3600s for WebSocket
- **Client Body Size**: 50MB for API (photo uploads), 10MB for admin, 5MB for player
- **Observability**: Access logs, Prometheus metrics, OpenTelemetry tracing
- **TLS**: Automatic certificate management with cert-manager

## Environment Configuration

### Production
- Domain: `scavengerhunt.example.com`
- TLS: Let's Encrypt production certificates
- Strict rate limits and security headers
- 5% tracing sample rate

### Staging
- Domain: `staging.scavengerhunt.example.com`
- TLS: Let's Encrypt staging certificates
- Relaxed rate limits for testing
- 50% tracing sample rate

### Development
- Domain: `localhost` / `scavenger-hunt.local`
- No TLS (HTTP only)
- Very relaxed limits
- 100% tracing sample rate

## Deployment

### Prerequisites

1. Install cert-manager for TLS certificates:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

2. Install Gateway API CRDs:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.0.0/standard-install.yaml
```

### Deploy NGINX Fabric Gateway

```bash
# Deploy the controller and all resources
kubectl apply -k kustomize/base

# Or for specific environment
kubectl apply -k kustomize/overlays/production
kubectl apply -k kustomize/overlays/staging
kubectl apply -k kustomize/overlays/development
```

### Verify Deployment

```bash
# Check controller
kubectl get pods -n nginx-gateway

# Check gateway
kubectl get gateway -n scavenger-hunt-prod

# Check routes
kubectl get httproute -n scavenger-hunt-prod

# Check policies
kubectl get clientsettingspolicy,observabilitypolicy -n scavenger-hunt-prod
```

## Configuration Updates

### Update Domain Names

Edit the appropriate overlay file:
- Production: `kustomize/overlays/production/gateway-patch.yaml`
- Staging: `kustomize/overlays/staging/gateway-patch.yaml`

### Adjust Rate Limits

Edit `kustomize/base/policies/ratelimit-policy.yaml` or override in environment patches.

### Configure TLS

1. Update email in `certificates.yaml`
2. Ensure DNS points to LoadBalancer IP
3. cert-manager will automatically provision certificates

## Monitoring

### Access Logs
```bash
kubectl logs -n nginx-gateway deployment/nginx-gateway -f
```

### Metrics
Prometheus endpoint available at `:9113/metrics`

### Tracing
OpenTelemetry traces sent to configured collector

## Troubleshooting

### Check Gateway Status
```bash
kubectl describe gateway scavenger-hunt-gateway -n scavenger-hunt-prod
```

### Check Route Status
```bash
kubectl describe httproute backend-api-route -n scavenger-hunt-prod
```

### Common Issues

1. **503 Service Unavailable**: Check if backend pods are running
2. **404 Not Found**: Verify HTTPRoute paths and priorities
3. **429 Too Many Requests**: Rate limit exceeded
4. **SSL Certificate Issues**: Check cert-manager logs

## Migration from Ingress

1. Deploy Gateway alongside existing Ingress
2. Test with specific hostnames
3. Gradually migrate traffic using DNS
4. Remove old Ingress resources