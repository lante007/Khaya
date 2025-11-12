# 🎯 Configure Paystack Webhook - Step by Step

## ⚡ Quick Setup (5 minutes)

### Step 1: Open Paystack Dashboard
**URL:** https://dashboard.paystack.com/

**Login with your Paystack account**

---

### Step 2: Navigate to Webhooks
1. Click **Settings** in the left sidebar
2. Click **API Keys & Webhooks**
3. Scroll down to the **Webhooks** section

---

### Step 3: Add Webhook URL
1. Click the **"Add Webhook URL"** button
2. In the URL field, paste this EXACT URL:

```
https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook
```

3. Click **Save** or **Add**

---

### Step 4: Enable Events
Select these 4 events (check the boxes):

- ✅ **charge.success** ← MOST IMPORTANT (payment received)
- ✅ **charge.failed** (payment failed)
- ✅ **transfer.success** (payout successful)
- ✅ **transfer.failed** (payout failed)

Click **Save** or **Update**

---

### Step 5: Test the Webhook
1. Find the **"Test Webhook"** button
2. Select **charge.success** from the dropdown
3. Click **Send Test**
4. You should see: **✅ 200 OK** response

---

## ✅ Verification Checklist

After completing the steps above, verify:

- [ ] Webhook URL is saved in Paystack dashboard
- [ ] URL shows: `https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook`
- [ ] `charge.success` event is enabled (checked)
- [ ] `charge.failed` event is enabled (checked)
- [ ] `transfer.success` event is enabled (checked)
- [ ] `transfer.failed` event is enabled (checked)
- [ ] Test webhook returned 200 OK

---

## 🧪 Test It Works

### Option 1: Use Paystack Test Mode
1. Go to Paystack Dashboard
2. Switch to **Test Mode** (toggle at top)
3. Create a test payment
4. Use test card: **4084 0840 8408 4081**
5. Check webhook was received

### Option 2: Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --follow
```

Look for log entries like:
```
Escrow held: R500 for job job-123
```

---

## 📊 What Happens When Webhook Fires

### When Payment is Received (charge.success):
1. ✅ Webhook receives payment notification
2. ✅ Funds stored in escrow (not released yet)
3. ✅ Job status updated to `in_progress`
4. ✅ SMS sent to buyer: "Job started! Submit photo proof to release payment"
5. ✅ Payment marked as `released: false` (held)

### When Buyer Submits Photo Proof:
1. ✅ System validates proof is required
2. ✅ Calculates 95% worker / 5% platform split
3. ✅ Releases payment to worker balance
4. ✅ Updates job to `completed`
5. ✅ Worker can withdraw funds

---

## 🔍 Troubleshooting

### Issue: Webhook not receiving events
**Check:**
1. URL is exactly: `https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook`
2. Events are enabled (checkboxes checked)
3. Paystack is in LIVE mode (not test mode)
4. Test webhook returns 200 OK

### Issue: Test webhook fails
**Check:**
1. Lambda function is running
2. API Gateway endpoint is accessible
3. Check CloudWatch logs for errors

### Issue: Payments not going into escrow
**Check:**
1. Webhook is configured correctly
2. Payment metadata includes `jobId` and `userId`
3. Check CloudWatch logs for webhook events

---

## 📞 Need Help?

### Check Webhook Logs in Paystack
1. Go to **Settings** → **API Keys & Webhooks**
2. Scroll to **Webhooks** section
3. Click **View Logs**
4. Check delivery status and responses

### Check Lambda Logs
```bash
# View recent logs
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --follow

# Filter for webhook events
aws logs filter-log-events \
  --log-group-name /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --filter-pattern "webhook"
```

---

## ✅ Success!

Once configured, your escrow payment system is LIVE:

- ✅ Payments held securely until work verified
- ✅ Photo proof required for release
- ✅ 95% to worker, 5% platform fee
- ✅ SMS notifications sent
- ✅ Worker balance updated automatically

---

## 🎯 Next Steps After Configuration

1. **Test with real payment** (small amount)
2. **Verify SMS notification sent**
3. **Test photo proof submission**
4. **Verify payment released to worker**
5. **Check worker balance updated**

---

**Your webhook URL:**
```
https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/payments.paystackWebhook
```

**Copy this URL and paste it in Paystack dashboard!** 📋

---

**Once configured, the escrow system is fully operational!** 🚀✅
