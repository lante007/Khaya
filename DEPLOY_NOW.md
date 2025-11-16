# 🚀 DEPLOY TO PRODUCTION NOW!

**Everything is ready!** Here's your deployment command:

---

## 📋 **What You Need**

1. Your MailerSend API key (you already have this)
2. A JWT secret (I'll generate one for you)
3. 15 minutes

---

## 🔑 **Step 1: Generate JWT Secret**

```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

Copy the output - you'll need it!

---

## 🚀 **Step 2: Deploy Backend**

```bash
cd /workspaces/Khaya/backend

# Build the Lambda function
sam build

# Deploy (you'll be prompted for values)
sam deploy --guided
```

### **When Prompted, Enter:**

```
Stack Name: khaya-backend-prod
AWS Region: af-south-1
Parameter JwtSecret: [paste your JWT secret from Step 1]
Parameter MailerSendApiKey: [paste your MailerSend API key]
Parameter PaystackSecretKey: [press Enter to skip]
Parameter TwilioAccountSid: [press Enter to skip]
Parameter TwilioAuthToken: [press Enter to skip]
Parameter TwilioPhoneNumber: [press Enter to skip]
Parameter FrontendUrl: https://projectkhaya.co.za
Confirm changes: Y
Allow IAM role creation: Y
Save arguments: Y
```

### **SAVE THE API URL!**

At the end, you'll see:
```
Outputs
-------
ApiUrl: https://abc123xyz.execute-api.af-south-1.amazonaws.com/prod
```

**Copy this URL!**

---

## 🌐 **Step 3: Deploy Frontend**

```bash
cd /workspaces/Khaya/client

# Create production environment file
echo "VITE_API_URL=https://YOUR_API_URL/trpc" > .env.production

# Build
npm run build

# Deploy (if you have S3/CloudFront)
aws s3 sync dist/ s3://projectkhaya.co.za --delete
```

---

## 🧪 **Step 4: Test**

```bash
# Test API
curl https://your-api-url/health

# Test frontend
# Visit https://projectkhaya.co.za
# Try signing up with email OTP
```

---

## 🎉 **YOU'RE LIVE!**

**Timeline**: ~20 minutes  
**Cost**: ~$20-50/month  
**Status**: Production Ready!

---

**Ready to deploy?** Just run:

```bash
cd /workspaces/Khaya/backend && sam build && sam deploy --guided
```

**Need help?** Let me know! 🚀
