# Escrow Payment System - Environment Setup

## Required Environment Variables

### 1. Paystack Configuration

```bash
# Get from: https://dashboard.paystack.com/#/settings/developer
PAYSTACK_SECRET_KEY=PAYSTACK_SECRET_KEY_HERE
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Webhook URL (for charge.success events)
# Format: https://your-api-domain.com/trpc/payments.paystackWebhook
PAYSTACK_WEBHOOK_URL=https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook
```

**Setup Steps:**
1. Login to Paystack Dashboard
2. Go to Settings → API Keys & Webhooks
3. Copy Secret Key (starts with `PAYSTACK_SECRET_KEY_HERE`)
4. Copy Public Key (starts with `pk_live_`)
5. Add webhook URL and enable `charge.success` event

---

### 2. Twilio Configuration

```bash
# Get from: https://console.twilio.com/
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+27xxxxxxxxx

# Optional: WhatsApp Business Number
TWILIO_WHATSAPP_BUSINESS=whatsapp:+27xxxxxxxxx
```

**Setup Steps:**
1. Login to Twilio Console
2. Go to Account → Account Info
3. Copy Account SID
4. Copy Auth Token
5. Go to Messaging → Services
6. Get your SMS-enabled phone number

---

### 3. AWS Configuration

```bash
# DynamoDB
DYNAMODB_TABLE_NAME=KhayaTable
AWS_REGION=us-east-1

# S3 (for photo proof storage)
S3_BUCKET_NAME=khaya-proof-photos
S3_REGION=us-east-1

# Lambda execution
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Setup Steps:**
1. DynamoDB table must exist with GSI1 and GSI2 indexes
2. S3 bucket must allow Lambda write access
3. Lambda execution role needs:
   - `dynamodb:PutItem`
   - `dynamodb:GetItem`
   - `dynamodb:UpdateItem`
   - `dynamodb:Query`
   - `s3:PutObject`
   - `s3:GetObject`

---

### 4. Application Configuration

```bash
# API Base URL
API_BASE_URL=https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod

# Frontend URL (for redirects)
FRONTEND_URL=https://projectkhaya.co.za

# Platform fee percentage (5% = 0.05)
PLATFORM_FEE_PERCENT=0.05

# Escrow settings
ESCROW_ENABLED=true
PROOF_REQUIRED=true
```

---

## Complete .env File Template

```bash
# ============================================
# ESCROW PAYMENT SYSTEM - ENVIRONMENT CONFIG
# ============================================

# Paystack (Payment Gateway)
PAYSTACK_SECRET_KEY=PAYSTACK_SECRET_KEY_HERE
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYSTACK_WEBHOOK_URL=https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook

# Twilio (SMS Notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+27xxxxxxxxx

# AWS Services
DYNAMODB_TABLE_NAME=KhayaTable
AWS_REGION=us-east-1
S3_BUCKET_NAME=khaya-proof-photos
S3_REGION=us-east-1

# AWS Credentials (Lambda)
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Application
API_BASE_URL=https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod
FRONTEND_URL=https://projectkhaya.co.za
PLATFORM_FEE_PERCENT=0.05
ESCROW_ENABLED=true
PROOF_REQUIRED=true

# Admin
ADMIN_EMAIL=Amanda@projectkhaya.co.za
ADMIN_PHONE=+27814943255
```

---

## AWS Lambda Environment Variables

Add these to your Lambda function configuration:

```bash
PAYSTACK_SECRET_KEY=PAYSTACK_SECRET_KEY_HERE
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=+27xxx
DYNAMODB_TABLE_NAME=KhayaTable
S3_BUCKET_NAME=khaya-proof-photos
PLATFORM_FEE_PERCENT=0.05
```

**AWS Console Steps:**
1. Go to Lambda → Functions → Your Function
2. Configuration → Environment variables
3. Add each variable
4. Save

---

## Paystack Webhook Configuration

### 1. Add Webhook URL
```
URL: https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook
```

### 2. Enable Events
- ✅ `charge.success` - Payment successful (REQUIRED)
- ✅ `charge.failed` - Payment failed
- ✅ `transfer.success` - Payout successful
- ✅ `transfer.failed` - Payout failed

### 3. Test Webhook
```bash
curl -X POST https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test_signature" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "test_ref_123",
      "amount": 50000,
      "metadata": {
        "jobId": "test-job-id",
        "userId": "test-user-id"
      }
    }
  }'
