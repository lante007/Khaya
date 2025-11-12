# 📧 AWS SES Email Verification Required

## ⚠️ Action Needed

**AWS SES has sent verification emails to:**
- ✉️ Amanda@projectkhaya.co.za
- ✉️ noreply@projectkhaya.co.za

**You must verify these emails before OTP emails can be sent.**

---

## 🎯 Steps to Verify

### 1. Check Your Inbox
Look for emails from: **Amazon Web Services (no-reply-aws@amazon.com)**

**Subject:** "Amazon Web Services – Email Address Verification Request in region US East (N. Virginia)"

### 2. Click the Verification Link
- Open the email
- Click the verification link
- You'll see: "Congratulations! You have successfully verified..."

### 3. Verify Both Emails
- Amanda@projectkhaya.co.za ← **Primary sender**
- noreply@projectkhaya.co.za ← **Backup sender**

---

## 🔍 Check Verification Status

```bash
aws ses get-identity-verification-attributes \
  --identities Amanda@projectkhaya.co.za noreply@projectkhaya.co.za \
  --region us-east-1
```

**Expected after verification:**
```json
{
  "Amanda@projectkhaya.co.za": {
    "VerificationStatus": "Success"
  }
}
```

---

## 🧪 Test Email Sending (After Verification)

### Test OTP Email:
```bash
curl -X POST https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/auth.requestOTP \
  -H "Content-Type: application/json" \
  -d '{"email":"Amanda@projectkhaya.co.za"}'
```

**Expected:**
- ✅ Email received in inbox
- ✅ OTP code visible
- ✅ Professional HTML email

---

## ⚠️ SES Sandbox Mode

**Current Status:** Sandbox Mode (Testing Only)

**Limitations:**
- ✅ Can send to verified email addresses
- ❌ Cannot send to unverified addresses
- ❌ Limited to 200 emails per day
- ❌ 1 email per second

**To Remove Limitations:**
1. Go to: https://console.aws.amazon.com/ses/
2. Click **"Request production access"**
3. Fill out the form:
   - **Use case:** Transactional emails (OTP codes)
   - **Website:** https://projectkhaya.co.za
   - **Expected volume:** 1,000 emails/day
   - **Bounce handling:** Yes, we monitor bounces
4. Submit request
5. AWS typically approves within 24 hours

---

## 📊 What's Been Configured

### ✅ Email Sending Function
**File:** `backend/src/lib/email.ts`

**Features:**
- Send OTP emails (HTML + Text)
- Send welcome emails
- Send job notifications
- Professional email templates
- Error handling and logging

### ✅ Auth Router Updated
**File:** `backend/src/routers/auth.router.ts`

**Changes:**
- Imports email sending function
- Sends OTP via email when requested
- Falls back to SMS if phone exists
- Logs success/failure

### ✅ Lambda Permissions
**Added:** SES email sending permissions

**Policy:**
```json
{
  "Effect": "Allow",
  "Action": [
    "ses:SendEmail",
    "ses:SendRawEmail"
  ],
  "Resource": "*"
}
```

### ✅ Backend Deployed
**Lambda:** Updated with email sending code
**Status:** Ready to send (pending verification)

---

## 🎯 Current Status

```
┌─────────────────────────────────────────┐
│  📧 EMAIL SYSTEM STATUS                │
├─────────────────────────────────────────┤
│  Email Function:     ✅ CREATED        │
│  Auth Router:        ✅ UPDATED        │
│  Lambda Deployed:    ✅ DEPLOYED       │
│  SES Permissions:    ✅ ADDED          │
│  Email Verification: ⏳ PENDING        │
│  Production Access:  ⏳ SANDBOX        │
└─────────────────────────────────────────┘
```

---

## 🚀 Next Steps

### Immediate (5 minutes):
1. ✅ Check inbox for verification emails
2. ✅ Click verification links
3. ✅ Test OTP sending

### Soon (24 hours):
1. Request production access
2. Wait for AWS approval
3. Send to any email address

---

## 📞 Testing Right Now

### Option 1: Verify Amanda@projectkhaya.co.za
- Check inbox
- Click verification link
- Test OTP to that email

### Option 2: Add Test Email
```bash
# Add your test email
aws ses verify-email-identity --email-address your-test@email.com --region us-east-1

# Check inbox
# Click verification link

# Test OTP
curl -X POST https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/auth.requestOTP \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test@email.com"}'
```

---

## ✅ What Happens After Verification

### User Flow:
1. User enters email on website
2. Clicks "Send OTP"
3. **Email arrives in inbox** ✉️
4. User sees professional HTML email
5. User copies 6-digit OTP code
6. User enters code on website
7. User is verified and continues

### Email Template:
```
Subject: Your Project Khaya Verification Code

Your Project Khaya verification code is: 123456

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Project Khaya Team
https://projectkhaya.co.za
```

---

## 🔍 Troubleshooting

### Issue: Verification email not received
**Check:**
1. Spam/Junk folder
2. Email address is correct
3. AWS SES service is available

**Resend:**
```bash
aws ses verify-email-identity --email-address Amanda@projectkhaya.co.za --region us-east-1
```

### Issue: OTP email not sending
**Check:**
1. Email is verified (see status command above)
2. Lambda has SES permissions
3. CloudWatch logs for errors

**View logs:**
```bash
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --follow --filter-pattern "[EMAIL]"
```

---

## 📧 Verification Email Example

**From:** Amazon Web Services <no-reply-aws@amazon.com>  
**Subject:** Amazon Web Services – Email Address Verification Request

**Body:**
```
We have received a request to authorize this email address for use 
with Amazon SES in region US East (N. Virginia). If you requested 
this verification, please go to the following URL to confirm that 
you are authorized to use this email address:

https://email-verification.us-east-1.amazonaws.com/...

Your request will expire in 24 hours.
```

---

## ✅ Summary

**What's Done:**
- ✅ Email sending function created
- ✅ Auth router updated
- ✅ Lambda deployed
- ✅ SES permissions added
- ✅ Verification emails sent

**What's Needed:**
- ⏳ Click verification links in inbox
- ⏳ Request production access (optional)

**Once verified, OTP emails will be sent automatically!** 📧✅

---

**Check your inbox for verification emails from AWS!** ✉️
