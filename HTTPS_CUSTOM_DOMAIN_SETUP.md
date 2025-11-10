# 🔒 HTTPS & Custom Domain Setup for ProjectKhaya.co.za

## ✅ What's Already Done

- ✅ **CloudFront Distribution Created**: E4J3KAA9XDTHS
- ✅ **HTTPS Enabled**: Free SSL via CloudFront
- ✅ **CDN Active**: Global content delivery
- ✅ **S3 Origin Configured**: Connected to your frontend

**Temporary HTTPS URL**: https://d3q4wvlwbm3s1h.cloudfront.net

---

## 🎯 Goal

Make your site accessible at: **https://projectkhaya.co.za**

---

## 📋 Steps to Complete (AWS Console)

Your IAM user has limited permissions, so you'll need to complete these steps in the AWS Console:

### Step 1: Request SSL Certificate (5 minutes)

1. **Go to AWS Certificate Manager**:
   - https://console.aws.amazon.com/acm/home?region=us-east-1

2. **Click "Request certificate"**

3. **Choose "Request a public certificate"** → Next

4. **Add domain names**:
   - `projectkhaya.co.za`
   - `www.projectkhaya.co.za`

5. **Validation method**: Choose **DNS validation**

6. **Click "Request"**

7. **Note the Certificate ARN** (you'll need this later)

---

### Step 2: Validate Certificate via DNS (10-30 minutes)

1. **In ACM, click on your certificate**

2. **You'll see DNS validation records** like:
   ```
   Name: _abc123.projectkhaya.co.za
   Type: CNAME
   Value: _xyz456.acm-validations.aws.
   ```

3. **Add these CNAME records to your domain**:
   
   **Option A: If you manage DNS at your registrar**
   - Log into your domain registrar (where you bought projectkhaya.co.za)
   - Go to DNS settings
   - Add the CNAME records shown in ACM
   - Save changes

   **Option B: Use Route 53 (Recommended)**
   - Go to Route 53: https://console.aws.amazon.com/route53/
   - Click "Create hosted zone"
   - Domain name: `projectkhaya.co.za`
   - Click "Create hosted zone"
   - **Note the 4 nameservers** (ns-xxxx.awsdns-xx.com)
   - Update your domain registrar to use these nameservers
   - In Route 53, click "Create records from ACM" (easy button!)

4. **Wait for validation** (5-30 minutes)
   - Certificate status will change from "Pending validation" to "Issued"

---

### Step 3: Add Custom Domain to CloudFront (5 minutes)

1. **Go to CloudFront**:
   - https://console.aws.amazon.com/cloudfront/

2. **Find your distribution**: E4J3KAA9XDTHS

3. **Click on the distribution ID**

4. **Click "Edit"** (General tab)

5. **Alternate domain names (CNAMEs)**:
   - Add: `projectkhaya.co.za`
   - Add: `www.projectkhaya.co.za`

6. **Custom SSL certificate**:
   - Select your certificate from the dropdown
   - (It will only appear after Step 2 is complete)

7. **Click "Save changes"**

8. **Wait for deployment** (5-15 minutes)
   - Status will change from "In Progress" to "Deployed"

---

### Step 4: Point Domain to CloudFront (5 minutes)

**Option A: Using Route 53 (Recommended)**

1. **Go to Route 53**:
   - https://console.aws.amazon.com/route53/

2. **Click on your hosted zone**: projectkhaya.co.za

3. **Create A record for apex domain**:
   - Click "Create record"
   - Record name: (leave blank for apex)
   - Record type: A
   - Toggle "Alias" to ON
   - Route traffic to: "Alias to CloudFront distribution"
   - Choose distribution: d3q4wvlwbm3s1h.cloudfront.net
   - Click "Create records"

4. **Create A record for www**:
   - Click "Create record"
   - Record name: `www`
   - Record type: A
   - Toggle "Alias" to ON
   - Route traffic to: "Alias to CloudFront distribution"
   - Choose distribution: d3q4wvlwbm3s1h.cloudfront.net
   - Click "Create records"

**Option B: Using Your Domain Registrar**

1. **Log into your domain registrar**

2. **Add CNAME record**:
   - Name: `www`
   - Type: CNAME
   - Value: `d3q4wvlwbm3s1h.cloudfront.net`
   - TTL: 300

3. **For apex domain** (projectkhaya.co.za):
   - Some registrars support ALIAS records
   - Point to: `d3q4wvlwbm3s1h.cloudfront.net`
   - If not supported, use Route 53 (Option A)

---

### Step 5: Wait for DNS Propagation (1-48 hours)

DNS changes can take time to propagate globally:
- **Locally**: 5-30 minutes
- **Globally**: 24-48 hours

**Check propagation**:
```bash
# Check if DNS is resolving
dig projectkhaya.co.za
nslookup projectkhaya.co.za

# Or use online tools
# https://www.whatsmydns.net/#A/projectkhaya.co.za
```

---

## 🧪 Testing

### Test CloudFront (Works Now!)
```bash
# Test HTTPS
curl -I https://d3q4wvlwbm3s1h.cloudfront.net

# Open in browser
https://d3q4wvlwbm3s1h.cloudfront.net
```

### Test Custom Domain (After DNS propagates)
```bash
# Test HTTPS
curl -I https://projectkhaya.co.za

# Open in browser
https://projectkhaya.co.za
https://www.projectkhaya.co.za
```

---

## 📊 Current Status

| Component | Status | URL |
|-----------|--------|-----|
| **S3 Bucket** | ✅ Live | http://projectkhaya-frontend-1762772155.s3-website-us-east-1.amazonaws.com |
| **CloudFront** | ✅ Live | https://d3q4wvlwbm3s1h.cloudfront.net |
| **SSL Certificate** | ⏳ Pending | Need to request in ACM |
| **Custom Domain** | ⏳ Pending | Need DNS configuration |

---

## 🎯 Quick Summary

**What you need to do in AWS Console:**

1. ✅ **ACM** → Request certificate for projectkhaya.co.za + www
2. ✅ **DNS** → Add validation CNAME records
3. ✅ **CloudFront** → Add custom domains + attach certificate
4. ✅ **Route 53** → Create A records pointing to CloudFront
5. ⏳ **Wait** → DNS propagation (1-48 hours)

---

## 💰 Cost

| Service | Cost |
|---------|------|
| **CloudFront** | $0.085/GB (first 10 TB) |
| **SSL Certificate** | FREE |
| **Route 53** | $0.50/month per hosted zone |
| **Data Transfer** | First 1 GB free/month |

**Estimated**: $1-5/month depending on traffic

**Free Tier**: 50 GB CloudFront data transfer free for 12 months

---

## 🔧 Troubleshooting

### Certificate Stuck in "Pending Validation"
- **Check**: DNS records are added correctly
- **Wait**: Can take up to 30 minutes
- **Verify**: Use `dig _abc123.projectkhaya.co.za CNAME`

### CloudFront Shows "CNAMEAlreadyExists" Error
- **Cause**: Domain is already used by another distribution
- **Fix**: Remove domain from old distribution first

### Site Not Loading on Custom Domain
- **Check**: DNS propagation with `dig projectkhaya.co.za`
- **Check**: CloudFront distribution is "Deployed"
- **Check**: Certificate is "Issued"
- **Wait**: DNS can take 24-48 hours globally

### HTTPS Not Working
- **Check**: Certificate is attached to CloudFront
- **Check**: Alternate domain names (CNAMEs) are added
- **Check**: Using correct CloudFront domain in DNS

---

## 📞 Need Help?

### AWS Support
- **Console**: https://console.aws.amazon.com/support
- **Documentation**: https://docs.aws.amazon.com/cloudfront/

### Check Status
- **CloudFront**: https://console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions/E4J3KAA9XDTHS
- **ACM**: https://console.aws.amazon.com/acm/home?region=us-east-1
- **Route 53**: https://console.aws.amazon.com/route53/

---

## ✅ Success Checklist

- [ ] SSL certificate requested in ACM
- [ ] DNS validation records added
- [ ] Certificate status: "Issued"
- [ ] Custom domains added to CloudFront
- [ ] Certificate attached to CloudFront
- [ ] CloudFront status: "Deployed"
- [ ] Route 53 A records created
- [ ] DNS propagated (check with dig/nslookup)
- [ ] https://projectkhaya.co.za loads
- [ ] https://www.projectkhaya.co.za loads
- [ ] SSL certificate valid (green padlock)

---

## 🎉 When Complete

Your site will be accessible at:
- ✅ **https://projectkhaya.co.za** (primary)
- ✅ **https://www.projectkhaya.co.za** (www)
- ✅ **Free SSL certificate** (auto-renews)
- ✅ **Global CDN** (fast everywhere)
- ✅ **HTTP → HTTPS redirect** (automatic)

---

## 📝 Important Information

### CloudFront Distribution
- **ID**: E4J3KAA9XDTHS
- **Domain**: d3q4wvlwbm3s1h.cloudfront.net
- **Status**: Deployed
- **Origin**: projectkhaya-frontend-1762772155.s3.us-east-1.amazonaws.com

### S3 Bucket
- **Name**: projectkhaya-frontend-1762772155
- **Region**: us-east-1

### To Update Website
```bash
# 1. Build
pnpm build

# 2. Upload to S3
aws s3 sync dist/public/ s3://projectkhaya-frontend-1762772155 --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E4J3KAA9XDTHS \
  --paths "/*"
```

---

**Timeline**: 30-60 minutes active work + 1-48 hours DNS propagation

**You can test CloudFront with HTTPS right now at**: https://d3q4wvlwbm3s1h.cloudfront.net

---

*Last updated: November 10, 2025*
