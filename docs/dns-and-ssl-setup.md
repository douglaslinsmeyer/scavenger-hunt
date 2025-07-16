# DNS and SSL Setup Guide for Scavenger Hunt

## Overview

This guide covers setting up DNS records and SSL certificates for the Scavenger Hunt application at `scavenger-hunt.linsmeyer.com` using Gateway API with NGINX Gateway Fabric and cert-manager.

## Architecture

The Scavenger Hunt application uses:
- **Gateway API**: Modern Kubernetes networking with NGINX Gateway Fabric
- **cert-manager**: Automatic SSL certificate provisioning from Let's Encrypt
- **Single domain**: All services (API, Admin, Player) served from `scavenger-hunt.linsmeyer.com`

## Prerequisites

1. Access to your DNS provider (to create A records)
2. Kubernetes cluster with Gateway API CRDs installed
3. NGINX Gateway Fabric installed (gatewayclass: nginx)
4. cert-manager v1.15.0+ installed in your cluster

## Step 1: Install cert-manager

cert-manager automates the management and issuance of TLS certificates from Let's Encrypt.

```bash
# Install cert-manager v1.15.0
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=Ready pods -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s

# Verify installation
kubectl get pods -n cert-manager
```

## Step 2: Install NGINX Gateway Fabric

```bash
# Install NGINX Gateway Fabric (if not already installed)
kubectl apply -f https://github.com/nginxinc/nginx-gateway-fabric/releases/download/v1.2.0/crds.yaml
kubectl apply -f https://github.com/nginxinc/nginx-gateway-fabric/releases/download/v1.2.0/nginx-gateway.yaml

# Wait for controller to be ready
kubectl wait --for=condition=Available deployment/nginx-gateway -n nginx-gateway --timeout=60s

# Get the LoadBalancer IP
kubectl get svc nginx-gateway -n nginx-gateway
```

## Step 3: Configure DNS Records

Once you have the LoadBalancer IP address, configure your DNS record:

### Required DNS Record

| Record Type | Name | Value | TTL | Purpose |
|------------|------|-------|-----|---------|
| A | scavenger-hunt.linsmeyer.com | `<LOADBALANCER_IP>` | 300 | Main domain |

### Example DNS Configuration

If your LoadBalancer IP is `34.123.45.67`:

```
scavenger-hunt.linsmeyer.com     A    34.123.45.67    300
```

**Note**: A single A record is sufficient. The application uses path-based routing (`/api`, `/admin`, `/`) rather than subdomain routing.

## Step 4: Deploy the Application

The production overlay includes all necessary SSL/TLS configurations:

```bash
# Deploy to production (includes Gateway, HTTPRoutes, Certificate, and services)
kubectl apply -k kustomize/overlays/production

# Verify namespace creation
kubectl get ns scavenger-hunt-prod

# Check Gateway status
kubectl get gateway -n scavenger-hunt-prod
kubectl describe gateway scavenger-hunt-gateway -n scavenger-hunt-prod
```

## Step 5: Verify Certificate Provisioning

cert-manager will automatically provision the SSL certificate using Let's Encrypt:

```bash
# Check certificate status
kubectl get certificate -n scavenger-hunt-prod
# Should show READY=True when certificate is issued

# Watch certificate provisioning progress
kubectl get certificate scavenger-hunt-tls -n scavenger-hunt-prod -w

# Check for ACME challenges
kubectl get challenges -n scavenger-hunt-prod

# View certificate details
kubectl describe certificate scavenger-hunt-tls -n scavenger-hunt-prod
```

## Step 6: Test SSL Configuration

### Verify HTTPS is working

```bash
# Test HTTPS endpoints
curl -v https://scavenger-hunt.linsmeyer.com/           # Player app
curl -v https://scavenger-hunt.linsmeyer.com/api/health # Backend API
curl -v https://scavenger-hunt.linsmeyer.com/admin/health # Admin dashboard

# Test HTTP to HTTPS redirect
curl -v -L http://scavenger-hunt.linsmeyer.com
# Should redirect to HTTPS with 301 status
```

