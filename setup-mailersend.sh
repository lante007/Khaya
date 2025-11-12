#!/bin/bash

# MailerSend Setup Script
# Run this to configure your MailerSend API key

echo "🚀 MailerSend Setup for Project Khaya"
echo "======================================"
echo ""

# Check if API key is provided
if [ -z "$1" ]; then
    echo "❌ Error: No API key provided"
    echo ""
    echo "Usage: ./setup-mailersend.sh YOUR_MAILERSEND_API_KEY"
    echo ""
    echo "Get your API key from: https://app.mailersend.com/"
    echo "Settings → API Tokens → Generate New Token"
    exit 1
fi

API_KEY="$1"

echo "📝 Configuring MailerSend API key..."
echo ""

# Update backend/.env
if [ -f "backend/.env" ]; then
    sed -i "s/MAILERSEND_API_KEY=.*/MAILERSEND_API_KEY=$API_KEY/" backend/.env
    echo "✅ Updated backend/.env"
else
    echo "⚠️  backend/.env not found, skipping..."
fi

# Update root .env
if [ -f ".env" ]; then
    sed -i "s/MAILERSEND_API_KEY=.*/MAILERSEND_API_KEY=$API_KEY/" .env
    echo "✅ Updated .env"
else
    echo "⚠️  .env not found, skipping..."
fi

echo ""
echo "✅ MailerSend API key configured!"
echo ""
echo "🧪 Next steps:"
echo "1. Test email sending:"
echo "   cd backend && npx tsx test-email.ts your-email@example.com"
echo ""
echo "2. Start dev server:"
echo "   npm run dev"
echo ""
echo "3. Test auth flow:"
echo "   Visit http://localhost:5000/auth"
echo ""
echo "🎉 You're ready to launch!"
