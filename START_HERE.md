# 🚀 Project Khaya - Start Here

## Your Serverless Deployment in 3 Steps

### ✅ Prerequisites Complete
- [x] AWS Account created
- [x] Domain: projectkhaya.co.za
- [x] AWS credentials rotated (secure)

---

## Step 1: Configure AWS CLI (5 minutes)

```bash
./setup-aws.sh
```

**What it does:**
- Installs AWS CLI (if needed)
- Configures your credentials securely
- Tests the connection

**You'll be prompted for:**
- AWS Access Key ID: [your new key]
- AWS Secret Access Key: [your new secret]
- Default region: `af-south-1` (Johannesburg)
- Default output format: `json`

---

## Step 2: Deploy Serverless Stack (30-45 minutes)

```bash
./deploy-serverless.sh
```

**What it creates:**

### Infrastructure
- ✅ **Route 53** - DNS for projectkhaya.co.za
- ✅ **CloudFront** - Global CDN with SSL certificate
- ✅ **S3** - Frontend hosting + file storage
- ✅ **Lambda** - Serverless API functions
- ✅ **API Gateway** - RESTful API endpoints
- ✅ **DynamoDB** - NoSQL database (9 tables)
- ✅ **Cognito** - User authentication
- ✅ **EventBridge** - Scheduled tasks

### Features
- 🔒 **Automatic SSL** - HTTPS enforced
- 🌍 **Custom Domain** - projectkhaya.co.za
- 📱 **Mobile-First** - PWA ready
- 🚀 **Auto-Scaling** - Handles 1K-10K users
- 💰 **Cost-Effective** - R50-280/month

---

## Step 3: Update Domain Nameservers (5 minutes)

After deployment, you'll see:

```
⚠️  IMPORTANT: Update your domain registrar with these nameservers:
ns-1234.awsdns-12.org
ns-5678.awsdns-34.com
ns-9012.awsdns-56.net
ns-3456.awsdns-78.co.uk
```

**How to update:**
1. Log into your domain registrar (where you bought projectkhaya.co.za)
2. Find DNS/Nameserver settings
3. Replace existing nameservers with AWS nameservers
4. Save changes

**DNS Propagation:** 24-48 hours globally (but often works in 1-2 hours)

---

## 🎉 You're Live!

Once DNS propagates, your site will be accessible at:

**🌐 https://projectkhaya.co.za**

---

## 📊 What You Get

### Frontend (S3 + CloudFront)
- React 19 SPA
- Tailwind CSS 4
- PWA (offline-capable)
- Global CDN (fast everywhere)

### Backend (Lambda + API Gateway)
- Node.js 20 runtime
- RESTful APIs
- Auto-scaling
- Pay-per-request

### Database (DynamoDB)
- **Users** - Authentication & profiles
- **Jobs** - Job postings
- **Bids** - Worker proposals
- **Listings** - Material marketplace
- **Reviews** - Trust system
- **Credits** - Referral rewards
- **Referrals** - Viral growth
- **Stories** - Community content
- **Milestones** - Project tracking

### Authentication (Cognito)
- Phone-based (WhatsApp-ready)
- Email fallback
- Secure JWT tokens

---

## 💰 Cost Breakdown

### Monthly (1,000 active users)
| Service | Cost |
|---------|------|
| Lambda | R50 |
| DynamoDB | R100 |
| S3 + CloudFront | R70 |
| API Gateway | R30 |
| Other | R30 |
| **Total** | **R280** |

### With Free Tier (First 12 months)
**R50-100/month**

### Scaling (10,000 users)
**R800-1,200/month**

---

## 🔍 Monitoring

### View Logs
```bash
# Lambda logs
aws logs tail /aws/lambda/KhayaStack-ApiLambda --follow

# API Gateway logs
aws logs tail /aws/apigateway/KhayaAPI --follow
```

### Check Status
```bash
# CloudFront distribution
aws cloudfront list-distributions

# DynamoDB tables
aws dynamodb list-tables

# Lambda functions
aws lambda list-functions
```

### Deployment Info
All deployment details saved in: `DEPLOYMENT_INFO.txt`

---

## 🔄 Updates

### Frontend Only
```bash
pnpm build
aws s3 sync dist/public/ s3://[BUCKET] --delete
aws cloudfront create-invalidation --distribution-id [ID] --paths "/*"
```

### Full Stack
```bash
./deploy-serverless.sh
```

---

## 🧪 Testing

