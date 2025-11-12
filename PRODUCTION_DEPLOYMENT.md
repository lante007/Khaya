# 🚀 Production Deployment Guide

**Date**: 2024-11-12  
**Status**: Ready to Deploy  
**Target**: AWS Lambda + CloudFront

---

## ✅ **Pre-Deployment Checklist**

- [x] MailerSend configured and tested
- [x] Domain verified (projectkhaya.co.za)
- [x] Email OTP working
- [x] Profile pictures working
- [x] Core features tested
- [x] Code committed to GitHub
- [ ] Production environment variables ready
- [ ] AWS credentials configured
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test production

---

## 🔧 **Step 1: Prepare Environment Variables**

You'll need these values for deployment:

```bash
# Required
JWT_SECRET=your-production-jwt-secret-here
MAILERSEND_API_KEY=mlsn.your-key-here

# Optional (can add later)
PAYSTACK_SECRET_KEY=sk_your-paystack-key
TWILIO_ACCOUNT_SID=ACyour-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🚀 **Step 2: Deploy Backend (AWS Lambda)**

### **Option A: Using SAM CLI** (Recommended)

```bash
cd /workspaces/Khaya/backend

# Build
sam build

# Deploy (interactive)
sam deploy --guided

# You'll be prompted for:
# - Stack name: khaya-backend-prod
# - AWS Region: af-south-1
# - JwtSecret: [paste your JWT secret]
# - MailerSendApiKey: [paste your MailerSend key]
# - PaystackSecretKey: [optional]
# - TwilioAccountSid: [optional]
# - TwilioAuthToken: [optional]
# - TwilioPhoneNumber: [optional]
# - FrontendUrl: https://projectkhaya.co.za
# - Confirm changes: Y
# - Allow SAM CLI IAM role creation: Y
# - Save arguments to config: Y
```

### **Option B: Using Deploy Script**

```bash
cd /workspaces/Khaya/backend

# Set environment variables
export JWT_SECRET="your-jwt-secret"
export MAILERSEND_API_KEY="your-mailersend-key"

# Deploy
./deploy.sh
```

### **What Gets Deployed:**
- ✅ Lambda function (Node.js 20)
- ✅ API Gateway (REST API)
- ✅ DynamoDB table
- ✅ S3 bucket for uploads
- ✅ Cognito User Pool
- ✅ IAM roles and policies

### **Expected Output:**
```
Successfully created/updated stack - khaya-backend-prod

Outputs:
ApiUrl: https://abc123.execute-api.af-south-1.amazonaws.com/prod
S3BucketName: khaya-uploads-abc123
DynamoDBTableName: ProjectKhaya-prod
```

**Save the `ApiUrl` - you'll need it for the frontend!**

---

## 🌐 **Step 3: Deploy Frontend (CloudFront)**

### **Update Frontend Configuration**

```bash
cd /workspaces/Khaya/client

# Create production .env
cat > .env.production << EOF
VITE_API_URL=https://your-api-url-from-step-2/trpc
EOF
```

### **Build Frontend**

```bash
npm run build
```

### **Deploy to S3 + CloudFront**

**Option A: Manual Upload**
```bash
# Upload to S3
aws s3 sync dist/ s3://projectkhaya.co.za --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

**Option B: Using Existing CloudFront**
If you already have CloudFront set up for projectkhaya.co.za:
1. Build: `npm run build`
2. Upload `dist/` contents to your S3 bucket
3. Invalidate CloudFront cache

---

## 🧪 **Step 4: Test Production**

### **Test API Endpoint**
```bash
# Health check
curl https://your-api-url/health

# Test auth endpoint
curl -X POST https://your-api-url/trpc/auth.signIn \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### **Test Frontend**
1. Visit https://projectkhaya.co.za
2. Click "Sign Up" or "Auth"
3. Enter your email
4. Click "Send Code"
5. Check email for OTP
6. Enter OTP
7. ✅ Should be logged in!

### **Test Email Sending**
```bash
# From your local machine
cd /workspaces/Khaya/backend

