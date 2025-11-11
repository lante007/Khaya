#!/bin/bash

echo "🔑 AWS Credentials Setup & Deployment"
echo "======================================"
echo ""
echo "Current AWS Identity:"
aws sts get-caller-identity 2>&1 | grep -E "(Account|Arn)" || echo "Not configured"
echo ""
echo "Your S3 bucket is in account: 615608124862"
echo ""

# Check if we have access to the bucket
echo "Testing S3 access..."
if aws s3 ls s3://projectkhaya-frontend-1762772155/ >/dev/null 2>&1; then
    echo "✅ S3 access confirmed!"
    echo ""
    echo "🚀 Deploying now..."
    echo ""
    
    # Deploy
    echo "📤 Uploading files to S3..."
    aws s3 sync dist/public/ s3://projectkhaya-frontend-1762772155 --delete --region us-east-1
    
    echo ""
    echo "🔄 Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id E4J3KAA9XDTHS \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "✅ Invalidation created: $INVALIDATION_ID"
    echo ""
    echo "⏳ Waiting for invalidation to complete (1-3 minutes)..."
    aws cloudfront wait invalidation-completed \
        --distribution-id E4J3KAA9XDTHS \
        --id $INVALIDATION_ID
    
    echo ""
    echo "======================================"
    echo "✅ DEPLOYMENT COMPLETE!"
    echo "======================================"
    echo ""
    echo "Your website is now live at:"
    echo "  🌐 https://projectkhaya.co.za"
    echo ""
    echo "Changes should be visible immediately."
    echo "If not, hard refresh: Ctrl+Shift+R"
    echo ""
    
else
    echo "❌ Access Denied to S3 bucket"
    echo ""
    echo "You need to configure AWS CLI with YOUR credentials."
    echo ""
    echo "Run this command and enter YOUR AWS credentials:"
    echo ""
    echo "  aws configure"
    echo ""
    echo "You'll need:"
    echo "  - AWS Access Key ID (from your AWS account)"
    echo "  - AWS Secret Access Key"
    echo "  - Region: us-east-1"
    echo ""
    echo "Then run this script again:"
    echo "  ./setup-and-deploy.sh"
    echo ""
    echo "📚 For detailed help, see: CONFIGURE_YOUR_AWS.md"
    echo ""
fi
