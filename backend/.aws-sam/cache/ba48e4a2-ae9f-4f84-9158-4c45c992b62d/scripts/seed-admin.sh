#!/bin/bash
set -e

echo "🔐 Seed Super Admin User"
echo ""

# Check environment variables
if [ -z "$ADMIN_EMAIL" ]; then
    read -p "Admin Email: " ADMIN_EMAIL
fi

if [ -z "$ADMIN_NAME" ]; then
    read -p "Admin Name: " ADMIN_NAME
fi

if [ -z "$ADMIN_PASSWORD" ]; then
    read -sp "Admin Password: " ADMIN_PASSWORD
    echo ""
fi

if [ -z "$AWS_REGION" ]; then
    AWS_REGION="af-south-1"
fi

if [ -z "$DYNAMODB_TABLE_NAME" ]; then
    DYNAMODB_TABLE_NAME="khaya-prod"
fi

echo ""
echo "🔄 Creating admin..."

# Run the TypeScript script
ADMIN_EMAIL="$ADMIN_EMAIL" \
ADMIN_NAME="$ADMIN_NAME" \
ADMIN_PASSWORD="$ADMIN_PASSWORD" \
AWS_REGION="$AWS_REGION" \
DYNAMODB_TABLE_NAME="$DYNAMODB_TABLE_NAME" \
tsx scripts/create-admin.ts

echo ""
echo "✅ Done!"
