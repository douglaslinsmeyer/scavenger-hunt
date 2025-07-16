# Infrastructure Setup

This document describes the infrastructure prerequisites required for the Scavenger Hunt application.

## Prerequisites

The application requires the following components to be installed in the Kubernetes cluster:

### 1. Gateway API CRDs
The Kubernetes Gateway API provides a standard way to configure load balancing, traffic routing, and other networking features.

- **Version**: v1.1.0
- **Installation**: Automatically installed by CI/CD pipeline or via setup script

### 2. NGINX Gateway Fabric
NGINX Gateway Fabric is an implementation of the Kubernetes Gateway API using NGINX.

- **Components**:
  - NGINX Gateway Fabric controller
  - Custom Resource Definitions (CRDs) for policies:
    - `ClientSettingsPolicy` - For rate limiting, timeouts, body size limits
    - `ObservabilityPolicy` - For logging, metrics, and tracing

### 3. cert-manager (Optional)
For automatic TLS certificate management in production.

- **Version**: v1.13.2
- **Includes**: Let's Encrypt ClusterIssuers for staging and production

## Installation Methods

### Method 1: Automatic via CI/CD
The CI/CD pipeline automatically checks for and installs missing prerequisites before deployment.

### Method 2: Manual Setup Script
Run the setup script to install all prerequisites:

```bash
./scripts/setup-cluster.sh
```

### Method 3: GitHub Actions Workflow
Trigger the infrastructure setup workflow:

```bash
gh workflow run setup-infrastructure.yml
```

### Method 4: Manual Installation
Install each component manually:

```bash
# Install Gateway API CRDs
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.1.0/standard-install.yaml

# Install NGINX Gateway Fabric
kubectl apply -k kustomize/base/nginx-fabric/

# Install cert-manager (optional)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml
```

## Verification

Verify the installation:

```bash
# Check CRDs
kubectl get crd | grep -E "(gateway|nginx|cert-manager)"

# Check namespaces
kubectl get ns nginx-gateway cert-manager

# Check pods
kubectl get pods -n nginx-gateway
kubectl get pods -n cert-manager
```

## Environment-Specific Notes

### Development
- Uses HTTP only (no TLS)
- Relaxed rate limits with dry-run mode
- 100% tracing sample rate

### Staging
- Uses Let's Encrypt staging certificates
- Moderate rate limits
- Standard observability settings

### Production
- Uses Let's Encrypt production certificates
- Strict rate limits
- Production-grade security headers
- Reduced tracing sample rate (5%)

## Troubleshooting

### CRDs Not Found
If you see errors like "no matches for kind 'ClientSettingsPolicy'":
1. Check if the CRDs are installed: `kubectl get crd`
2. Re-run the setup script or CI/CD pipeline
3. Manually install NGINX Gateway Fabric CRDs

### Controller Not Ready
If the NGINX Gateway Fabric controller doesn't start:
1. Check pod logs: `kubectl logs -n nginx-gateway -l app=nginx-gateway`
2. Ensure the namespace exists: `kubectl get ns nginx-gateway`
3. Check for resource constraints or node issues

### Certificate Issues
If TLS certificates aren't being issued:
1. Check cert-manager logs: `kubectl logs -n cert-manager -l app=cert-manager`
2. Verify ClusterIssuers: `kubectl get clusterissuer`
3. Check certificate status: `kubectl describe certificate -n <namespace>`