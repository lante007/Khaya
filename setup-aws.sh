#!/bin/bash
set -e

echo "🔧 Setting up AWS CLI for Project Khaya"
echo "========================================"
echo ""

# Check if AWS CLI is installed
if command -v aws &> /dev/null; then
    echo "✅ AWS CLI already installed"
    aws --version
else
    echo "📦 Installing AWS CLI..."
    
    # Download AWS CLI
    curl -s "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    
    # Unzip
    unzip -q awscliv2.zip
    
    # Install
    sudo ./aws/install
    
    # Cleanup
    rm -rf aws awscliv2.zip
    
    echo "✅ AWS CLI installed"
    aws --version
fi

echo ""
echo "🔑 Configuring AWS CLI..."
echo ""
echo "Please enter your NEW AWS credentials:"
echo "(The ones you just created after rotating)"
echo ""

# Configure AWS CLI interactively
aws configure

echo ""
echo "✅ Testing AWS configuration..."
aws sts get-caller-identity

echo ""
echo "✅ AWS CLI configured successfully!"
echo ""
echo "Next steps:"
echo "1. Run: ./deploy-serverless.sh"
echo "2. Wait for deployment (30-45 minutes)"
echo "3. Your site will be live at https://projectkhaya.co.za"
