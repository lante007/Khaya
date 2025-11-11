# 🔑 Configure YOUR AWS Credentials

## Current Issue

You're using Gitpod's AWS credentials, which don't have access to your S3 bucket.

**Current credentials:**
```
arn:aws:sts::889818960042:assumed-role/us-east-1-01-gitpodec2environmentminimalrole
```

**Your bucket is in account:** `615608124862` (different account!)

---

## ✅ Solution: Use YOUR AWS Credentials

### Step 1: Get Your AWS Credentials

1. **Login to YOUR AWS Console:**
   https://console.aws.amazon.com

2. **Go to IAM:**
   https://console.aws.amazon.com/iam/home#/users

3. **Find your user** (or create one if needed)

4. **Security Credentials tab** → **Create access key**

5. **Save both:**
   - Access Key ID (starts with `AKIA...`)
   - Secret Access Key (long random string)

---

### Step 2: Configure AWS CLI

Run this command and enter YOUR credentials:

```bash
aws configure
```

**Enter:**
```
AWS Access Key ID [****************]: AKIA... (your key)
AWS Secret Access Key [****************]: ... (your secret)
Default region name [us-east-1]: us-east-1
Default output format [json]: json
```

---

### Step 3: Verify It Works

```bash
aws s3 ls s3://projectkhaya-frontend-1762772155/
```

**Should show:** List of files in your bucket
**Should NOT show:** Access Denied error

---

### Step 4: Deploy!

```bash
cd /workspaces/Khaya
./deploy-frontend-update.sh
```

Or manually:

```bash
# Upload files
aws s3 sync dist/public/ s3://projectkhaya-frontend-1762772155 --delete --region us-east-1

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E4J3KAA9XDTHS --paths "/*"
```

---

## 🔐 Security Notes

### Where credentials are stored:
```
~/.aws/credentials
```

### To switch back to Gitpod credentials:
```bash
unset AWS_ACCESS_KEY_ID
unset AWS_SECRET_ACCESS_KEY
```

### To use your credentials again:
```bash
aws configure
```

---

## 🆘 Don't Have AWS Access?

### Option A: Get IAM User Created

Ask the AWS account owner (account `615608124862`) to:

1. Create IAM user for you
2. Attach policies:
   - `AmazonS3FullAccess`
   - `CloudFrontFullAccess`
3. Create access key
4. Send you the credentials (securely!)

### Option B: Use AWS Console

Upload manually via web interface:

1. **S3 Console:**
   https://s3.console.aws.amazon.com/s3/buckets/projectkhaya-frontend-1762772155

2. **Upload files** from `/workspaces/Khaya/dist/public/`

3. **CloudFront Console:**
   https://console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions/E4J3KAA9XDTHS

4. **Create invalidation** for `/*`

### Option C: Ask Owner to Deploy

Send them this:

```bash
# They run these commands:
cd /workspaces/Khaya
aws s3 sync dist/public/ s3://projectkhaya-frontend-1762772155 --delete
aws cloudfront create-invalidation --distribution-id E4J3KAA9XDTHS --paths "/*"
```

---

## 📋 Quick Checklist

- [ ] Got AWS Access Key ID and Secret from IAM
- [ ] Ran `aws configure` with YOUR credentials
- [ ] Tested with `aws s3 ls s3://projectkhaya-frontend-1762772155/`
- [ ] Saw list of files (not Access Denied)
- [ ] Ready to deploy!

---

## 🎯 Next Steps

Once you have YOUR credentials configured:

```bash
cd /workspaces/Khaya
./deploy-frontend-update.sh
```

**Then visit:** https://projectkhaya.co.za (wait 2-3 minutes)

---

**The build is ready - just need the right AWS credentials to upload it!** 🚀
