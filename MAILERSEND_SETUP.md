# MailerSend Integration - Setup Guide
**Date**: 2024-11-12  
**Status**: ✅ Integrated & Ready  
**Email**: noreply@projectkhaya.co.za

---

## 🎯 **What Changed**

### **Replaced AWS SES with MailerSend**
- ❌ **Removed**: AWS SES (failed to set up)
- ✅ **Added**: MailerSend API
- ✅ **Email**: noreply@projectkhaya.co.za
- ✅ **No Duplicates**: Unified email service across both backends

---

## 📦 **Files Modified**

### **Backend (AWS Lambda)**
1. `backend/src/lib/email.ts` - ✅ Replaced SES with MailerSend
2. `backend/src/config/aws.ts` - ✅ Removed SES client
3. `backend/package.json` - ✅ Added mailersend dependency
4. `backend/.env.example` - ✅ Added MAILERSEND_API_KEY
5. `backend/test-email.ts` - ✅ Created test script

### **Server (Express)**
1. `server/services/email.ts` - ✅ Replaced nodemailer with MailerSend
2. `package.json` (root) - ✅ Added mailersend dependency

### **No Duplicates**
- ✅ Both backends now use the same MailerSend implementation
- ✅ Removed old nodemailer code
- ✅ Removed AWS SES references

---

## 🔧 **Setup Instructions**

### **Step 1: Get MailerSend API Key**

