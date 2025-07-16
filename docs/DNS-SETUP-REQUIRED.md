# DNS Setup Required for Scavenger Hunt

## Current Issue
The application has been successfully deployed to Kubernetes, but the domain `scavenger-hunt.linsmeyer.com` is not configured in DNS, which is why the site is not accessible.

## Steps to Configure DNS

### 1. Get the External IP Address
First, you need to find the external IP address of your NGINX Gateway LoadBalancer:

```bash
kubectl get svc -n nginx-gateway
```

Look for the service with type `LoadBalancer` and note its `EXTERNAL-IP`. If it shows `<pending>`, your cloud provider hasn't assigned an IP yet.

### 2. Configure DNS Records
You need to create the following DNS records with your domain registrar or DNS provider:

#### A Records
- **Record 1**: 
  - Name: `scavenger-hunt`
  - Type: `A`
  - Value: `<EXTERNAL-IP>`
  - TTL: 300 (5 minutes)

- **Record 2** (Wildcard for subdomains):
  - Name: `*.scavenger-hunt`
  - Type: `A`
  - Value: `<EXTERNAL-IP>`
  - TTL: 300 (5 minutes)

### 3. Verify DNS Configuration
After configuring DNS (wait 5-10 minutes for propagation):

```bash
# Check DNS resolution
dig scavenger-hunt.linsmeyer.com
nslookup scavenger-hunt.linsmeyer.com

# Test connectivity
curl -I https://scavenger-hunt.linsmeyer.com
```

## Alternative: Use a Different Domain

If you don't own `linsmeyer.com` or prefer to use a different domain:

1. Update the domain in the production configuration:
   - Edit `kustomize/overlays/production/gateway-patch.yaml`
   - Edit `kustomize/overlays/production/certificate.yaml`
   - Update all references to `scavenger-hunt.linsmeyer.com`

2. Commit and push the changes to trigger a new deployment

3. Configure DNS for your chosen domain

## LoadBalancer Considerations

### If External IP is Pending
If the LoadBalancer external IP remains `<pending>`, it could mean:
- Your Kubernetes cluster doesn't have LoadBalancer support
- You need to configure a cloud provider integration
- You're using a bare-metal cluster without MetalLB or similar

### Alternative Solutions
1. **NodePort**: Expose services on high ports (30000-32767)
2. **Ingress Controller**: Use traditional Ingress instead of Gateway API
3. **Port Forwarding**: For testing only: `kubectl port-forward -n nginx-gateway svc/nginx-gateway 8080:80`

## SSL Certificate

Once DNS is configured, cert-manager will automatically:
1. Request a certificate from Let's Encrypt
2. Complete the HTTP-01 challenge
3. Install the certificate for HTTPS access

You can monitor certificate status:
```bash
kubectl get certificate -n scavenger-hunt-prod
kubectl describe certificate -n scavenger-hunt-prod scavenger-hunt-tls
```

## Troubleshooting Script

Run the provided troubleshooting script to check deployment status:
```bash
./scripts/check-deployment.sh
```

This will show:
- NGINX Gateway controller status
- Application pod status
- Gateway configuration
- External IP/LoadBalancer status
- Certificate status
- Recent events