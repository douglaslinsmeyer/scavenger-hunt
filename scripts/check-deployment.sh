#!/bin/bash
# Script to check the deployment status and troubleshoot issues

echo "=== Checking Scavenger Hunt Deployment Status ==="
echo ""

# Check if kubectl is configured
if ! kubectl cluster-info >/dev/null 2>&1; then
    echo "ERROR: kubectl is not configured or cluster is not accessible"
    echo "Please configure kubectl with your production cluster credentials"
    exit 1
fi

echo "1. Checking NGINX Gateway Controller:"
echo "===================================="
kubectl get pods -n nginx-gateway
echo ""

echo "2. Checking Application Pods:"
echo "============================="
kubectl get pods -n scavenger-hunt-prod
echo ""

echo "3. Checking Gateway Resource:"
echo "============================="
kubectl get gateway -n scavenger-hunt-prod scavenger-hunt-gateway -o wide
echo ""

echo "4. Checking Gateway External IP/LoadBalancer:"
echo "============================================="
kubectl get svc -n nginx-gateway
echo ""

echo "5. Checking HTTPRoutes:"
echo "======================="
kubectl get httproute -n scavenger-hunt-prod
echo ""

echo "6. Checking Certificate Status:"
echo "==============================="
kubectl get certificate -n scavenger-hunt-prod
echo ""

echo "7. Checking Events for Issues:"
echo "=============================="
kubectl get events -n scavenger-hunt-prod --sort-by='.lastTimestamp' | tail -20
echo ""

echo "8. Gateway Details:"
echo "==================="
kubectl describe gateway -n scavenger-hunt-prod scavenger-hunt-gateway | grep -A5 "Status:"
echo ""

echo "9. Certificate Details:"
echo "======================="
kubectl describe certificate -n scavenger-hunt-prod scavenger-hunt-tls | grep -A10 "Status:"

echo ""
echo "=== DNS Configuration Required ==="
echo ""
echo "The domain scavenger-hunt.linsmeyer.com needs to be configured in DNS."
echo "You need to:"
echo "1. Get the external IP of the NGINX Gateway service (shown above)"
echo "2. Create an A record for scavenger-hunt.linsmeyer.com pointing to that IP"
echo "3. Create a wildcard A record for *.scavenger-hunt.linsmeyer.com pointing to that IP"