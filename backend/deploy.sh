#!/bin/bash
set -e

echo "🚀 Deploying Khaya Backend to AWS..."

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure'"
    exit 1
fi

# Check if Paystack secret key is set
if [ -z "$PAYSTACK_SECRET_KEY" ]; then
    echo "⚠️  PAYSTACK_SECRET_KEY environment variable not set"
    read -sp "Enter Paystack Secret Key: " PAYSTACK_SECRET_KEY
    echo
fi

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

# Build SAM application
echo "🔨 Building SAM application..."
sam build

# Deploy to AWS
echo "☁️  Deploying to AWS..."
sam deploy \
    --parameter-overrides \
        "PaystackSecretKey=${PAYSTACK_SECRET_KEY}" \
        "FrontendUrl=https://khaya.co.za" \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

# Get outputs
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "🎉 Backend is live!"
