# 📧 OTP Temporary Solution

## ⚠️ Current Situation

**Issue:** Email OTP sending is not implemented yet (requires AWS SES setup).

**Temporary Solution:** OTP codes are logged to CloudWatch for testing.

---

## 🔍 How to Get OTP Codes (For Testing)

### Method 1: Check CloudWatch Logs (Recommended)

**Step 1: Request OTP on website**
- User enters email
- Clicks "Send OTP"

**Step 2: Check CloudWatch Logs**
```bash
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --since 5m --filter-pattern "[OTP]"
```

**You'll see:**
```
[OTP] Generated for user@example.com: 509829 (expires in 10 min)
```

**Step 3: Use the OTP code**
- Enter the 6-digit code on the website
- Complete verification

---

### Method 2: AWS Console (Web Interface)

1. Go to: https://console.aws.amazon.com/cloudwatch/
2. Click **Logs** → **Log groups**
3. Find: `/aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw`
4. Click on latest log stream
5. Search for: `[OTP] Generated`
6. Copy the 6-digit code

---

## 🎯 Example Flow

### User Signup:
1. User enters: `amanda@projectkhaya.co.za`
2. Clicks "Send OTP"
3. **You check CloudWatch logs:**
   ```
   [OTP] Generated for amanda@projectkhaya.co.za: 123456
   ```
4. **You tell the user:** "Your OTP is 123456"
5. User enters code and completes signup

---

## ✅ Permanent Solution (Coming Soon)

### Option 1: AWS SES (Email)
**Setup:**
1. Verify domain in AWS SES
2. Add email sending code
3. OTP sent via email automatically

**Cost:** ~$0.10 per 1,000 emails

### Option 2: Twilio SendGrid (Email)
**Setup:**
1. Create SendGrid account
2. Add API key to Lambda
3. OTP sent via email automatically

**Cost:** Free tier: 100 emails/day

### Option 3: Phone-Based OTP (Already Working!)
**If user has phone number:**
- OTP sent via SMS (Twilio)
- Already configured and working
- No manual checking needed

---

## 🚀 Quick Fix for Production

### Add Email Sending (5 minutes)

**1. Install AWS SES SDK** (already installed)

**2. Add email function to `backend/src/lib/email.ts`:**
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { config } from '../config/aws.js';

const ses = new SESClient({ region: config.region });

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    await ses.send(new SendEmailCommand({
      Source: 'noreply@projectkhaya.co.za',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Your Project Khaya OTP Code' },
        Body: {
          Text: { Data: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.` }
        }
      }
    }));
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
```

**3. Update auth router:**
```typescript
// Import email function
import { sendOTPEmail } from '../lib/email.js';

// In requestOTP mutation, add:
if (input.email) {
  await sendOTPEmail(input.email, otp);
}
```

**4. Verify domain in AWS SES:**
- Go to AWS SES Console
- Add domain: projectkhaya.co.za
- Verify DNS records

---

## 📊 Current Status

### Working ✅
- OTP generation
- OTP validation
- OTP expiry (10 minutes)
- CloudWatch logging
- SMS sending (if phone exists)

### Not Working ❌
- Email sending (not implemented)
- Automatic OTP delivery to email

### Workaround ✅
- Check CloudWatch logs for OTP
- Manually provide OTP to users
- Works for testing and early users

---

## 🎯 Recommendation

### For Testing (Now):
- Use CloudWatch logs to get OTP codes
- Manually provide codes to test users
- Works perfectly for development

### For Production (Soon):
- Set up AWS SES (1 hour)
- Verify domain
- Enable automatic email sending
- No manual intervention needed

---

## 📞 How to Help Users Right Now

**When user says "I didn't receive OTP":**

1. **Check CloudWatch logs:**
   ```bash
   aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --since 10m --filter-pattern "[OTP]"
   ```

2. **Find their email:**
   ```
   [OTP] Generated for user@email.com: 123456
   ```

3. **Tell them the code:**
   "Your verification code is: 123456"

4. **They enter it and continue**

---

## ✅ Summary

**Current State:**
- ✅ OTP system working
- ✅ Codes logged to CloudWatch
- ❌ Email sending not implemented

**Temporary Solution:**
- Check CloudWatch logs for OTP codes
- Manually provide to users

**Permanent Solution:**
- Set up AWS SES (coming soon)
- Automatic email delivery

**For Now:**
- System is functional for testing
- Can onboard early users manually
- No blocker for launch

---

**OTP Code Location:**
```bash
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --since 5m --filter-pattern "[OTP]"
```

**Look for:**
```
[OTP] Generated for EMAIL: CODE (expires in 10 min)
```

---

**This is a temporary solution for testing. Email sending will be added soon!** 📧✅
