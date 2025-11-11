#!/bin/bash
set -e

echo "🚀 Project Khaya - AWS Backend Deployment"
echo "=========================================="
echo ""

# Configuration
ENVIRONMENT=${1:-dev}
REGION=${AWS_REGION:-us-east-1}
STACK_NAME="ProjectKhaya-${ENVIRONMENT}"

echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack Name: $STACK_NAME"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

# Check SAM CLI
if ! command -v sam &> /dev/null; then
    echo "❌ AWS SAM CLI not found. Installing..."
    pip install aws-sam-cli
fi

echo "✅ Prerequisites check passed"
echo ""

# Install Lambda dependencies
echo "📦 Installing Lambda dependencies..."
cd aws-lambda/signup-buyer && npm install && cd ../..
cd aws-lambda/signup-worker && npm install && cd ../..
echo "✅ Dependencies installed"
echo ""

# Build SAM application
echo "🔨 Building SAM application..."
cd aws-infrastructure
sam build
echo "✅ Build complete"
echo ""

# Deploy
echo "🚀 Deploying to AWS..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --parameter-overrides Environment="$ENVIRONMENT" \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo ""
echo "✅ Deployment complete!"
echo ""

# Get outputs
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs' \
  --output table

echo ""
echo "=========================================="
echo "✅ Backend deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Update frontend with new API endpoint"
echo "2. Configure Cognito in frontend (Amplify)"
echo "3. Test signup flows"
echo ""
