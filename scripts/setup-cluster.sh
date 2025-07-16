#!/bin/bash
# Setup script for installing cluster prerequisites
# This script installs Gateway API CRDs and NGINX Gateway Fabric

set -e

echo "Setting up cluster prerequisites..."

# Function to check if a CRD exists
check_crd() {
    kubectl get crd "$1" >/dev/null 2>&1
}

# Install Gateway API CRDs
echo "Checking Gateway API CRDs..."
if ! check_crd "gateways.gateway.networking.k8s.io"; then
    echo "Installing Gateway API CRDs v1.1.0..."
    kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.1.0/standard-install.yaml
else
    echo "Gateway API CRDs already installed"
fi

# Install NGINX Gateway Fabric
echo "Installing NGINX Gateway Fabric..."

# Check if nginx-gateway namespace exists
if ! kubectl get namespace nginx-gateway >/dev/null 2>&1; then
    echo "Creating nginx-gateway namespace..."
    kubectl create namespace nginx-gateway
fi

# Install NGINX Gateway Fabric CRDs and controller
echo "Installing NGINX Gateway Fabric CRDs and controller..."
kubectl apply -k kustomize/base/nginx-fabric/

# Wait for NGINX Gateway Fabric controller to be ready
echo "Waiting for NGINX Gateway Fabric controller to be ready..."
kubectl wait --for=condition=ready pod -l app=nginx-gateway -n nginx-gateway --timeout=300s || true

# Install cert-manager if not present
echo "Checking cert-manager..."
if ! kubectl get namespace cert-manager >/dev/null 2>&1; then
    echo "Installing cert-manager v1.13.2..."
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml
    
    # Wait for cert-manager to be ready
    echo "Waiting for cert-manager to be ready..."
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s
    
    # Create ClusterIssuers for Let's Encrypt
    echo "Creating cert-manager issuers..."
    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@example.com  # Change this to your email
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com  # Change this to your email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
else
    echo "cert-manager already installed"
fi

echo "Cluster setup complete!"

# Verify installations
echo ""
echo "Verification:"
echo "============="
kubectl get crd | grep -E "(gateway|nginx|cert-manager)" || true
echo ""
echo "Namespaces:"
kubectl get ns | grep -E "(nginx-gateway|cert-manager)" || true
echo ""
echo "Pods:"
kubectl get pods -n nginx-gateway || true
kubectl get pods -n cert-manager || true