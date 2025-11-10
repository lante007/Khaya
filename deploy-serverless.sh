#!/bin/bash
set -e

echo "🚀 Project Khaya - Serverless Deployment to AWS"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN_NAME=${DOMAIN_NAME:-"projectkhaya.co.za"}
AWS_REGION=${AWS_REGION:-"af-south-1"}
STACK_NAME="KhayaStack"

echo -e "${BLUE}Configuration:${NC}"
echo "Domain: $DOMAIN_NAME"
echo "Region: $AWS_REGION"
echo "Stack: $STACK_NAME"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not installed${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Get AWS account info
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account: $AWS_ACCOUNT_ID"
echo ""

# Step 1: Check/Create Route 53 Hosted Zone
echo -e "${YELLOW}Step 1/7: Checking Route 53 Hosted Zone...${NC}"

HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
    --dns-name "$DOMAIN_NAME" \
    --query "HostedZones[?Name=='${DOMAIN_NAME}.'].Id" \
    --output text 2>/dev/null | cut -d'/' -f3 || echo "")

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "Creating hosted zone for $DOMAIN_NAME..."
    HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
        --name "$DOMAIN_NAME" \
        --caller-reference "$(date +%s)" \
        --query 'HostedZone.Id' \
        --output text | cut -d'/' -f3)
    
    echo -e "${GREEN}✅ Hosted zone created: $HOSTED_ZONE_ID${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Update your domain registrar with these nameservers:${NC}"
    aws route53 get-hosted-zone --id "$HOSTED_ZONE_ID" --query 'DelegationSet.NameServers' --output table
    echo ""
    read -p "Press Enter after updating nameservers to continue..."
else
    echo -e "${GREEN}✅ Hosted zone exists: $HOSTED_ZONE_ID${NC}"
fi
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}Step 2/7: Installing dependencies...${NC}"
pnpm install
cd infra && pnpm install && cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 3: Bootstrap CDK (if needed)
echo -e "${YELLOW}Step 3/7: Bootstrapping AWS CDK...${NC}"
cd infra
npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION || echo "CDK already bootstrapped"
cd ..
echo -e "${GREEN}✅ CDK bootstrapped${NC}"
echo ""

# Step 4: Build frontend
echo -e "${YELLOW}Step 4/7: Building frontend...${NC}"
pnpm build
echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

# Step 5: Package Lambda functions
echo -e "${YELLOW}Step 5/7: Packaging Lambda functions...${NC}"
cd aws-lambda/handlers
if [ -f "package.json" ]; then
    npm install --production
fi
cd ../..
echo -e "${GREEN}✅ Lambda functions packaged${NC}"
echo ""

# Step 6: Deploy CDK stack
echo -e "${YELLOW}Step 6/7: Deploying CDK stack...${NC}"
cd infra

# Set environment variables for CDK
export DOMAIN_NAME="$DOMAIN_NAME"
export HOSTED_ZONE_ID="$HOSTED_ZONE_ID"

# Deploy with context
npx cdk deploy \
    --require-approval never \
    --context domainName="$DOMAIN_NAME" \
    --context hostedZoneId="$HOSTED_ZONE_ID" \
    --outputs-file ../cdk-outputs.json

cd ..
echo -e "${GREEN}✅ CDK stack deployed${NC}"
echo ""

# Step 7: Upload frontend to S3 and invalidate CloudFront
echo -e "${YELLOW}Step 7/7: Deploying frontend...${NC}"

# Extract outputs from CDK
if [ -f "cdk-outputs.json" ]; then
    FRONTEND_BUCKET=$(jq -r ".${STACK_NAME}.FrontendBucket" cdk-outputs.json)
    DISTRIBUTION_ID=$(jq -r ".${STACK_NAME}.DistributionId" cdk-outputs.json)
    CDN_URL=$(jq -r ".${STACK_NAME}.CDNUrl" cdk-outputs.json)
    API_URL=$(jq -r ".${STACK_NAME}.APIUrl" cdk-outputs.json)
    
    echo "Frontend Bucket: $FRONTEND_BUCKET"
    echo "Distribution ID: $DISTRIBUTION_ID"
    echo ""
    
    # Upload to S3
    echo "Uploading frontend to S3..."
    aws s3 sync dist/public/ s3://$FRONTEND_BUCKET --delete --cache-control "public, max-age=31536000, immutable"
    
    # Invalidate CloudFront cache
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id $DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text
    
    echo -e "${GREEN}✅ Frontend deployed${NC}"
else
    echo -e "${RED}❌ Could not find CDK outputs${NC}"
    exit 1
fi
echo ""

# Display summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Your application is now live at:${NC}"
echo -e "${GREEN}$CDN_URL${NC}"
echo ""
echo -e "${BLUE}API Gateway URL:${NC}"
echo "$API_URL"
echo ""
echo -e "${BLUE}CloudFront Distribution ID:${NC}"
echo "$DISTRIBUTION_ID"
echo ""
echo -e "${BLUE}Frontend Bucket:${NC}"
echo "$FRONTEND_BUCKET"
echo ""

# Save deployment info
cat > DEPLOYMENT_INFO.txt << EOF
Project Khaya - Serverless Deployment
======================================

Deployment Date: $(date)
AWS Account: $AWS_ACCOUNT_ID
Region: $AWS_REGION

URLs:
- Website: $CDN_URL
- API: $API_URL

Resources:
- CloudFront Distribution: $DISTRIBUTION_ID
- Frontend Bucket: $FRONTEND_BUCKET
- Hosted Zone: $HOSTED_ZONE_ID

Next Steps:
1. Test your application at $CDN_URL
2. Configure WhatsApp integration (Twilio)
3. Set up Paystack for payments
4. Monitor CloudWatch logs
5. Set up billing alerts

To update frontend:
  pnpm build
  aws s3 sync dist/public/ s3://$FRONTEND_BUCKET --delete
  aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

To view logs:
  aws logs tail /aws/lambda/KhayaStack-ApiLambda --follow

To destroy stack:
  cd infra && npx cdk destroy
EOF

echo -e "${BLUE}Deployment info saved to: DEPLOYMENT_INFO.txt${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "1. SSL certificate may take 20-30 minutes to provision"
echo "2. DNS propagation can take 24-48 hours globally"
echo "3. Test your site at the CloudFront URL first"
echo "4. Monitor CloudWatch for any errors"
echo ""
echo -e "${GREEN}🎉 Happy deploying!${NC}"
