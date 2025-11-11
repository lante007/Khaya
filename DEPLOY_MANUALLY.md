# 🚀 Deploy Manually via AWS Console

Since AWS CLI needs your personal credentials, here's how to deploy via the AWS Console:

---

## Option 1: AWS Console Upload (Easiest - 5 minutes)

### Step 1: Download the Build Files

The built files are in: `/workspaces/Khaya/dist/public/`

**Download these files to your computer:**
1. In VSCode file explorer (left sidebar)
2. Navigate to: `Khaya` → `dist` → `public`
3. Right-click on `public` folder → Download

### Step 2: Upload to S3

1. **Go to AWS S3 Console:**
   https://s3.console.aws.amazon.com/s3/buckets/projectkhaya-frontend-1762772155

2. **Delete old files:**
   - Select all files in the bucket
   - Click "Delete"
   - Confirm deletion

3. **Upload new files:**
   - Click "Upload"
   - Click "Add files" and "Add folder"
   - Select all files from the downloaded `public` folder
   - Make sure to include the `assets` folder
   - Click "Upload"

### Step 3: Invalidate CloudFront Cache

1. **Go to CloudFront Console:**
   https://console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions/E4J3KAA9XDTHS

2. **Create Invalidation:**
   - Click "Invalidations" tab
   - Click "Create invalidation"
   - Enter: `/*`
   - Click "Create invalidation"

3. **Wait 2-3 minutes** for invalidation to complete

### Step 4: Test

Visit: https://projectkhaya.co.za

Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)

---

## Option 2: Use Your AWS Credentials (Faster - 2 minutes)

### Step 1: Configure AWS CLI with YOUR credentials

```bash
aws configure
```

Enter YOUR credentials:
- AWS Access Key ID: [from your AWS account]
- AWS Secret Access Key: [from your AWS account]
- Default region: us-east-1
- Default output format: json

### Step 2: Run Deployment Script

```bash
cd /workspaces/Khaya
./deploy-frontend-update.sh
```

---

## Option 3: Ask Someone with Access

If you don't have AWS credentials, ask the person who set up the AWS account to:

1. Run these commands:
```bash
cd /workspaces/Khaya

# Upload to S3
aws s3 sync dist/public/ s3://projectkhaya-frontend-1762772155 --delete --region us-east-1

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E4J3KAA9XDTHS --paths "/*"
```

2. Wait 2-3 minutes

3. Visit https://projectkhaya.co.za

---

## 📦 What Files to Upload

Make sure these files are uploaded:

```
public/
├── index.html (0.87 KB)
└── assets/
    ├── hero-khaya-BzZc7SFL.jpg (197 KB)
    ├── worker-icon-DqDIAEkK.jpg (92 KB)
    ├── materials-icon-Cc9GLedd.jpg (106 KB)
    ├── index-DAB-pkm-.css (124 KB)
    └── index-hVS1gB5e.js (865 KB) ← IMPORTANT: New build!
```

---

## ✅ How to Verify It Worked

### 1. Check the JavaScript file name

Visit: https://projectkhaya.co.za

View page source (Ctrl+U), look for:
```html
<script type="module" crossorigin src="/assets/index-hVS1gB5e.js"></script>
```

**Should be:** `index-hVS1gB5e.js` (NEW)
**Not:** `index-B09rGcYB.js` (OLD)

### 2. Check for errors

Press F12 → Console tab
**Should see:** No errors
**Should NOT see:** URL@[native code] errors

### 3. Test buttons

Click "Find Materials & Services" button
**Should:** Navigate to materials page
**Should NOT:** Show JavaScript error

---

## 🔧 Troubleshooting

### Still seeing old version?

1. **Hard refresh:** Ctrl + Shift + R
2. **Clear browser cache:** Settings → Clear browsing data
3. **Try incognito/private window**
4. **Wait 5 minutes** for CloudFront to fully update

### Files not uploading?

- Make sure you have write permissions to the S3 bucket
- Check you're uploading to the correct bucket: `projectkhaya-frontend-1762772155`
- Verify all files including the `assets` folder

### CloudFront still cached?

Create another invalidation:
```bash
aws cloudfront create-invalidation --distribution-id E4J3KAA9XDTHS --paths "/*"
```

---

## 🎯 Quick Checklist

- [ ] Downloaded `dist/public/` folder (or have AWS credentials)
- [ ] Deleted old files from S3 bucket
- [ ] Uploaded new files to S3 bucket
- [ ] Created CloudFront invalidation for `/*`
- [ ] Waited 2-3 minutes
- [ ] Hard refreshed browser
- [ ] Verified new JavaScript file: `index-hVS1gB5e.js`
- [ ] Tested buttons work
- [ ] No console errors

---

## 💡 Why Manual Upload?

The Gitpod environment doesn't have access to your personal AWS account. You need to either:
1. Upload via AWS Console (no credentials needed, just login)
2. Configure AWS CLI with your personal credentials
3. Ask someone with AWS access to deploy

---

**Choose the option that works best for you and deploy now!** 🚀

The new build is ready and waiting in `dist/public/` - it just needs to be uploaded to S3!
