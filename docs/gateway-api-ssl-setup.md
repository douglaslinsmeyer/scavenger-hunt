# Gateway API SSL Setup with cert-manager

This guide explains the SSL/TLS certificate configuration used in the Scavenger Hunt application with Gateway API, cert-manager, and NGINX Gateway Fabric.

## Architecture Overview

The Scavenger Hunt application uses:
- **Gateway API**: Modern Kubernetes networking standard
- **NGINX Gateway Fabric**: Gateway API implementation
- **cert-manager**: Automatic certificate provisioning from Let's Encrypt
- **Path-based routing**: Single domain with `/api`, `/admin`, `/` paths

## Prerequisites

- Kubernetes cluster with Gateway API CRDs installed
- NGINX Gateway Fabric deployed (gatewayclass: nginx)
- cert-manager v1.15.0+ installed
- DNS A record pointing to Gateway's LoadBalancer IP

## Implementation Details

### 1. ClusterIssuers Configuration

The application defines two ClusterIssuers for Let's Encrypt integration:

**Production Issuer** (`kustomize/base/cert-manager/clusterissuer-prod.yaml`):
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod-gateway
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: doug@linsmeyer.com
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
    - http01:
        gatewayHTTPRoute:
          parentRefs:
          - name: scavenger-hunt-gateway
            namespace: scavenger-hunt-prod
            kind: Gateway
            group: gateway.networking.k8s.io
```

**Staging Issuer** (for testing to avoid rate limits):
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging-gateway
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: doug@linsmeyer.com
    privateKeySecretRef:
      name: letsencrypt-staging-account-key
    solvers:
    - http01:
        gatewayHTTPRoute:
          parentRefs:
          - name: scavenger-hunt-gateway
            namespace: scavenger-hunt-prod
            kind: Gateway
            group: gateway.networking.k8s.io
```

### 2. Gateway Configuration

The Gateway is configured with three listeners and cert-manager integration:

**Base Gateway** (`kustomize/base/gateway-api/gateway.yaml`):
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: scavenger-hunt-gateway
spec:
  gatewayClassName: nginx
  listeners:
  - name: http
    protocol: HTTP
    port: 80
    allowedRoutes:
      namespaces:
        from: Same
  - name: https
    protocol: HTTPS
    port: 443
    tls:
      mode: Terminate
      certificateRefs:
      - name: scavenger-hunt-tls
        kind: Secret
    allowedRoutes:
      namespaces:
        from: Same
  - name: health
    protocol: HTTP
    port: 8080
    allowedRoutes:
      namespaces:
        from: Same
```

**Production Patch** (`kustomize/overlays/production/gateway-cert-patch.yaml`):
```yaml
- op: add
  path: /metadata/annotations
  value:
    cert-manager.io/cluster-issuer: letsencrypt-prod-gateway
```

This annotation triggers cert-manager to provision certificates for the Gateway.

### 3. Certificate Resource

The Certificate resource specifies the domain and issuer:

**Production Certificate** (`kustomize/overlays/production/certificate.yaml`):
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: scavenger-hunt-tls
  namespace: scavenger-hunt-prod
spec:
  secretName: scavenger-hunt-tls
  dnsNames:
  - scavenger-hunt.linsmeyer.com
  issuerRef:
    name: letsencrypt-prod-gateway
    kind: ClusterIssuer
```

Note: Only a single domain is needed as the application uses path-based routing.

### 4. HTTPRoute Configuration

The application includes an HTTPS redirect route that preserves ACME challenges:

**HTTPS Redirect** (`kustomize/base/gateway-api/httproutes.yaml`):
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: https-redirect
spec:
  parentRefs:
  - name: scavenger-hunt-gateway
    sectionName: http
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /.well-known/acme-challenge/
    backendRefs:
    - name: cm-acme-http-solver-xxxxx  # Dynamically created by cert-manager
      port: 8089
  - filters:
    - type: RequestRedirect
      requestRedirect:
        scheme: https
        statusCode: 301
```

This configuration:
- Allows ACME HTTP-01 challenges to pass through on HTTP
- Redirects all other HTTP traffic to HTTPS

## How It Works

1. **Certificate Request**: The Certificate resource triggers cert-manager to request a certificate from Let's Encrypt
2. **ACME Challenge Setup**: cert-manager creates:
   - A temporary HTTPRoute for the ACME challenge path
   - A temporary Service and Pod to respond to challenges
3. **Challenge Routing**: 
   - Let's Encrypt sends HTTP-01 challenge to `http://scavenger-hunt.linsmeyer.com/.well-known/acme-challenge/<token>`
   - Gateway routes this to cert-manager's solver pod
   - Other HTTP traffic is redirected to HTTPS