# Update .env with production API URL
# Then test
npx tsx test-mailersend-simple.ts your-email@example.com
```

---

## 📊 **Step 5: Monitor Deployment**

### **CloudWatch Logs**
```bash
# View Lambda logs
aws logs tail /aws/lambda/khaya-backend-prod-KhayaFunction --follow

# Filter for errors
aws logs filter-pattern "[ERROR]" /aws/lambda/khaya-backend-prod-KhayaFunction
```

### **MailerSend Dashboard**
- https://app.mailersend.com/
- Check email delivery rates
- Monitor for bounces/complaints

### **API Gateway Metrics**
- https://console.aws.amazon.com/apigateway/
- Check request counts
- Monitor error rates
- Check latency

---

## 🔒 **Step 6: Security Checklist**

- [ ] JWT_SECRET is strong and unique
- [ ] API keys are not in git
- [ ] CORS is configured correctly
- [ ] HTTPS only (no HTTP)
- [ ] Rate limiting enabled (optional)
- [ ] CloudWatch alarms set up
- [ ] Backup strategy in place

---

## 🎯 **Post-Deployment Checklist**

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] API endpoint working
- [ ] Email OTP working in production
- [ ] Profile pictures uploading
- [ ] Job posting working
- [ ] Bidding working
- [ ] Mobile responsive
- [ ] No console errors
- [ ] SSL certificate valid

---

## 🚨 **Troubleshooting**

### **Lambda Function Errors**
```bash
# Check logs
aws logs tail /aws/lambda/khaya-backend-prod-KhayaFunction --follow

# Common issues:
# - Missing environment variables
# - DynamoDB permissions
# - S3 permissions
# - Timeout (increase in template.yaml)
```

### **Email Not Sending**
- Check MailerSend API key is correct
- Verify domain is still verified
- Check CloudWatch logs for errors
- Test with curl directly

### **CORS Errors**
- Update FrontendUrl in template.yaml
- Redeploy backend
- Clear browser cache

### **404 Errors**
- Check API Gateway deployment
- Verify API URL in frontend .env
- Check CloudFront distribution

---

## 📈 **Monitoring & Alerts**

### **Set Up CloudWatch Alarms**
```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name khaya-high-error-rate \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# High latency alarm
aws cloudwatch put-metric-alarm \
  --alarm-name khaya-high-latency \
  --alarm-description "Alert when latency > 3s" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 3000 \
  --comparison-operator GreaterThanThreshold
```

---

## 💰 **Cost Estimation**

### **Monthly Costs (Estimated)**
```
Lambda:           $5-20 (1M requests)
API Gateway:      $3-10 (1M requests)
DynamoDB:         $5-15 (on-demand)
S3:               $1-5 (storage + transfer)
CloudFront:       $5-15 (CDN)
MailerSend:       $0 (free tier: 12k emails)

Total:            $20-65/month
```

---

## 🎉 **Success Criteria**

Your deployment is successful when:
- ✅ API responds to health checks
- ✅ Users can sign up with email OTP
- ✅ Emails are delivered
- ✅ Profile pictures upload
- ✅ Jobs can be posted
- ✅ Bids can be submitted
- ✅ No critical errors in logs
- ✅ Page load time < 3s

---

## 📞 **Support**

### **AWS Support**
- Console: https://console.aws.amazon.com/
- Docs: https://docs.aws.amazon.com/

### **MailerSend Support**
- Dashboard: https://app.mailersend.com/
- Docs: https://developers.mailersend.com/

---

## 🚀 **Ready to Deploy?**

**Quick Deploy Command:**
```bash
cd /workspaces/Khaya/backend
sam build && sam deploy --guided
```

**Then:**
1. Note the API URL from outputs
2. Update frontend .env.production
3. Build and deploy frontend
4. Test everything
5. **LAUNCH!** 🎉

---

**Deployment Time**: 15-30 minutes  
**Difficulty**: Medium  
**Prerequisites**: AWS CLI configured, SAM CLI installed

**Let's do this!** 💪
