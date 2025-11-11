#!/bin/bash
set -e

echo "🚀 Deploying Khaya Backend using AWS CLI..."
echo ""

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured"
    exit 1
fi

# Build
echo "📦 Building TypeScript..."
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
cd dist
zip -r ../lambda.zip . -x "*.map"
cd ..

# Add node_modules (production only)
echo "📦 Adding dependencies..."
npm ci --production --silent
cd node_modules
zip -r ../lambda.zip . -q
cd ..

echo "✅ Deployment package created: lambda.zip"
echo ""
echo "📋 Next steps:"
echo "1. Create Lambda function in AWS Console"
echo "2. Upload lambda.zip"
echo "3. Set environment variables"
echo "4. Create API Gateway"
echo "5. Configure Cognito"
echo ""
echo "Or use AWS SAM for automated deployment:"
echo "  pip install aws-sam-cli"
echo "  sam deploy --guided"