### Verify certificate details

```bash
# Check certificate information
openssl s_client -connect scavenger-hunt.linsmeyer.com:443 -servername scavenger-hunt.linsmeyer.com < /dev/null | openssl x509 -noout -text | grep -E "(Subject:|DNS:)"
```

## Troubleshooting

### Certificate not issuing

1. **Check DNS propagation**
   ```bash
   nslookup scavenger-hunt.linsmeyer.com
   dig scavenger-hunt.linsmeyer.com
   ```

2. **Check ACME HTTP-01 challenge**
   ```bash
   # View active challenges
   kubectl get challenges -n scavenger-hunt-prod
   
   # Check challenge details
   kubectl describe challenge -n scavenger-hunt-prod
   
   # Verify ACME challenge path is accessible
   curl -v http://scavenger-hunt.linsmeyer.com/.well-known/acme-challenge/test
   ```

3. **Check cert-manager logs**
   ```bash
   kubectl logs -n cert-manager deployment/cert-manager
   kubectl logs -n cert-manager deployment/cert-manager-webhook
   ```

4. **Verify Gateway configuration**
   ```bash
   # Check Gateway has cert-manager annotation
   kubectl get gateway scavenger-hunt-gateway -n scavenger-hunt-prod -o yaml | grep cert-manager
   
   # Check HTTPRoutes are properly configured
   kubectl get httproute -n scavenger-hunt-prod
   ```

### Common Issues

1. **Rate Limits**: Let's Encrypt has rate limits (50 certificates per week per domain). Use staging issuer for testing:
   ```bash
   # Edit the certificate to use staging issuer
   kubectl edit certificate scavenger-hunt-tls -n scavenger-hunt-prod
   # Change issuerRef.name to: letsencrypt-staging-gateway
   ```

2. **DNS not propagated**: Wait 5-10 minutes after creating DNS records

3. **ACME challenge blocked**: Ensure the HTTPS redirect HTTPRoute excludes `/.well-known/acme-challenge/`

4. **Wrong namespace**: Certificates must be in the same namespace as the Gateway

5. **Gateway not ready**: Ensure Gateway shows `Ready` status before certificate provisioning

## Certificate Management

### Manual certificate renewal (if needed)

```bash
# Delete the certificate to trigger renewal
kubectl delete certificate scavenger-hunt-tls -n scavenger-hunt-prod
# It will be recreated automatically by cert-manager
```

### Switch between staging and production

```bash
# For testing (to avoid rate limits)
kubectl patch certificate scavenger-hunt-tls -n scavenger-hunt-prod --type='json' \
  -p='[{"op": "replace", "path": "/spec/issuerRef/name", "value": "letsencrypt-staging-gateway"}]'

# For production
kubectl patch certificate scavenger-hunt-tls -n scavenger-hunt-prod --type='json' \
  -p='[{"op": "replace", "path": "/spec/issuerRef/name", "value": "letsencrypt-prod-gateway"}]'
```

## Monitoring Certificate Status

```bash
# Check certificate expiration
kubectl get certificate -n scavenger-hunt-prod -o wide

# View certificate secret
kubectl get secret scavenger-hunt-tls -n scavenger-hunt-prod -o yaml | \
  grep tls.crt | cut -d' ' -f4 | base64 -d | \
  openssl x509 -noout -dates
```

## Application Routes

After successful setup, your application will be accessible at:

| Service | URL | Description |
|---------|-----|-------------|
| Player App | https://scavenger-hunt.linsmeyer.com/ | Main player interface |
| Admin Dashboard | https://scavenger-hunt.linsmeyer.com/admin | Hunt administration |
| Backend API | https://scavenger-hunt.linsmeyer.com/api | REST API endpoints |
| WebSocket | https://scavenger-hunt.linsmeyer.com/socket.io | Real-time updates |

All HTTP traffic is automatically redirected to HTTPS, and certificates are renewed automatically by cert-manager before expiration.