# DNS and SSL Setup Guide for Scavenger Hunt

## Overview

This guide covers setting up DNS records and SSL certificates for the Scavenger Hunt application at `scavenger-hunt.linsmeyer.com`.

## Prerequisites

1. Access to your DNS provider (to create A/CNAME records)
2. Kubernetes cluster with NGINX Fabric Gateway or Ingress Controller
3. cert-manager installed in your cluster

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

## Step 2: Deploy NGINX Gateway or Get LoadBalancer IP

### Option A: If using NGINX Fabric Gateway

```bash
# Deploy NGINX Fabric Gateway
kubectl apply -k kustomize/base/nginx-fabric

# Wait for LoadBalancer to get external IP
kubectl get svc nginx-gateway -n nginx-gateway -w
```

### Option B: If using traditional NGINX Ingress Controller

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml

# Get the LoadBalancer IP
kubectl get svc ingress-nginx-controller -n ingress-nginx
```

### Option C: Check existing services

```bash
# Check all LoadBalancer services
kubectl get svc --all-namespaces | grep LoadBalancer
```

## Step 3: Configure DNS Records

Once you have the LoadBalancer IP address, configure these DNS records:

### Required DNS Records

| Record Type | Name | Value | TTL | Purpose |
|------------|------|-------|-----|---------|
| A | scavenger-hunt.linsmeyer.com | `<LOADBALANCER_IP>` | 300 | Main domain |
| A | *.scavenger-hunt.linsmeyer.com | `<LOADBALANCER_IP>` | 300 | Wildcard for subdomains |

### Optional subdomain records (if not using wildcard)

| Record Type | Name | Value | TTL | Purpose |
|------------|------|-------|-----|---------|
| A | api.scavenger-hunt.linsmeyer.com | `<LOADBALANCER_IP>` | 300 | API endpoint |
| A | admin.scavenger-hunt.linsmeyer.com | `<LOADBALANCER_IP>` | 300 | Admin dashboard |
| A | play.scavenger-hunt.linsmeyer.com | `<LOADBALANCER_IP>` | 300 | Player app |

### Example DNS Configuration

If your LoadBalancer IP is `34.123.45.67`:

```
scavenger-hunt.linsmeyer.com     A    34.123.45.67    300
*.scavenger-hunt.linsmeyer.com   A    34.123.45.67    300
```

## Step 4: Deploy Certificate Issuers

```bash
# Apply the cert-manager configuration
kubectl apply -k kustomize/base/cert-manager

# Verify ClusterIssuers are created
kubectl get clusterissuer
```

## Step 5: Deploy the Application with SSL

```bash
# Deploy to production with SSL enabled
kubectl apply -k kustomize/overlays/production

# Check certificate status
kubectl get certificate -n scavenger-hunt-prod
kubectl describe certificate scavenger-hunt-tls -n scavenger-hunt-prod
```

## Step 6: Verify SSL Certificate

### Check certificate issuance progress

```bash
# Watch certificate status
kubectl get certificate -n scavenger-hunt-prod -w

# Check cert-manager logs if issues
kubectl logs -n cert-manager deployment/cert-manager

# Check certificate details
kubectl describe certificate scavenger-hunt-tls -n scavenger-hunt-prod
```

### Test with curl

```bash
# Test HTTPS endpoint
curl -v https://scavenger-hunt.linsmeyer.com

# Test redirect from HTTP to HTTPS
curl -v http://scavenger-hunt.linsmeyer.com
```

## Troubleshooting

### Certificate not issuing

1. **Check DNS propagation**
   ```bash
   nslookup scavenger-hunt.linsmeyer.com
   dig scavenger-hunt.linsmeyer.com
   ```

2. **Check HTTP-01 challenge**
   ```bash
   # Check if cert-manager can reach your domain
   kubectl describe challenge -n scavenger-hunt-prod
   ```

3. **Check cert-manager logs**
   ```bash
   kubectl logs -n cert-manager deployment/cert-manager
   kubectl logs -n cert-manager deployment/cert-manager-webhook
   ```

### Common Issues

1. **Rate Limits**: Let's Encrypt has rate limits. Use staging issuer for testing:
   ```yaml
   issuerRef:
     name: letsencrypt-staging
     kind: ClusterIssuer
   ```

2. **DNS not propagated**: Wait 5-10 minutes after creating DNS records

3. **Firewall blocking port 80**: HTTP-01 challenge requires port 80 to be accessible

4. **Wrong email**: Update email in ClusterIssuer configuration

## Alternative: DNS-01 Challenge

If HTTP-01 challenges don't work (e.g., behind firewall), use DNS-01:

1. Configure your DNS provider credentials
2. Update ClusterIssuer to use DNS-01 solver
3. See cert-manager docs for your specific DNS provider

## Monitoring

### Set up certificate expiry alerts

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cert-expiry-alert
  namespace: cert-manager
data:
  alert.yaml: |
    groups:
    - name: certificates
      rules:
      - alert: CertificateExpiringSoon
        expr: certmanager_certificate_expiration_timestamp_seconds - time() < 7 * 24 * 3600
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Certificate expiring soon"
          description: "Certificate {{ $labels.name }} in namespace {{ $labels.namespace }} expires in less than 7 days"
```

## Next Steps

1. Update the email address in the cert-manager configuration to receive expiry notifications
2. Set up monitoring for certificate expiration
3. Configure backup DNS records for high availability
4. Consider using Cloudflare or another CDN for additional security and performance

## Summary

After completing these steps, your Scavenger Hunt application will be accessible at:

- Main app: https://scavenger-hunt.linsmeyer.com
- API: https://scavenger-hunt.linsmeyer.com/api
- Admin: https://scavenger-hunt.linsmeyer.com/admin
- Player: https://scavenger-hunt.linsmeyer.com (or play.scavenger-hunt.linsmeyer.com)

All traffic will be automatically encrypted with Let's Encrypt SSL certificates that auto-renew every 60-90 days.