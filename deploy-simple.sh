#!/bin/bash
set -e

echo "🚀 Project Khaya - Simple AWS Deployment"
echo "=========================================="
echo ""

# Configuration
DOMAIN_NAME="projectkhaya.co.za"
REGION="us-east-1"
BUCKET_NAME="projectkhaya-frontend-$(date +%s)"

echo "Domain: $DOMAIN_NAME"
echo "Region: $REGION"
echo "Bucket: $BUCKET_NAME"
echo ""

# Step 1: Build frontend
echo "📦 Building frontend..."
cd /workspaces/Khaya
pnpm build
echo "✅ Frontend built"
echo ""

# Step 2: Create S3 bucket for frontend
echo "📦 Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION
echo "✅ Bucket created"
echo ""

# Step 3: Configure bucket for static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html
echo "✅ Website hosting configured"
echo ""

# Step 4: Make bucket public
echo "🔓 Making bucket public..."
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicReadGetObject\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
  }]
}"
echo "✅ Bucket is public"
echo ""

# Step 5: Upload frontend
echo "📤 Uploading frontend..."
aws s3 sync dist/public/ s3://$BUCKET_NAME --delete
echo "✅ Frontend uploaded"
echo ""

# Step 6: Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Your website is live at:"
echo "$WEBSITE_URL"
echo ""
echo "Next steps:"
echo "1. Test the website at the URL above"
echo "2. Set up CloudFront for HTTPS and custom domain"
echo "3. Configure Route 53 DNS"
echo ""

# Save deployment info
cat > SIMPLE_DEPLOYMENT_INFO.txt << EOF
Project Khaya - Simple Deployment
==================================

Deployment Date: $(date)
Region: $REGION

Resources:
- S3 Bucket: $BUCKET_NAME
- Website URL: $WEBSITE_URL

To update frontend:
  pnpm build
  aws s3 sync dist/public/ s3://$BUCKET_NAME --delete

To delete:
  aws s3 rb s3://$BUCKET_NAME --force
EOF

echo "Deployment info saved to: SIMPLE_DEPLOYMENT_INFO.txt"
