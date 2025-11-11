# 🔑 Setup AWS Credentials (One-Time Setup)

## ⚠️ IMPORTANT: Never Share Your AWS Keys!

- ❌ Don't paste them in chat
- ❌ Don't commit them to git
- ❌ Don't share them in screenshots
- ✅ Only enter them in your local terminal

---

## 🚀 Quick Setup (2 Minutes)

### Step 1: Get Your AWS Credentials

1. Log into AWS Console: https://console.aws.amazon.com
2. Click your name (top right) → Security Credentials
3. Scroll to "Access keys"
4. Click "Create access key"
5. Save both:
   - Access Key ID (starts with `AKIA...`)
   - Secret Access Key (long random string)

---

### Step 2: Configure AWS CLI

In your terminal, run:

```bash
aws configure
```

You'll be prompted for:

```
AWS Access Key ID [None]: AKIA................
AWS Secret Access Key [None]: ................................
Default region name [None]: us-east-1
Default output format [None]: json
```

**Just paste your credentials when prompted!**

---

### Step 3: Verify It Works

```bash
aws s3 ls
```

You should see your S3 buckets listed, including:
- `projectkhaya-frontend-1762772155`

---

## ✅ Once Configured, Deploy!

After AWS is configured, simply run:

```bash
cd /workspaces/Khaya
./deploy-frontend-update.sh
```

That's it! Your new frontend will be live in 2-3 minutes.

---

## 🔒 Security Notes

Your credentials are stored securely in:
- `~/.aws/credentials` (encrypted on your machine)
- Never committed to git (already in .gitignore)
- Only accessible to you

---

## 🆘 Don't Have AWS Credentials?

If you don't have access to the AWS account:

1. Ask the AWS account owner to:
   - Create an IAM user for you
   - Give permissions: S3 Full Access + CloudFront Full Access
   - Send you the Access Key ID and Secret Access Key

2. Or ask them to run the deployment script themselves

---

## 📞 Alternative: Manual Upload

If you can't get AWS CLI working, you can upload manually:

1. Go to AWS Console → S3
2. Open bucket: `projectkhaya-frontend-1762772155`
3. Upload all files from `dist/public/` folder
4. Go to CloudFront → Distribution `E4J3KAA9XDTHS`
5. Create invalidation for path: `/*`

---

**Ready? Run: `aws configure` in your terminal now!**
