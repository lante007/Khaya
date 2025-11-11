# Paystack Integration Guide

## ✅ Paystack is Now Integrated!

The backend now uses **Paystack** for all payment processing instead of Yoco.

---

## 🔑 Setup Paystack

### 1. Create Paystack Account

1. Go to [https://paystack.com](https://paystack.com)
2. Sign up for a business account
3. Complete KYC verification
4. Get your API keys

### 2. Get API Keys

From your Paystack Dashboard:
- **Test Secret Key**: `sk_test_xxxxx` (for development)
- **Live Secret Key**: `sk_live_xxxxx` (for production)
- **Public Key**: `pk_test_xxxxx` or `pk_live_xxxxx`

### 3. Set Environment Variables

```bash
# For local development
export PAYSTACK_SECRET_KEY="sk_test_your_key_here"

# For production deployment
export PAYSTACK_SECRET_KEY="sk_live_your_key_here"
```

---

## 📦 What's Integrated

### Payment Features

1. **One-time Payments**
   - Job payments with escrow
   - Platform fee calculation (5%)
   - Fee waivers for first 2 jobs (workers)
   - Secure payment links
   - Payment verification

2. **Subscriptions**
   - Pro Plan: R149/month
   - Elite Plan: R299/month
   - Automatic recurring billing
   - Email-based subscription management
   - Plan changes and cancellations

3. **Webhooks**
   - Payment success notifications
   - Payment failure handling
   - Subscription events
   - Automatic status updates

---

## 🚀 How It Works

### For Job Payments

```typescript
// Client initiates payment
const payment = await trpc.payments.initializePayment.mutate({
  jobId: 'job_123',
  amount: 1000, // R1000
  description: 'Build a wall'
});

// User is redirected to Paystack
window.location.href = payment.authorizationUrl;

// After payment, verify
const verification = await trpc.payments.verifyPayment.mutate({
  reference: payment.reference
});
```

### For Subscriptions

```typescript
// Subscribe to a plan
const subscription = await trpc.subscriptions.subscribe.mutate({
  plan: 'pro' // or 'elite'
});

// User receives email to complete setup
// Paystack handles recurring billing automatically
```

---

## 💰 Pricing Structure

### Platform Fees

- **Standard**: 5% platform fee
- **Pro Subscribers**: 5% platform fee
- **Elite Subscribers**: 3% platform fee
- **First 2 Jobs (Workers)**: 0% fee (waived)

### Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| **Basic** | Free | 5 job posts/month, Basic support |
| **Pro** | R149/month | 20 jobs/month, Priority support, Featured listings |
| **Elite** | R299/month | Unlimited jobs, Premium support, 3% fee, Analytics |

---

## 🔧 Configuration

### Create Subscription Plans in Paystack

1. Log into Paystack Dashboard
2. Go to Settings → Plans
3. Create two plans:

**Pro Plan:**
- Name: `Pro Monthly`
- Amount: R149 (14900 kobo)
- Interval: Monthly
- Plan Code: `PLN_pro_monthly`

**Elite Plan:**
- Name: `Elite Monthly`
- Amount: R299 (29900 kobo)
- Interval: Monthly
- Plan Code: `PLN_elite_monthly`

### Set Up Webhooks

1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-api-url/trpc/payments.paystackWebhook`
3. Select events:
   - `charge.success`
   - `charge.failed`
   - `subscription.create`
   - `subscription.disable`

---

## 🧪 Testing

### Test Mode

Use test API keys for development:

```bash
export PAYSTACK_SECRET_KEY="sk_test_xxxxx"
```

### Test Cards

Paystack provides test cards:

**Success:**
- Card: `4084 0840 8408 4081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`

**Decline:**
- Card: `5060 6666 6666 6666`

**Insufficient Funds:**
- Card: `5078 5078 5078 5078`

---

## 📊 Monitoring

### Paystack Dashboard

Monitor:
- Transaction volume
- Success rates
- Failed payments
- Subscription metrics
- Revenue analytics

### CloudWatch Logs

Check Lambda logs for:
- Payment initialization
- Verification results
- Webhook events
- Error messages

---

## 🔒 Security

### Best Practices

1. **Never expose secret keys**
   - Use environment variables
   - Never commit to git
   - Rotate keys regularly

2. **Verify webhooks**
   - Always verify webhook signatures
   - Implemented in `verifyWebhookSignature()`

3. **Validate amounts**
   - Check payment amounts match expected
   - Verify currency (ZAR)

4. **Handle errors gracefully**
   - Log all payment errors
   - Notify users of failures
   - Provide retry mechanisms

---

## 🐛 Troubleshooting

### Payment Initialization Fails

```bash
# Check API key
echo $PAYSTACK_SECRET_KEY

# Verify user email exists
# Check CloudWatch logs for errors
```

### Webhook Not Receiving Events

1. Verify webhook URL is correct
2. Check webhook is enabled in Paystack
3. Test webhook with Paystack's test tool
4. Check Lambda logs for incoming requests

### Subscription Not Activating

1. User must click email link from Paystack
2. Check subscription status in Paystack Dashboard
3. Verify webhook events are being received

---

## 📚 API Reference

### Payment Endpoints

```typescript
// Initialize payment
trpc.payments.initializePayment.mutate({
  jobId: string,
  amount: number,
  description: string
})

// Verify payment
trpc.payments.verifyPayment.mutate({
  paymentId?: string,
  reference?: string
})

// Release escrow
trpc.payments.releaseEscrow.mutate({
  paymentId: string,
  jobId: string
})
```

### Subscription Endpoints

```typescript
// Subscribe
trpc.subscriptions.subscribe.mutate({
  plan: 'pro' | 'elite'
})

// Cancel
trpc.subscriptions.cancelSubscription.mutate({
  reason?: string
})

// Change plan
trpc.subscriptions.changePlan.mutate({
  newPlan: 'pro' | 'elite'
})
```

---

## 🎯 Next Steps

1. **Get Paystack Account**
   - Sign up at paystack.com
   - Complete verification
   - Get API keys

2. **Configure Plans**
   - Create Pro and Elite plans
   - Set up webhooks
   - Test with test keys

3. **Deploy**
   - Set production API key
   - Deploy backend
   - Test live payments

4. **Monitor**
   - Watch Paystack Dashboard
   - Check CloudWatch logs
   - Monitor success rates

---

## 💡 Tips

- Start with test mode
- Test all payment flows
- Monitor webhook events
- Keep API keys secure
- Use Paystack's test cards
- Check logs regularly

---

## 📞 Support

- **Paystack Docs**: https://paystack.com/docs
- **Paystack Support**: support@paystack.com
- **API Status**: https://status.paystack.com

---

**You're all set with Paystack! 🎉**

The integration is complete and ready for production use.