4. **Certificate Issuance**: After successful validation, cert-manager:
   - Receives the certificate from Let's Encrypt
   - Stores it in the `scavenger-hunt-tls` Secret
   - Cleans up temporary resources
5. **Gateway TLS**: The Gateway's HTTPS listener uses the certificate for TLS termination

## Deployment Process

```bash
# 1. Deploy everything with a single command
kubectl apply -k kustomize/overlays/production

# 2. Monitor certificate provisioning
kubectl get certificate -n scavenger-hunt-prod -w

# 3. Check for any issues
kubectl describe certificate scavenger-hunt-tls -n scavenger-hunt-prod
kubectl get challenges -n scavenger-hunt-prod
```

## Troubleshooting

### Certificate Issues

1. **Check certificate status**:
   ```bash
   kubectl get certificate -n scavenger-hunt-prod
   kubectl describe certificate scavenger-hunt-tls -n scavenger-hunt-prod
   ```

2. **View active challenges**:
   ```bash
   kubectl get challenges -n scavenger-hunt-prod
   kubectl describe challenge -n scavenger-hunt-prod
   ```

3. **Check cert-manager solver pods**:
   ```bash
   kubectl get pods -n scavenger-hunt-prod | grep cm-acme-http-solver
   kubectl logs -n scavenger-hunt-prod <solver-pod-name>
   ```

4. **Verify ACME challenge routing**:
   ```bash
   # Test from outside the cluster
   curl -v http://scavenger-hunt.linsmeyer.com/.well-known/acme-challenge/test
   ```

### Common Issues and Solutions

1. **Challenge not reachable**:
   - Verify DNS points to correct LoadBalancer IP
   - Check that port 80 is open and accessible
   - Ensure HTTPS redirect excludes ACME challenge path

2. **Wrong namespace**:
   - Certificate must be in same namespace as Gateway
   - ClusterIssuer parentRef must specify correct namespace

3. **Rate limit errors**:
   - Switch to staging issuer for testing
   - Let's Encrypt allows 50 certificates per week per domain

4. **Gateway not picking up certificate**:
   - Verify cert-manager annotation on Gateway
   - Check that certificateRef in Gateway matches Secret name

## Production Best Practices

### Certificate Management

1. **Automatic Renewal**: cert-manager renews certificates 30 days before expiry
2. **Monitoring**: 
   ```bash
   # Check certificate expiration
   kubectl get certificate -n scavenger-hunt-prod -o jsonpath='{.items[*].status.renewalTime}'
   ```
3. **Backup**: Backup certificate secrets regularly:
   ```bash
   kubectl get secret scavenger-hunt-tls -n scavenger-hunt-prod -o yaml > tls-backup.yaml
   ```

### Testing with Staging Certificates

To avoid Let's Encrypt rate limits during testing:

```bash
# 1. Edit certificate to use staging issuer
kubectl patch certificate scavenger-hunt-tls -n scavenger-hunt-prod \
  --type='json' -p='[{"op": "replace", "path": "/spec/issuerRef/name", "value": "letsencrypt-staging-gateway"}]'

# 2. Delete existing certificate to force renewal
kubectl delete secret scavenger-hunt-tls -n scavenger-hunt-prod

# 3. Once testing is complete, switch back to production
kubectl patch certificate scavenger-hunt-tls -n scavenger-hunt-prod \
  --type='json' -p='[{"op": "replace", "path": "/spec/issuerRef/name", "value": "letsencrypt-prod-gateway"}]'
```

## Key Implementation Features

1. **Single Domain Architecture**: Uses path-based routing instead of subdomains
2. **Gateway API Native**: Leverages modern Kubernetes networking standards
3. **Automatic HTTPS Redirect**: All HTTP traffic redirected except ACME challenges
4. **Zero-Downtime Updates**: Certificate renewals happen without service interruption
5. **Environment Separation**: Different configurations for dev/staging/prod

## Summary

The Scavenger Hunt application demonstrates a production-ready Gateway API implementation with:
- Automatic SSL certificate provisioning via cert-manager
- Proper ACME challenge routing with HTTPS redirect
- Path-based routing for multiple services on a single domain
- Clean separation of concerns using Kustomize overlays