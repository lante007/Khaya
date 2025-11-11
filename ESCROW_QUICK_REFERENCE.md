# 🔒 Escrow System - Quick Reference

## 🎯 Core Concept
**Funds held until buyer submits photo proof. No automatic payouts.**

---

## 💰 Payment Split
```
R500 payment
├─ R475 (95%) → Worker balance
└─ R25 (5%)   → Platform fee
```

---

## 🔄 Flow States

### 1. Payment Received (Webhook)
```typescript
Payment: { released: false, proofNeeded: true }
Job: { status: 'in_progress', escrowHeld: true }
SMS: "Job started! Submit photo proof to release payment"
```

### 2. Proof Submitted (Mutation)
```typescript
Payment: { released: true, workerAmount: 475, platformFee: 25 }
Job: { status: 'completed', proofUrl: 's3://...' }
Worker: { balance: +475, totalEarnings: +475 }
```

---

## 🔑 Key Functions

### Webhook Handler
```typescript
// File: payments.router.ts
case 'charge.success':
  - Store payment with released: false
  - Update job to in_progress
  - Send SMS to buyer
```

### Job Completion
```typescript
// File: jobs.router.ts
jobs.complete({ jobId, proofUrl })
  - Validate proofNeeded === true
  - Calculate 95/5 split
  - Release to worker balance
  - Return { released: true, netPaid, fee }
```

---

## 🧪 Test Commands

### Run Tests
```bash
cd backend && npx ts-node tests/webhook-test.ts
```

### Test Webhook
```bash
curl -X POST https://your-api.com/trpc/payments.paystackWebhook \
  -H "x-paystack-signature: SIGNATURE" \
  -d '{"event":"charge.success","data":{...}}'
```

### Test Completion
```bash
curl -X POST https://your-api.com/trpc/jobs.complete \
  -H "Authorization: Bearer TOKEN" \
  -d '{"jobId":"123","proofUrl":"https://s3.../proof.jpg"}'
```

---

## 📋 Deployment Checklist

- [ ] Set `PAYSTACK_SECRET_KEY` in Lambda
- [ ] Set `TWILIO_ACCOUNT_SID` in Lambda
- [ ] Set `TWILIO_AUTH_TOKEN` in Lambda
- [ ] Configure Paystack webhook URL
- [ ] Enable `charge.success` event
- [ ] Create S3 bucket `khaya-proof-photos`
- [ ] Deploy backend: `sam deploy`
- [ ] Test end-to-end flow

---

## 🔍 Verify Working

### Check Escrow Held
```bash
GET /trpc/payments.getJobPayments?jobId=123
# Expect: { released: false, escrowAmount: 500 }
```

### Check Payment Released
```bash
POST /trpc/jobs.complete
# Expect: { released: true, netPaid: 475, fee: 25 }
```

### Check Worker Balance
```bash
GET /trpc/user.getProfile
# Expect: { balance: 475, totalEarnings: 475 }
```

---

## ⚠️ Common Issues

### Webhook not firing
→ Check Paystack dashboard → Webhooks → Logs

### SMS not sending
→ Verify Twilio phone number format: +27...

### Payment not releasing
→ Check `proofNeeded: true` and `released: false`

### Balance not updating
→ Verify worker user exists in DynamoDB

---

## 📁 Key Files

```
backend/src/routers/
├─ payments.router.ts    ← Webhook handler
├─ jobs.router.ts        ← Completion mutation
backend/src/lib/
├─ paystack.ts           ← Transfer API
├─ twilio.ts             ← SMS notifications
backend/tests/
├─ webhook-test.ts       ← Tests
docs/
├─ ESCROW_SCHEMA.md      ← Database schema
├─ ESCROW_ENV_SETUP.md   ← Environment vars
├─ ESCROW_DEPLOYMENT.md  ← Full deployment guide
└─ ESCROW_SYSTEM_COMPLETE.md ← Complete summary
```

---

## 🚀 Deploy Now

```bash
cd /workspaces/Khaya/backend
npm run build
sam deploy
```

---

**System is production-ready. No automatic payouts. Proof required.** ✅
