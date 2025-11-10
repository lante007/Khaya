#!/bin/bash
set -e

echo "🚀 ProjectKhaya.co.za - AWS Serverless Deployment Script"
echo "========================================================="

# Check prerequisites
echo "Checking prerequisites..."
command -v aws >/dev/null 2>&1 || { echo "AWS CLI is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required but not installed. Aborting." >&2; exit 1; }

# Get AWS account info
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-af-south-1}
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"

# Step 1: Install dependencies
echo ""
echo "Step 1: Installing dependencies..."
cd infra
pnpm install
cd ..

# Step 2: Bootstrap CDK (if needed)
echo ""
echo "Step 2: Bootstrapping AWS CDK..."
cd infra
npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION || echo "CDK already bootstrapped"
cd ..

# Step 3: Build frontend
echo ""
echo "Step 3: Building frontend..."
pnpm install
pnpm run build

# Step 4: Package Lambda functions
echo ""
echo "Step 4: Packaging Lambda functions..."
cd aws-lambda/handlers
npm install
cd ../..

# Step 5: Deploy infrastructure
echo ""
echo "Step 5: Deploying AWS infrastructure..."
cd infra
npx cdk deploy --require-approval never

# Get outputs
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name KhayaStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucket`].OutputValue' \
  --output text)

API_URL=$(aws cloudformation describe-stacks \
  --stack-name KhayaStack \
  --query 'Stacks[0].Outputs[?OutputKey==`APIUrl`].OutputValue' \
  --output text)

CDN_URL=$(aws cloudformation describe-stacks \
  --stack-name KhayaStack \
  --query 'Stacks[0].Outputs[?OutputKey==`CDNUrl`].OutputValue' \
  --output text)

cd ..

# Step 6: Upload frontend to S3
echo ""
echo "Step 6: Uploading frontend to S3..."
aws s3 sync dist/public/ s3://$FRONTEND_BUCKET --delete

# Step 7: Invalidate CloudFront cache
echo ""
echo "Step 7: Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[0].DomainName=='$FRONTEND_BUCKET.s3.amazonaws.com'].Id" \
  --output text)

if [ -n "$DISTRIBUTION_ID" ]; then
  aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"
fi

# Done!
echo ""
echo "✅ Deployment complete!"
echo "========================================================="
echo "Frontend URL: $CDN_URL"
echo "API URL: $API_URL"
echo ""
echo "Next steps:"
echo "1. Configure custom domain in Route 53"
echo "2. Point projectkhaya.co.za to CloudFront distribution"
echo "3. Test the application"
echo ""
echo "To rollback: cd infra && npx cdk destroy"
