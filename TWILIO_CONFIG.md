# Twilio Configuration

## Verified Number
**Phone:** +27 81 494 3255

## Environment Variables Needed

Add these to your Lambda function environment variables:

```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+27814943255
TWILIO_WHATSAPP_NUMBER=+27814943255
```

## How to Add to Lambda

### Via AWS Console:
1. Go to Lambda Console
2. Select function: `project-khaya-api-KhayaFunction-xxxxx`
3. Configuration → Environment variables
4. Add the Twilio variables above

### Via SAM Template:
Already configured in `template.yaml` - just need to add the parameter values when deploying.

## SMS/WhatsApp Features

Once configured, users can:
- Receive OTP via SMS
- Receive OTP via WhatsApp
- Get job notifications
- Receive payment confirmations

## Test Twilio Integration

```bash
# Test SMS
curl -X POST https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/auth.sendOTP \
  -H "Content-Type: application/json" \
  -d '{"phone": "+27814943255"}'
```

## Twilio Setup Steps

1. **Get Twilio Account:**
   - Sign up at https://www.twilio.com
   - Verify your number: +27 81 494 3255

2. **Get Credentials:**
   - Account SID (from Twilio Console)
   - Auth Token (from Twilio Console)

3. **Configure WhatsApp:**
   - Enable WhatsApp sandbox
   - Or get approved WhatsApp Business number

4. **Update Lambda:**
   - Add environment variables
   - Redeploy if needed

## Current Status

- ✅ Twilio integration code ready
- ✅ Phone number verified: +27 81 494 3255
- ⚠️ Need to add Twilio credentials to Lambda
- ⚠️ Need to configure WhatsApp (optional)

