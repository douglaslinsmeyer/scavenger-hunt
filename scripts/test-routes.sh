#!/bin/bash
# Script to test different routes and identify routing issues

echo "=== Testing Scavenger Hunt Routes ==="
echo ""

DOMAIN="scavenger-hunt.linsmeyer.com"
IP="174.143.59.103"

echo "Testing with Host header to bypass DNS issues..."
echo ""

echo "1. Testing root path (should hit player app):"
echo "============================================"
curl -v -H "Host: $DOMAIN" "http://$IP/" 2>&1 | grep -E "(< HTTP|< Location|Empty reply)" | head -5
echo ""

echo "2. Testing /api path (should hit backend):"
echo "=========================================="
curl -v -H "Host: $DOMAIN" "http://$IP/api/health" 2>&1 | grep -E "(< HTTP|< Location|Empty reply)" | head -5
echo ""

echo "3. Testing /admin path (should hit admin dashboard):"
echo "===================================================="
curl -v -H "Host: $DOMAIN" "http://$IP/admin" 2>&1 | grep -E "(< HTTP|< Location|Empty reply)" | head -5
echo ""

echo "4. Testing /health path (should hit player app health check):"
echo "============================================================="
curl -v -H "Host: $DOMAIN" "http://$IP/health" 2>&1 | grep -E "(< HTTP|< Location|Empty reply)" | head -5
echo ""

echo "5. Testing with api subdomain:"
echo "=============================="
curl -v -H "Host: api.$DOMAIN" "http://$IP/api/health" 2>&1 | grep -E "(< HTTP|< Location|Empty reply)" | head -5
echo ""

echo "6. Testing with admin subdomain:"
echo "================================"
curl -v -H "Host: admin.$DOMAIN" "http://$IP/admin" 2>&1 | grep -E "(< HTTP|< Location|Empty reply)" | head -5
echo ""

echo "7. Testing HTTPS redirect (HTTP to HTTPS):"
echo "=========================================="
curl -v -H "Host: $DOMAIN" "http://$IP/" 2>&1 | grep -E "(< HTTP/1.1 301|< Location)" | head -2
echo ""

echo "=== Route Analysis ==="
echo ""
echo "If all requests return 'Empty reply from server', the issue is likely:"
echo "1. NGINX Gateway controller is not running"
echo "2. Gateway is not listening on the correct address"
echo "3. No routes are matching the requests"
echo ""
echo "Expected behavior:"
echo "- Root path (/) should serve the player app"
echo "- /api/* should route to the backend service"
echo "- /admin/* should route to the admin dashboard"
echo "- HTTP requests should redirect to HTTPS (301 redirect)"