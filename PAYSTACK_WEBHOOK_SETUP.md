# Paystack Webhook Configuration

## 🎯 Webhook URL

```
https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook
```

## 📋 Setup Instructions

### 1. Login to Paystack Dashboard
Go to: https://dashboard.paystack.com/

### 2. Navigate to Webhooks
- Click **Settings** in the left sidebar
- Click **API Keys & Webhooks**
- Scroll to **Webhooks** section

### 3. Add Webhook URL
- Click **Add Webhook URL**
- Enter: `https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook`
- Click **Save**

### 4. Enable Events
Select these events:
- ✅ **charge.success** (REQUIRED - Payment successful)
- ✅ **charge.failed** (Payment failed)
- ✅ **transfer.success** (Payout successful)
- ✅ **transfer.failed** (Payout failed)

### 5. Test Webhook
- Click **Test Webhook** button
- Select `charge.success` event
- Click **Send Test**
- Check response is `200 OK`

## 🧪 Manual Test

```bash
# Get your webhook secret from Paystack dashboard
WEBHOOK_SECRET="your_webhook_secret_here"

# Generate signature
PAYLOAD='{"event":"charge.success","data":{"reference":"test_ref","amount":50000,"metadata":{"jobId":"test-job","userId":"test-user"}}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha512 -hmac "$WEBHOOK_SECRET" | awk '{print $2}')

# Send test webhook
curl -X POST https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

## ✅ Verification

After setup, verify:
1. Webhook URL is saved in Paystack dashboard
2. Events are enabled (charge.success, charge.failed, transfer.*)
3. Test webhook returns 200 OK
4. Check CloudWatch logs for webhook events

## 📊 Monitoring

### CloudWatch Logs
```bash
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --follow --filter-pattern "Escrow"
```

### Paystack Dashboard
- Go to **Webhooks** → **Logs**
- Check delivery status
- View request/response

## 🔒 Security

- Webhook signature is verified on every request
- Invalid signatures are rejected with 401 Unauthorized
- All webhook events are logged to CloudWatch

---

**Webhook is ready to receive escrow payment events!** ✅