```

---

## S3 Bucket Setup (Photo Proof Storage)

### 1. Create Bucket
```bash
aws s3 mb s3://khaya-proof-photos --region us-east-1
```

### 2. Set CORS Policy
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["https://projectkhaya.co.za"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. Set Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::khaya-proof-photos/*"
    }
  ]
}
```

---

## Verification Checklist

### ✅ Paystack
- [ ] Secret key added to Lambda environment
- [ ] Public key added to frontend
- [ ] Webhook URL configured in dashboard
- [ ] `charge.success` event enabled
- [ ] Test payment successful

### ✅ Twilio
- [ ] Account SID added to Lambda
- [ ] Auth token added to Lambda
- [ ] Phone number verified
- [ ] Test SMS sent successfully

### ✅ AWS
- [ ] DynamoDB table exists with indexes
- [ ] S3 bucket created with CORS
- [ ] Lambda has correct IAM permissions
- [ ] Environment variables set

### ✅ Testing
- [ ] Webhook receives charge.success
- [ ] SMS sent to buyer on payment
- [ ] Job status updates to in_progress
- [ ] Escrow amount stored correctly
- [ ] Photo proof submission works
- [ ] Payment releases to worker balance

---

## Troubleshooting

### Webhook Not Receiving Events
1. Check Paystack dashboard → Webhooks → Logs
2. Verify URL is publicly accessible
3. Check Lambda CloudWatch logs
4. Verify signature validation

### SMS Not Sending
1. Check Twilio console → Logs
2. Verify phone number format (+27...)
3. Check Twilio account balance
4. Verify auth token is correct

### Payment Not Releasing
1. Check `proofNeeded` is true in payment record
2. Verify `proofUrl` is valid S3 URL
3. Check job status is `in_progress`
4. Verify buyer is job owner

### Balance Not Updating
1. Check worker user record exists
2. Verify `workerAmount` calculation (95%)
3. Check DynamoDB update permissions
4. Review Lambda CloudWatch logs

---

## Production Deployment

### 1. Update Lambda Environment
```bash
aws lambda update-function-configuration \
  --function-name khaya-trpc-handler \
  --environment Variables="{
    PAYSTACK_SECRET_KEY=PAYSTACK_SECRET_KEY_HERE,
    TWILIO_ACCOUNT_SID=ACxxx,
    TWILIO_AUTH_TOKEN=xxx,
    TWILIO_WHATSAPP_NUMBER=+27xxx,
    DYNAMODB_TABLE_NAME=KhayaTable,
    S3_BUCKET_NAME=khaya-proof-photos,
    PLATFORM_FEE_PERCENT=0.05
  }"
```

### 2. Deploy Backend
```bash
cd backend
npm run build
sam deploy --guided
```

### 3. Update Frontend
```bash
cd client
npm run build
aws s3 sync dist/ s3://projectkhaya-frontend-1762772155/
aws cloudfront create-invalidation --distribution-id E4J3KAA9XDTHS --paths "/*"
```

### 4. Test End-to-End
1. Create test job
2. Make test payment (Paystack test mode)
3. Verify webhook received
4. Check SMS sent
5. Submit photo proof
6. Verify payment released
7. Check worker balance updated

---

## Monitoring

### CloudWatch Alarms
```bash
# Webhook failures
aws cloudwatch put-metric-alarm \
  --alarm-name khaya-webhook-failures \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold

# SMS failures
aws cloudwatch put-metric-alarm \
  --alarm-name khaya-sms-failures \
  --metric-name SMSFailures \
  --namespace Khaya \
  --statistic Sum \
  --period 300 \
  --threshold 3 \
  --comparison-operator GreaterThanThreshold
```

### Logs to Monitor
- Lambda: `/aws/lambda/khaya-trpc-handler`
- Paystack webhooks: Paystack Dashboard → Webhooks → Logs
- Twilio SMS: Twilio Console → Messaging → Logs

---

**System is production-ready once all checklist items are complete.** ✅