### Automated Tests
```bash
./test-deployment.sh projectkhaya.co.za
```

### Manual Tests
```bash
# Test HTTPS
curl -I https://projectkhaya.co.za

# Test API
curl https://projectkhaya.co.za/api/health

# Test specific endpoint
curl https://projectkhaya.co.za/api/jobs
```

---

## 🚨 Troubleshooting

### SSL Certificate Pending
**Wait 20-30 minutes for DNS validation**
```bash
# Check certificate status
aws acm list-certificates --region us-east-1
```

### DNS Not Resolving
**Wait 1-2 hours for propagation**
```bash
# Check DNS
dig projectkhaya.co.za
nslookup projectkhaya.co.za
```

### CloudFront 403 Errors
**Check S3 bucket permissions**
```bash
# Verify bucket policy
aws s3api get-bucket-policy --bucket [BUCKET]
```

### Lambda Errors
**Check CloudWatch logs**
```bash
aws logs tail /aws/lambda/KhayaStack-ApiLambda --follow
```

---

## 📚 Documentation

- **SERVERLESS_DEPLOYMENT.md** - Detailed deployment guide
- **DEPLOYMENT_GUIDE.md** - Traditional EC2 deployment
- **24_HOUR_DEPLOYMENT_PLAN.md** - Hour-by-hour plan
- **QUICK_START.md** - Quick reference

---

## 🔐 Security Checklist

- [x] AWS credentials rotated
- [x] Credentials stored in `~/.aws/credentials` only
- [ ] MFA enabled on AWS account
- [ ] Billing alerts configured
- [ ] CloudWatch alarms set up
- [ ] Backup strategy implemented

### Enable MFA (Recommended)
```bash
# In AWS Console:
# IAM → Users → Your User → Security Credentials → Assign MFA device
```

### Set Billing Alerts
```bash
# In AWS Console:
# Billing → Budgets → Create budget
# Set alert for R500/month
```

---

## 🎯 Next Steps After Deployment

### 1. Configure WhatsApp Integration
```bash
# Sign up for Twilio
# Get WhatsApp Business API access
# Update Lambda environment variables
```

### 2. Set Up Paystack Payments
```bash
# Create Paystack account
# Get API keys
# Update Lambda environment variables
```

### 3. Add Custom Features
- AI matching (TensorFlow.js)
- Material bundling
- Price alerts
- Trust graph
- Referral system

### 4. Launch Marketing
- Social media campaigns
- Local workshops (izimbizo)
- Referral incentives
- Community stories

---

## 📞 Support

### AWS Issues
- Console: https://console.aws.amazon.com
- Support: https://console.aws.amazon.com/support
- Documentation: https://docs.aws.amazon.com

### Project Issues
- GitHub: https://github.com/lante007/Khaya/issues
- Documentation: See files in this directory

---

## ✅ Deployment Checklist

- [ ] AWS CLI configured (`./setup-aws.sh`)
- [ ] Serverless stack deployed (`./deploy-serverless.sh`)
- [ ] Nameservers updated at registrar
- [ ] DNS propagated (wait 1-48 hours)
- [ ] HTTPS working (https://projectkhaya.co.za)
- [ ] API responding (https://projectkhaya.co.za/api/health)
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] MFA enabled
- [ ] Billing alerts set

---

## 🎊 Success Criteria

Your deployment is successful when:

- ✅ Site loads at https://projectkhaya.co.za
- ✅ SSL certificate valid (green padlock)
- ✅ All pages accessible
- ✅ API endpoints responding
- ✅ Mobile responsive
- ✅ Performance < 3s load time
- ✅ No console errors

---

## 🚀 Ready to Deploy?

```bash
# Step 1: Configure AWS
./setup-aws.sh

# Step 2: Deploy
./deploy-serverless.sh

# Step 3: Update nameservers (follow prompts)

# Step 4: Wait for DNS propagation

# Step 5: Test
./test-deployment.sh projectkhaya.co.za
```

---

**Estimated Time:**
- Active work: 45 minutes
- DNS propagation: 1-48 hours
- **Total: ~2-48 hours**

**Cost:**
- Setup: R0
- Monthly: R50-280
- Scaling: Auto (pay-per-use)

**Maintenance:**
- Minimal (serverless)
- Auto-scaling
- Self-healing

---

**Let's build something amazing! 🏠✨**

*Project Khaya - Umuntu ngumuntu ngabantu (A person is a person through other people)*
