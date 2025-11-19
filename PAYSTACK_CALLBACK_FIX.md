# Paystack Callback URL Fix - 2025-11-19

## Issue
After successful payment on Paystack, users were stuck on the Paystack checkout page:
```
https://checkout.paystack.com/gcjoc09sqqje6p1
```

They were not automatically redirected back to projectkhaya.co.za.

## Root Cause
The payment initialization was not setting a `callback_url` parameter, so Paystack had no URL to redirect users to after payment completion.

## Solution

### 1. Added `callback_url` to Paystack Library

**File:** `backend/src/lib/paystack.ts`

Updated `createPaymentSession` to accept and pass `callback_url`:
```typescript
export async function createPaymentSession(params: {
  userId: string;
  email: string;
  amount: number;
  jobId: string;
  userType: 'buyer' | 'worker';
  completedJobs: number;
  reference?: string;
  metadata?: Record<string, any>;
  callback_url?: string;  // NEW
})
```

Pass it to Paystack API:
```typescript
const payment = await initializePayment({
  email: params.email,
  amount: finalAmount,
  reference,
  metadata,
  callback_url: params.callback_url  // NEW
});
```

### 2. Added Frontend URL to Config

**File:** `backend/src/config/aws.ts`

```typescript
export const config = {
  // ... existing config
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mailerSendApiKey: process.env.MAILERSEND_API_KEY || ''
};
```

The `FRONTEND_URL` environment variable is already set in `template.yaml`:
```yaml
Environment:
  Variables:
    FRONTEND_URL: !Ref FrontendUrl
```

Value: `https://projectkhaya.co.za`

### 3. Updated Payment Router to Set Callback URL

**File:** `backend/src/routers/payments.router.ts`

#### For `initializePayment` procedure:
```typescript
// Build callback URL - redirect to job page after payment
const callbackUrl = jobId 
  ? `${config.frontendUrl}/jobs/${jobId}?payment=success`
  : `${config.frontendUrl}/dashboard?payment=success`;

const session = await createPaymentSession({
  userId: ctx.user!.userId,
  email: input.email,
  amount: input.amount,
  jobId: jobId || 'no-job',
  userType: 'buyer',
  completedJobs: user.completedJobs || 0,
  reference,
  metadata: input.metadata,
  callback_url: callbackUrl  // NEW
});
```

#### For legacy `initializePaymentLegacy` procedure:
```typescript
// Build callback URL - redirect to job page after payment
const callbackUrl = `${config.frontendUrl}/jobs/${input.jobId}?payment=success`;

const session = await createPaymentSession({
  userId: ctx.user!.userId,
  email: user.email,
  amount: input.amount,
  jobId: input.jobId,
  userType: 'buyer',
  completedJobs: user.completedJobs || 0,
  callback_url: callbackUrl  // NEW
});
```

## Callback URL Format

### For Job Payments
```
https://projectkhaya.co.za/jobs/{jobId}?payment=success
```

Example:
```
https://projectkhaya.co.za/jobs/c9afb5de-275e-43c6-a7f3-ec4bc24265bd?payment=success
```

### For Non-Job Payments
```
https://projectkhaya.co.za/dashboard?payment=success
```

## Payment Flow After Fix

1. **User clicks "Pay Deposit"**
   - Frontend calls `escrow.create` or `paystack.initializePayment`
   
2. **Backend creates Paystack session**
   - Includes `callback_url` parameter
   - Example: `https://projectkhaya.co.za/jobs/abc-123?payment=success`
   
3. **User redirected to Paystack**
   - Enters payment details
   - Completes payment
   
4. **Paystack processes payment**
   - Sends webhook to backend (for escrow updates)
   - Redirects user to `callback_url`
   
5. **User returns to projectkhaya.co.za**
   - Lands on job page with `?payment=success` query param
   - Frontend can show success message
   - User sees updated payment status

## Frontend Integration

The frontend can detect successful payment and show a message:

```typescript
// In JobDetail.tsx or similar
const [searchParams] = useSearchParams();
const paymentSuccess = searchParams.get('payment') === 'success';

useEffect(() => {
  if (paymentSuccess) {
    toast.success('Payment successful! Your deposit has been received.');
    // Optionally remove the query param
    window.history.replaceState({}, '', window.location.pathname);
  }
}, [paymentSuccess]);
```

## Files Modified

1. **backend/src/lib/paystack.ts**
   - Added `callback_url` parameter to `createPaymentSession`
   - Pass `callback_url` to `initializePayment`

2. **backend/src/config/aws.ts**
   - Added `frontendUrl` to config
   - Added `mailerSendApiKey` to config

3. **backend/src/routers/payments.router.ts**
   - Import `config` from aws.ts
   - Build callback URL for each payment
   - Pass callback URL to `createPaymentSession`

## Testing

### Test Payment Flow
1. Go to [https://projectkhaya.co.za](https://projectkhaya.co.za)
2. Navigate to a job
3. Click "Pay Deposit"
4. Complete payment on Paystack (use test card: 4084084084084081)
5. **Verify:** After payment, you should be redirected back to the job page
6. **Verify:** URL should include `?payment=success`

### Expected Behavior
✅ User completes payment on Paystack  
✅ Paystack redirects to `https://projectkhaya.co.za/jobs/{jobId}?payment=success`  
✅ User sees the job page with payment confirmation  
✅ Payment status updates in the UI  

### Previous Behavior (Bug)
❌ User completes payment on Paystack  
❌ User stays on `https://checkout.paystack.com/...`  
❌ User must manually navigate back to the site  
❌ Confusing user experience  

## Deployment

**Date:** 2025-11-19 07:41 UTC

**Backend:**
```bash
cd backend
npm run build
sam build
sam deploy --no-confirm-changeset
```

**Status:** ✅ Deployed successfully

**Environment Variables:**
- `FRONTEND_URL`: `https://projectkhaya.co.za` (already configured)

## Verification

✅ `callback_url` parameter added to Paystack initialization  
✅ Frontend URL configured in environment  
✅ Callback URL includes job ID and success parameter  
✅ Backend deployed to production  
✅ Payment redirect should now work  

## Next Steps

1. **Test with real payment:**
   - Use Paystack test card: 4084084084084081
   - Verify redirect works
   - Check URL includes `?payment=success`

2. **Add frontend success handling:**
   - Show toast notification on successful payment
   - Refresh payment status
   - Clear query parameter from URL

3. **Monitor CloudWatch logs:**
   ```bash
   aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --follow
   ```
   - Look for: `Paystack session created: { reference: ..., callbackUrl: ... }`

## Related Documentation

- `ESCROW_PROCEDURES_FIX.md` - Escrow endpoint fixes
- `PAYSTACK_CONFIGURED.md` - Paystack integration setup
- `PROJECTKHAYA_LIVE_STATUS.md` - Live deployment status
