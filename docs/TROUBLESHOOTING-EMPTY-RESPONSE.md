# Troubleshooting: Empty Response from Server

## Current Situation
- DNS is configured correctly: scavenger-hunt.linsmeyer.com → 174.143.59.103
- Port 80 is open and accepting connections
- Server returns empty responses for all requests

## Possible Causes and Solutions

### 1. NGINX Gateway Controller Issues
The NGINX Gateway controller might not be running or configured properly.

**Check:**
```bash
kubectl get pods -n nginx-gateway
kubectl logs -n nginx-gateway <nginx-gateway-pod-name>
```

### 2. HTTPRoute Not Matching
The HTTPRoutes might not be matching the incoming requests.

**Check:**
```bash
kubectl get httproute -n scavenger-hunt-prod -o yaml
```

Look for:
- Correct hostnames configuration
- Correct parentRefs to the Gateway
- Backend service references

### 3. Backend Services Not Running
The application pods might not be running.

**Check:**
```bash
kubectl get pods -n scavenger-hunt-prod
kubectl get svc -n scavenger-hunt-prod
```

### 4. Gateway Listener Configuration
The Gateway might not have the correct listeners.

**Check:**
```bash
kubectl get gateway -n scavenger-hunt-prod scavenger-hunt-gateway -o yaml
```

### 5. Service Mesh or Network Policies
Network policies might be blocking traffic.

**Check:**
```bash
kubectl get networkpolicy -n scavenger-hunt-prod
```

## Quick Debugging Commands

```bash
# Check all resources in production namespace
kubectl get all -n scavenger-hunt-prod

# Check Gateway status
kubectl describe gateway -n scavenger-hunt-prod scavenger-hunt-gateway

# Check HTTPRoute status
kubectl describe httproute -n scavenger-hunt-prod

# Check NGINX Gateway logs
kubectl logs -n nginx-gateway -l app=nginx-gateway --tail=100

# Check if services have endpoints
kubectl get endpoints -n scavenger-hunt-prod
```

## Common Fixes

### If NGINX Gateway is not running:
```bash
kubectl apply -k kustomize/base/nginx-fabric/
```

### If HTTPRoutes are misconfigured:
Check that hostnames match your domain:
- Should be: scavenger-hunt.linsmeyer.com
- Not: scavenger-hunt.local or localhost

### If backend pods are not running:
```bash
kubectl get deployments -n scavenger-hunt-prod
kubectl rollout restart deployment -n scavenger-hunt-prod
```

## Testing with Port Forwarding

To bypass the Gateway and test the apps directly:
```bash
# Test backend
kubectl port-forward -n scavenger-hunt-prod svc/backend 8080:80
curl http://localhost:8080/health

# Test player app
kubectl port-forward -n scavenger-hunt-prod svc/player 8081:80
curl http://localhost:8081/

# Test admin app
kubectl port-forward -n scavenger-hunt-prod svc/admin 8082:80
curl http://localhost:8082/
```