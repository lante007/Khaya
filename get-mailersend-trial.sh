#!/bin/bash

# Get MailerSend trial domain via API

API_KEY="mlsn.66f8d829236c43e209ecccd88d907b62612076375422c881ab16ee52e96a8a09"

echo "🔍 Fetching your MailerSend domains..."
echo ""

curl -s -X GET \
  "https://api.mailersend.com/v1/domains" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" | jq '.'
