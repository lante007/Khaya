#!/bin/bash
set -e

echo "🚀 Project Khaya - Frontend Update Deployment"
echo "=============================================="
echo ""

# Configuration from existing deployment
BUCKET_NAME="projectkhaya-frontend-1762772155"
CLOUDFRONT_ID="E4J3KAA9XDTHS"
REGION="us-east-1"

echo "📦 Step 1: Building frontend..."
pnpm build
echo "✅ Frontend built successfully"
echo ""

echo "📤 Step 2: Uploading to S3..."
aws s3 sync dist/public/ s3://$BUCKET_NAME --delete --region $REGION
echo "✅ Files uploaded to S3"
echo ""

echo "🔄 Step 3: Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)
echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
echo ""

echo "⏳ Step 4: Waiting for invalidation to complete..."
echo "   (This usually takes 1-3 minutes)"
aws cloudfront wait invalidation-completed \
  --distribution-id $CLOUDFRONT_ID \
  --id $INVALIDATION_ID
echo "✅ CloudFront cache invalidated"
echo ""

echo "=============================================="
echo "✅ Deployment Complete!"
echo "=============================================="
echo ""
echo "Your updated website is now live at:"
echo "  • https://d3q4wvlwbm3s1h.cloudfront.net"
echo "  • https://projectkhaya.co.za (if DNS is configured)"
echo "  • https://www.projectkhaya.co.za (if DNS is configured)"
echo ""
echo "Changes should be visible within 1-3 minutes."
echo ""

# Log deployment
echo "$(date): Frontend deployed successfully" >> deployment-log.txt