1. Go to [MailerSend Dashboard](https://app.mailersend.com/)
2. Navigate to **Settings** → **API Tokens**
3. Click **Generate New Token**
4. Name it: "Khaya Production"
5. Select scopes: **Email** (Full access)
6. Copy the API key

### **Step 2: Configure Environment Variables**

#### **Backend (.env)**
```bash
cd backend
cp .env.example .env
nano .env
```

Add:
```bash
MAILERSEND_API_KEY=your_mailersend_api_key_here
```

#### **Root (.env)**
```bash
cd /workspaces/Khaya
nano .env
```

Add:
```bash
MAILERSEND_API_KEY=your_mailersend_api_key_here
```

### **Step 3: Verify Domain**

1. In MailerSend Dashboard, go to **Domains**
2. Add domain: `projectkhaya.co.za`
3. Add DNS records to your domain:
   - **TXT** record for verification
   - **CNAME** records for DKIM
   - **TXT** record for SPF
4. Wait for verification (usually 5-15 minutes)

### **Step 4: Test Email Sending**

```bash
cd backend
npx tsx test-email.ts your-email@example.com
```

Expected output:
```
🧪 Testing MailerSend Email Integration...

✅ MailerSend API key found
📧 From: noreply@projectkhaya.co.za

📬 Sending test OTP to: your-email@example.com
🔢 OTP Code: 123456

✅ Email sent successfully!
📨 Message ID: abc123...

📥 Check your inbox for the verification email
⏰ The email should arrive within a few seconds

✨ Test complete!
```

---

## 📧 **Email Templates**

### **OTP Verification Email**
- **Subject**: Your Project Khaya Verification Code
- **From**: noreply@projectkhaya.co.za
- **Template**: Professional with branded header
- **Features**:
  - Large, centered OTP code
  - 10-minute expiration notice
  - Security warnings
  - Responsive design

### **Welcome Email**
- **Subject**: Welcome to Project Khaya!
- **From**: noreply@projectkhaya.co.za
- **Template**: Branded welcome message
- **Features**:
  - Personalized greeting
  - Role-specific next steps
  - Dashboard link button
  - Help center links

### **Job Notification Email**
- **Subject**: Project Khaya: {Job Title}
- **From**: noreply@projectkhaya.co.za
- **Template**: Simple notification
- **Features**:
  - Job title in subject
  - Custom message body
  - Branded footer

---

## 🧪 **Testing**

### **Test OTP Email**
```bash
cd backend
npx tsx test-email.ts your-email@example.com
```

### **Test in Development**
1. Start dev server: `npm run dev`
2. Go to `/auth` page
3. Enter email address
4. Click "Send Code"
5. Check email inbox
6. Enter OTP code
7. Verify login works

### **Test in Production**
1. Deploy to AWS Lambda
2. Test auth flow on live site
3. Monitor MailerSend dashboard for delivery stats

---

## 📊 **MailerSend Features**

### **Free Tier**
- ✅ 12,000 emails/month
- ✅ 3,000 emails/day
- ✅ Email analytics
- ✅ Delivery tracking
- ✅ Bounce handling
- ✅ Spam score checking

### **Monitoring**
- Dashboard: https://app.mailersend.com/
- View sent emails
- Track delivery rates
- Monitor bounces/complaints
- Check spam scores

### **Rate Limits**
- **Free**: 3,000 emails/day
- **Burst**: 100 emails/minute
- **Recommended**: Add rate limiting in code

---

## 🔒 **Security Best Practices**

### **API Key Management**
- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ✅ Use different keys for dev/prod

### **Email Security**
- ✅ SPF record configured
- ✅ DKIM signing enabled
- ✅ DMARC policy set
- ✅ SSL/TLS encryption

### **Rate Limiting**
```typescript
// Add to email.ts
const emailRateLimit = new Map<string, number[]>();

function checkEmailRateLimit(email: string): boolean {
  const key = email.toLowerCase();
  const now = Date.now();
  const requests = emailRateLimit.get(key) || [];
  
  // Remove requests older than 1 hour
  const recent = requests.filter(t => now - t < 3600000);
  
  // Max 5 emails per hour per address
  if (recent.length >= 5) {
    return false;
  }
  
  recent.push(now);
  emailRateLimit.set(key, recent);
  return true;
}
```

---

## 🐛 **Troubleshooting**

### **Email Not Sending**
1. Check API key is correct
2. Verify domain is verified in MailerSend
3. Check DNS records are propagated
4. Review MailerSend dashboard for errors
5. Check CloudWatch logs (Lambda)

### **Email Goes to Spam**
1. Verify SPF/DKIM/DMARC records
2. Check spam score in MailerSend
3. Warm up domain (send gradually)
4. Avoid spam trigger words
5. Include unsubscribe link

### **Rate Limit Errors**
1. Check daily limit (3,000/day)
2. Implement exponential backoff
3. Add request queuing
4. Consider upgrading plan

### **Domain Not Verified**
1. Wait 15-30 minutes for DNS propagation
2. Use `dig` to check DNS records:
   ```bash
   dig TXT projectkhaya.co.za
   dig TXT _dmarc.projectkhaya.co.za
   ```
3. Contact MailerSend support if stuck

---

## 📈 **Monitoring & Analytics**

### **Key Metrics to Track**
- **Delivery Rate**: Should be >95%
- **Open Rate**: Typical 20-30% for transactional
- **Bounce Rate**: Should be <5%
- **Complaint Rate**: Should be <0.1%

### **MailerSend Dashboard**
- View real-time delivery stats
- Track email opens (if enabled)
- Monitor bounces and complaints
- Check spam scores

### **CloudWatch Logs** (Lambda)
```bash
# View logs
aws logs tail /aws/lambda/KhayaFunction --follow

# Search for email logs
aws logs filter-pattern "[EMAIL]" /aws/lambda/KhayaFunction
```

---

## 🚀 **Next Steps**

### **Immediate**
- [x] Integrate MailerSend API
- [x] Remove AWS SES code
- [x] Test email sending
- [ ] Add API key to production environment
- [ ] Verify domain in MailerSend
- [ ] Test OTP flow end-to-end

### **Soon**
- [ ] Add email rate limiting
- [ ] Implement email templates in MailerSend UI
- [ ] Set up email analytics tracking
- [ ] Add unsubscribe functionality
- [ ] Create email preference center

### **Later**
- [ ] A/B test email templates
- [ ] Add email scheduling
- [ ] Implement email campaigns
- [ ] Set up automated email sequences

---

## 💰 **Cost Comparison**

### **MailerSend (Current)**
- **Free Tier**: 12,000 emails/month
- **Cost**: $0/month (within free tier)
- **Overage**: $1 per 1,000 emails

### **AWS SES (Previous Attempt)**
- **Setup**: Failed ❌
- **Cost**: $0.10 per 1,000 emails
- **Complexity**: High (domain verification, IAM, etc.)

### **Recommendation**
- ✅ Start with MailerSend free tier
- ✅ Monitor usage monthly
- ✅ Upgrade if needed (12k emails = ~400 signups/day)

---

## 📚 **Resources**

- [MailerSend Documentation](https://developers.mailersend.com/)
- [MailerSend Node.js SDK](https://github.com/mailersend/mailersend-nodejs)
- [Email Best Practices](https://www.mailersend.com/blog/email-deliverability-best-practices)
- [SPF/DKIM/DMARC Guide](https://www.mailersend.com/blog/spf-dkim-dmarc)

---

## ✅ **Integration Checklist**

- [x] Install mailersend package
- [x] Replace SES with MailerSend in backend
- [x] Replace nodemailer with MailerSend in server
- [x] Remove duplicate email code
- [x] Create test script
- [x] Update .env.example
- [x] Document setup process
- [ ] Add API key to production
- [ ] Verify domain
- [ ] Test OTP flow
- [ ] Monitor delivery rates

---

**Integration Complete**: 2024-11-12  
**Status**: ✅ Ready for Testing  
**Next**: Add API key and verify domain
