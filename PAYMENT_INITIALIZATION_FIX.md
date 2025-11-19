# Payment Initialization Fix - Paystack Configuration ⚠️

## Problem Identified

Payment initialization is failing when clients try to accept bids and pay. The payment flow cannot proceed.

## Root Cause

The **Paystack API keys** in the Lambda function are set to placeholder values instead of actual keys:

```
PAYSTACK_PUBLIC_KEY: "DEPLOYED_TO_AWS"
PAYSTACK_SECRET_KEY: "DEPLOYED_TO_AWS" (or incorrect value)
```

When the backend tries to initialize a payment with Paystack, it fails because these are not valid API keys.

## Current Configuration

### Lambda Environment Variables
```bash
PAYSTACK_PUBLIC_KEY=DEPLOYED_TO_AWS  ❌ Invalid placeholder
PAYSTACK_SECRET_KEY=****             ❌ Unknown (masked)
```

### Frontend Configuration (.env.production)
```bash
VITE_PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PAYSTACK_PUBLIC_KEY  ✅ Valid
```

**Issue**: Frontend has the correct public key, but backend has placeholder values.

## How Payment Initialization Works

1. **Client accepts a bid** on job detail page
2. **Frontend calls** `payments.initializePayment` mutation
3. **Backend validates** job ownership and user details
4. **Backend calls Paystack API** to create payment session:
   ```typescript
   const session = await createPaymentSession({
     userId: ctx.user!.userId,
     email: user.email,
     amount: input.amount,
     jobId: input.jobId,
     userType: 'buyer',
     completedJobs: user.completedJobs || 0
   });
   ```
5. **Paystack returns** authorization URL and reference
6. **Frontend redirects** user to Paystack payment page
7. **User completes payment** on Paystack
8. **Paystack webhook** notifies backend
9. **Backend verifies** payment and releases funds

**Current Failure Point**: Step 4 - Backend cannot call Paystack API with invalid keys

## Required Paystack Keys

You need to obtain these from your Paystack dashboard:

### Live Keys (Production)
- **Public Key**: `pk_live_...` (already have: pk_live_YOUR_PAYSTACK_PUBLIC_KEY)
- **Secret Key**: `sk_live_...` (NEEDED - get from Paystack dashboard)

### Test Keys (Development)
- **Public Key**: `pk_test_...`
- **Secret Key**: `sk_test_...`

## How to Get Paystack Keys

1. **Login to Paystack Dashboard**: https://dashboard.paystack.com
2. **Navigate to Settings** → **API Keys & Webhooks**
3. **Copy your keys**:
   - Public Key (starts with `pk_live_`)
   - Secret Key (starts with `sk_live_`)
4. **Keep secret key secure** - never commit to git

## Fix Option 1: Update Lambda Environment Variables Directly

**Quick fix** - Update the Lambda function environment variables:

```bash
aws lambda update-function-configuration \
  --function-name project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --environment "Variables={
    PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PAYSTACK_PUBLIC_KEY,
    PAYSTACK_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET_KEY,
    TWILIO_ACCOUNT_SID=AC_YOUR_TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER=+27600179045,
    FRONTEND_URL=https://projectkhaya.co.za,
    JWT_SECRET=your-jwt-secret,
    MAILERSEND_API_KEY=your-mailersend-key
  }"
```

**Note**: Replace `sk_live_YOUR_ACTUAL_SECRET_KEY` with your actual Paystack secret key.

## Fix Option 2: Update SAM Parameters and Redeploy

**Proper fix** - Update the CloudFormation stack parameters:

1. **Create parameter file** (`backend/parameters.json`):
```json
{
  "Parameters": {
    "PaystackSecretKey": "sk_live_YOUR_ACTUAL_SECRET_KEY",
    "PaystackPublicKey": "pk_live_YOUR_PAYSTACK_PUBLIC_KEY",
    "TwilioAccountSid": "AC_YOUR_TWILIO_ACCOUNT_SID",
    "TwilioAuthToken": "YOUR_TWILIO_AUTH_TOKEN",
    "TwilioPhoneNumber": "+27600179045",
    "FrontendUrl": "https://projectkhaya.co.za",
    "JwtSecret": "your-jwt-secret",
    "MailerSendApiKey": "your-mailersend-key"
  }
}
```

2. **Deploy with parameters**:
```bash
cd /workspaces/Khaya/backend
sam deploy \
  --stack-name project-khaya-api \
  --parameter-overrides file://parameters.json \
  --no-confirm-changeset
```

## Fix Option 3: Use AWS Secrets Manager (Best Practice)

**Most secure** - Store secrets in AWS Secrets Manager:

1. **Create secret**:
```bash
aws secretsmanager create-secret \
  --name khaya/paystack/secret-key \
  --secret-string "sk_live_YOUR_ACTUAL_SECRET_KEY"
```

2. **Update Lambda to read from Secrets Manager**
3. **Grant Lambda permission to read secret**

## Testing After Fix

### Test Payment Flow
1. **Login as client**
2. **Post a job**
3. **Login as worker** (different account)
4. **Place a bid** on the job
5. **Login as client** again
6. **Accept the bid**
7. **Click "Pay Now"**
8. **Expected**: Redirected to Paystack payment page
9. **Complete payment** on Paystack
10. **Expected**: Redirected back to app, payment confirmed

### Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --since 5m \
  --filter-pattern "Paystack" \
  --follow
```

**Expected logs after fix**:
```
[Payment] Initializing payment for job: abc123
[Paystack] Creating payment session for user@example.com
[Paystack] Payment session created: ref_xyz789
[Payment] Payment initialized successfully
```

**Current error logs** (before fix):
```
[Paystack] Error: Paystack error: Invalid API key
[Payment] Failed to initialize payment
```

## Security Considerations

### DO NOT:
- ❌ Commit secret keys to git
- ❌ Share secret keys in chat/email
- ❌ Use test keys in production
- ❌ Hardcode keys in source code

### DO:
- ✅ Store keys in environment variables
- ✅ Use AWS Secrets Manager for production
- ✅ Rotate keys periodically
- ✅ Use different keys for test/production
- ✅ Monitor API usage in Paystack dashboard

## Paystack Dashboard Setup

### Required Configuration
1. **API Keys**: Get live keys
2. **Webhook URL**: Set to `https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.webhook`
3. **Allowed Origins**: Add `https://d3q4wvlwbm3s1h.cloudfront.net`
4. **Test Mode**: Disable for production

### Webhook Events to Enable
- `charge.success` - Payment completed
- `charge.failed` - Payment failed
- `transfer.success` - Payout completed
- `transfer.failed` - Payout failed

## Payment Flow Diagram

```
Client                Frontend              Backend               Paystack
  |                      |                     |                     |
  |-- Accept Bid ------->|                     |                     |
  |                      |-- initializePayment->|                     |
  |                      |                     |-- Create Session -->|
  |                      |                     |<-- Auth URL --------|
  |                      |<-- Redirect URL ----|                     |
  |<-- Redirect to Paystack ------------------>|                     |
  |                                             |                     |
  |-- Enter Card Details ------------------------------------------>|
  |<-- Payment Confirmation -----------------------------------------|
  |                                             |<-- Webhook --------|
  |                                             |-- Verify Payment ->|
  |                                             |<-- Confirmed ------|
  |<-- Redirect to App -------------------------|                     |
  |                                             |                     |
```

## Current Status

⚠️ **BLOCKED - Awaiting Paystack Secret Key**

### What's Working
- ✅ Frontend has correct public key
- ✅ Payment UI displays correctly
- ✅ Backend code is correct
- ✅ Database schema is ready

### What's Blocked
- ❌ Cannot initialize payments (invalid API key)
- ❌ Cannot process payments
- ❌ Cannot verify payments
- ❌ Cannot release funds to workers

### Impact
- **Clients**: Cannot pay for jobs
- **Workers**: Cannot receive payments
- **Platform**: No revenue (5% fee)

## Next Steps

1. **Get Paystack Secret Key** from dashboard
2. **Choose fix option** (recommend Option 1 for quick fix)
3. **Update Lambda environment** with correct key
4. **Test payment flow** end-to-end
5. **Monitor CloudWatch logs** for errors
6. **Verify webhook** is receiving events

## Alternative: Use Test Mode

If you don't have live keys yet, you can use test mode:

1. **Get test keys** from Paystack dashboard
2. **Update Lambda** with test keys:
   ```
   PAYSTACK_PUBLIC_KEY=pk_test_...
   PAYSTACK_SECRET_KEY=sk_test_...
   ```
3. **Use test cards** for payments:
   - Card: 4084 0840 8408 4081
   - CVV: 408
   - Expiry: Any future date
   - PIN: 0000

**Note**: Test mode won't process real money, but allows testing the flow.

## Files Involved

### Backend
- `backend/src/lib/paystack.ts` - Paystack integration
- `backend/src/routers/payments.router.ts` - Payment endpoints
- `backend/template.yaml` - SAM template with parameters
- `backend/src/config/aws.ts` - Configuration

### Frontend
- `client/src/components/PaymentFlow.tsx` - Payment UI
- `.env.production` - Frontend environment variables

## Documentation

- **Paystack Docs**: https://paystack.com/docs/api/
- **Paystack Dashboard**: https://dashboard.paystack.com
- **AWS Lambda Env Vars**: https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html

## Status

⚠️ **REQUIRES MANUAL CONFIGURATION**

Payment initialization cannot be fixed automatically because it requires:
1. Access to Paystack dashboard
2. Actual secret API key
3. Manual configuration update

**Action Required**: Provide Paystack secret key to complete the fix.

---

## Quick Fix Command (Once You Have the Key)

```bash
# Replace YOUR_SECRET_KEY with actual key from Paystack dashboard
aws lambda update-function-configuration \
  --function-name project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --environment Variables="{PAYSTACK_SECRET_KEY=sk_live_YOUR_SECRET_KEY,PAYSTACK_PUBLIC_KEY=pk_live_YOUR_PAYSTACK_PUBLIC_KEY,TWILIO_ACCOUNT_SID=AC_YOUR_TWILIO_ACCOUNT_SID,TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN,TWILIO_PHONE_NUMBER=+27600179045,FRONTEND_URL=https://projectkhaya.co.za}"

# Wait 30 seconds for Lambda to update
sleep 30

# Test payment initialization
echo "Payment initialization should now work!"
```

**After running this command, test the payment flow immediately.**
