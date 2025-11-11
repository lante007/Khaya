#!/bin/bash
set -e

echo "🚀 Deploying Full Khaya Stack..."
echo ""

# Deploy backend first
echo "1️⃣  Deploying Backend..."
cd backend
./deploy.sh
cd ..

# Get backend outputs
API_URL=$(aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text)

echo ""
echo "2️⃣  Configuring Frontend..."

# Update frontend environment
cat > .env.production << EOF
VITE_API_URL=${API_URL}
VITE_AWS_REGION=af-south-1
VITE_COGNITO_USER_POOL_ID=${USER_POOL_ID}
VITE_COGNITO_CLIENT_ID=${USER_POOL_CLIENT_ID}
EOF

echo "✅ Environment configured"

# Build frontend
echo ""
echo "3️⃣  Building Frontend..."
npm run build

echo ""
echo "4️⃣  Deploying Frontend to Amplify..."
echo "⚠️  Manual step: Push to GitHub and Amplify will auto-deploy"
echo ""
echo "Or deploy to S3 + CloudFront:"
echo "  aws s3 sync dist/ s3://khaya-frontend --delete"
echo "  aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths '/*'"

echo ""
echo "✅ Backend deployed!"
echo "📋 API URL: ${API_URL}"
echo "🔐 User Pool ID: ${USER_POOL_ID}"
echo "🔑 Client ID: ${USER_POOL_CLIENT_ID}"
echo ""
echo "🎉 Ready to go live!"
