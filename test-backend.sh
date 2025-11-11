#!/bin/bash

echo "🧪 Testing Khaya Backend Build..."
echo ""

# Test TypeScript compilation
echo "1️⃣  Testing TypeScript compilation..."
cd backend
if npm run build; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Check dist files
echo ""
echo "2️⃣  Checking generated files..."
if [ -f "dist/server.js" ]; then
    echo "✅ server.js generated"
else
    echo "❌ server.js not found"
    exit 1
fi

if [ -f "dist/router.js" ]; then
    echo "✅ router.js generated"
else
    echo "❌ router.js not found"
    exit 1
fi

# Check all routers
echo ""
echo "3️⃣  Checking router files..."
for router in user jobs bids payments subscriptions referrals messages; do
    if [ -f "dist/routers/${router}.router.js" ]; then
        echo "✅ ${router}.router.js generated"
    else
        echo "❌ ${router}.router.js not found"
        exit 1
    fi
done

echo ""
echo "4️⃣  Checking configuration files..."
if [ -f "template.yaml" ]; then
    echo "✅ SAM template exists"
else
    echo "❌ SAM template missing"
    exit 1
fi

if [ -f "samconfig.toml" ]; then
    echo "✅ SAM config exists"
else
    echo "❌ SAM config missing"
    exit 1
fi

cd ..

echo ""
echo "5️⃣  Checking frontend integration..."
if [ -f "client/src/lib/trpc.ts" ]; then
    echo "✅ Frontend tRPC client exists"
else
    echo "❌ Frontend tRPC client missing"
    exit 1
fi

echo ""
echo "✅ All tests passed!"
echo ""
echo "📋 Summary:"
echo "  - Backend TypeScript compiles successfully"
echo "  - All 7 routers generated"
echo "  - SAM deployment files ready"
echo "  - Frontend tRPC client configured"
echo ""
echo "🚀 Ready for deployment!"
