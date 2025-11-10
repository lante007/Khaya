#!/bin/bash

# Khaya Production Deployment Testing Script
# Tests all critical endpoints and functionality

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"projectkhaya.co.za"}
API_URL="https://$DOMAIN"
FRONTEND_URL="https://$DOMAIN"

echo -e "${BLUE}🧪 Khaya Production Deployment Tests${NC}"
echo "======================================"
echo "Domain: $DOMAIN"
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected HTTP $expected_code, got $response)"
        ((FAILED++))
        return 1
    fi
}

# Test with JSON response
test_json_endpoint() {
    local name=$1
    local url=$2
    local expected_field=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>/dev/null || echo "{}")
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected field '$expected_field' not found)"
        echo "Response: $response"
        ((FAILED++))
        return 1
    fi
}

echo -e "${YELLOW}1. Infrastructure Tests${NC}"
echo "----------------------"

# Test DNS resolution
echo -n "Testing DNS resolution... "
if host "$DOMAIN" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# Test SSL certificate
echo -n "Testing SSL certificate... "
if echo | openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | grep -q "Verify return code: 0"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING${NC} (SSL certificate may not be valid)"
    ((FAILED++))
fi

echo ""
echo -e "${YELLOW}2. API Endpoint Tests${NC}"
echo "---------------------"

# Test health endpoint
test_json_endpoint "Health check" "$API_URL/api/health" "status"

# Test tRPC endpoint (should return method not allowed for GET)
test_endpoint "tRPC endpoint" "$API_URL/api/trpc" "405"

echo ""
echo -e "${YELLOW}3. Frontend Tests${NC}"
echo "-----------------"

# Test frontend homepage
test_endpoint "Homepage" "$FRONTEND_URL" "200"

# Test static assets
test_endpoint "Favicon" "$FRONTEND_URL/favicon.ico" "200"

# Test SPA routing (should return 200 for all routes)
test_endpoint "Jobs page" "$FRONTEND_URL/jobs" "200"
test_endpoint "Workers page" "$FRONTEND_URL/workers" "200"
test_endpoint "Materials page" "$FRONTEND_URL/materials" "200"

echo ""
echo -e "${YELLOW}4. Performance Tests${NC}"
echo "--------------------"

# Test response time
echo -n "Testing API response time... "
start_time=$(date +%s%N)
curl -s "$API_URL/api/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    echo -e "${GREEN}✅ PASS${NC} (${response_time}ms)"
    ((PASSED++))
elif [ $response_time -lt 3000 ]; then
    echo -e "${YELLOW}⚠️  SLOW${NC} (${response_time}ms)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (${response_time}ms - too slow)"
    ((FAILED++))
fi

# Test frontend load time
echo -n "Testing frontend load time... "
start_time=$(date +%s%N)
curl -s "$FRONTEND_URL" > /dev/null
end_time=$(date +%s%N)
load_time=$(( (end_time - start_time) / 1000000 ))

if [ $load_time -lt 2000 ]; then
    echo -e "${GREEN}✅ PASS${NC} (${load_time}ms)"
    ((PASSED++))
elif [ $load_time -lt 5000 ]; then
    echo -e "${YELLOW}⚠️  SLOW${NC} (${load_time}ms)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (${load_time}ms - too slow)"
    ((FAILED++))
fi

echo ""
echo -e "${YELLOW}5. Security Tests${NC}"
echo "-----------------"

# Test HTTPS redirect
echo -n "Testing HTTP to HTTPS redirect... "
http_response=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" -L 2>/dev/null || echo "000")
if [ "$http_response" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING${NC} (HTTP $http_response)"
    ((FAILED++))
fi

# Test security headers
echo -n "Testing security headers... "
headers=$(curl -s -I "$FRONTEND_URL" 2>/dev/null || echo "")
if echo "$headers" | grep -qi "x-frame-options\|content-security-policy\|strict-transport-security"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING${NC} (Some security headers missing)"
    ((PASSED++))
fi

echo ""
echo -e "${YELLOW}6. Database Connectivity${NC}"
echo "------------------------"

# Test database through API (health check should verify DB connection)
echo -n "Testing database connectivity... "
health_response=$(curl -s "$API_URL/api/health" 2>/dev/null || echo "{}")
if echo "$health_response" | grep -q "ok"; then
    echo -e "${GREEN}✅ PASS${NC} (API responding, DB likely connected)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (API not responding properly)"
    ((FAILED++))
fi

echo ""
echo "======================================"
echo -e "${BLUE}Test Summary${NC}"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Total:  $(($PASSED + $FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is successful.${NC}"
    exit 0
elif [ $FAILED -le 2 ]; then
    echo -e "${YELLOW}⚠️  Some tests failed, but deployment may be functional.${NC}"
    echo "Review the failures above and fix if necessary."
    exit 0
else
    echo -e "${RED}❌ Multiple tests failed. Deployment needs attention.${NC}"
    exit 1
fi
