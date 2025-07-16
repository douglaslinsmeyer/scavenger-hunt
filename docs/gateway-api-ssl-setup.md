# Gateway API SSL Setup with cert-manager

This guide explains how to configure SSL/TLS certificates for applications using Gateway API with cert-manager and NGINX Gateway Fabric.

## Prerequisites

- Kubernetes cluster with Gateway API CRDs installed
- NGINX Gateway Fabric v2.0.2+ deployed
- cert-manager v1.15.0+ installed
- DNS records pointing to your Gateway's external IP

## Configuration Steps

### 1. Create Gateway API-Compatible ClusterIssuer

Create a ClusterIssuer that uses `gatewayHTTPRoute` solver for HTTP-01 challenges:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod-gateway
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
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

### 2. Configure Gateway with TLS

Ensure your Gateway has both HTTP and HTTPS listeners:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: scavenger-hunt-gateway
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod-gateway
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
```

### 3. Create Certificate Resource

Define a Certificate resource for your domains:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: scavenger-hunt-tls
spec:
  secretName: scavenger-hunt-tls
  dnsNames:
  - admin.scavenger-hunt.linsmeyer.com
  - api.scavenger-hunt.linsmeyer.com
  - play.scavenger-hunt.linsmeyer.com
  issuerRef:
    name: letsencrypt-prod-gateway
    kind: ClusterIssuer
```

### 4. Apply Configuration

```bash
# Apply the ClusterIssuer
kubectl apply -f gateway-api-issuer.yaml

# Apply your production configuration
kubectl apply -k kustomize/overlays/production
```

## How It Works

1. **Certificate Request**: When you create a Certificate resource, cert-manager initiates the ACME challenge process
2. **HTTPRoute Creation**: cert-manager automatically creates temporary HTTPRoute resources for each domain
3. **Challenge Validation**: Let's Encrypt validates domain ownership via HTTP-01 challenges at `/.well-known/acme-challenge/`
4. **Certificate Issuance**: Once validated, cert-manager stores the certificate in the specified Secret
5. **Gateway Usage**: The Gateway uses the certificate Secret for TLS termination

## Verification

Check certificate status:
```bash
kubectl get certificate -n scavenger-hunt-prod
```

Check challenge progress:
```bash
kubectl get challenges -n scavenger-hunt-prod
```

View HTTPRoutes created by cert-manager:
```bash
kubectl get httproute -n scavenger-hunt-prod | grep solver
```

## Troubleshooting

### Certificate Stuck in Pending

1. Check challenge status:
   ```bash
   kubectl describe challenge <challenge-name> -n scavenger-hunt-prod
   ```

2. Verify DNS resolution:
   ```bash
   nslookup your-domain.com
   ```

3. Test HTTP accessibility:
   ```bash
   curl -v http://your-domain.com/.well-known/acme-challenge/test
   ```

### Common Issues

- **500 Errors on Base Domain**: If using path-based routing, the base domain might conflict with ACME challenges. Consider using subdomain-only certificates.
- **Wrong Namespace**: Ensure certificates are created in the same namespace as your Gateway
- **DNS Propagation**: Allow time for DNS records to propagate before requesting certificates
- **Rate Limits**: Let's Encrypt has rate limits. Use staging issuer for testing.

## Production Considerations

1. **Wildcard Certificates**: Require DNS-01 validation, which needs DNS provider integration
2. **Certificate Renewal**: cert-manager automatically renews certificates 30 days before expiry
3. **Monitoring**: Set up alerts for certificate expiration and failed renewals
4. **Backup**: Regularly backup the certificate Secrets

## NGINX Gateway Fabric Specifics

NGINX Gateway Fabric v2.0.2 has limited ClientSettingsPolicy support:
- Only `body`, `keepAlive`, and `targetRef` fields are supported
- Rate limiting, custom headers, and timeouts must be configured differently
- Consider using NGINX annotations or ConfigMaps for advanced configurations

## Migration from Ingress

If migrating from Ingress-based cert-manager:
1. Create new Gateway API-based ClusterIssuers
2. Update Certificate resources to use new issuers
3. Delete old Ingress-based challenges and certificates
4. Update application routing to use HTTPRoutes instead of Ingresses