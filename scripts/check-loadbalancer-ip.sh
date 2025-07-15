#!/bin/bash
# Script to check for LoadBalancer IP address and display DNS configuration

echo "=== Checking for LoadBalancer Services ==="
echo

# Check NGINX Gateway
echo "Checking NGINX Fabric Gateway..."
GATEWAY_IP=$(kubectl get svc nginx-gateway -n nginx-gateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
if [ -n "$GATEWAY_IP" ]; then
    echo "✅ NGINX Gateway LoadBalancer IP: $GATEWAY_IP"
    LOADBALANCER_IP=$GATEWAY_IP
else
    echo "❌ NGINX Gateway not found or no external IP assigned"
fi

echo

# Check NGINX Ingress Controller
echo "Checking NGINX Ingress Controller..."
INGRESS_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
if [ -n "$INGRESS_IP" ]; then
    echo "✅ NGINX Ingress Controller LoadBalancer IP: $INGRESS_IP"
    LOADBALANCER_IP=$INGRESS_IP
else
    echo "❌ NGINX Ingress Controller not found or no external IP assigned"
fi

echo

# Check all LoadBalancer services
echo "Checking all LoadBalancer services..."
kubectl get svc --all-namespaces | grep LoadBalancer

echo
echo "=== DNS Configuration Required ==="
echo

if [ -n "$LOADBALANCER_IP" ]; then
    echo "Configure these DNS A records with your DNS provider:"
    echo
    echo "Domain: scavenger-hunt.linsmeyer.com"
    echo "LoadBalancer IP: $LOADBALANCER_IP"
    echo
    echo "Required DNS Records:"
    echo "-------------------"
    echo "scavenger-hunt.linsmeyer.com     A    $LOADBALANCER_IP    300"
    echo "*.scavenger-hunt.linsmeyer.com   A    $LOADBALANCER_IP    300"
    echo
    echo "Or individual records:"
    echo "--------------------"
    echo "scavenger-hunt.linsmeyer.com        A    $LOADBALANCER_IP    300"
    echo "api.scavenger-hunt.linsmeyer.com    A    $LOADBALANCER_IP    300"
    echo "admin.scavenger-hunt.linsmeyer.com  A    $LOADBALANCER_IP    300"
    echo "play.scavenger-hunt.linsmeyer.com   A    $LOADBALANCER_IP    300"
else
    echo "⚠️  No LoadBalancer IP found!"
    echo
    echo "To get a LoadBalancer IP, you need to either:"
    echo
    echo "1. Deploy NGINX Fabric Gateway:"
    echo "   kubectl apply -k kustomize/base/nginx-fabric"
    echo
    echo "2. Or install NGINX Ingress Controller:"
    echo "   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml"
    echo
    echo "Then run this script again to get the IP address."
fi

echo
echo "=== Next Steps ==="
echo "1. Configure DNS records as shown above"
echo "2. Wait for DNS propagation (5-10 minutes)"
echo "3. Install cert-manager:"
echo "   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.15.0/cert-manager.yaml"
echo "4. Deploy the application:"
echo "   kubectl apply -k kustomize/overlays/production"