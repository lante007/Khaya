# Project Khaya - Serverless Deployment Guide

## 🚀 Full Serverless Architecture on AWS

This guide covers deploying Project Khaya using a **fully serverless, autonomous architecture** with:
- **S3 + CloudFront** for frontend (with custom domain and SSL)
- **Lambda + API Gateway** for backend APIs
- **DynamoDB** for data storage
- **Cognito** for authentication
- **EventBridge** for scheduled tasks
- **Route 53** for DNS management

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users/Clients                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Route 53 DNS                                  │
│              projectkhaya.co.za → CloudFront                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CloudFront CDN (SSL/TLS)                        │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  Static Assets   │         │   API Requests   │             │
│  │   (/, /jobs)     │         │    (/api/*)      │             │
│  └────────┬─────────┘         └────────┬─────────┘             │
└───────────┼──────────────────────────────┼───────────────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────┐      ┌──────────────────────────────────┐
│   S3 Frontend Bucket  │      │      API Gateway (REST)          │
│   - index.html        │      │   - /auth, /jobs, /bids, etc.    │
│   - assets/           │      └──────────┬───────────────────────┘
│   - PWA manifest      │                 │
└───────────────────────┘                 ▼
                              ┌──────────────────────────────────┐
                              │    Lambda Functions (Node.js)    │
                              │  - API handlers (index.mjs)      │
                              │  - DynamoDB operations           │
                              │  - S3 file operations            │
                              └──────────┬───────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
        ┌───────────────────┐ ┌──────────────────┐ ┌──────────────────┐
        │  DynamoDB Tables  │ │  S3 Storage      │ │  Cognito User    │
        │  - Users          │ │  - Uploads       │ │  Pool (Auth)     │
        │  - Jobs           │ │  - Photos        │ │  - WhatsApp      │
        │  - Bids           │ │  - Documents     │ │  - Phone/Email   │
        │  - Listings       │ └──────────────────┘ └──────────────────┘
        │  - Reviews        │
        │  - Credits        │
        │  - Referrals      │
        │  - Stories        │
        └───────────────────┘
                    ▲
                    │
        ┌───────────────────────┐
        │  EventBridge Rules    │
        │  - Daily tasks        │
        │  - Cleanup jobs       │
        │  - Notifications      │
        └───────────────────────┘
```

---

## 💰 Cost Breakdown (Serverless)

### Monthly Costs (Estimated for 1,000 active users)

| Service | Usage | Cost (ZAR) |
|---------|-------|------------|
| **Lambda** | 1M requests, 512MB, 1s avg | R50 |
| **API Gateway** | 1M requests | R30 |
| **DynamoDB** | 25GB storage, 1M reads/writes | R100 |
| **S3** | 10GB storage, 50GB transfer | R20 |
| **CloudFront** | 50GB data transfer | R50 |
| **Route 53** | 1 hosted zone | R10 |
| **Cognito** | 1,000 MAU | R0 (free tier) |
| **Certificate Manager** | SSL certificate | R0 (free) |
| **EventBridge** | 100 rules | R0 (free tier) |
| **CloudWatch** | Logs and metrics | R20 |
| **Total** | | **~R280/month** |

### Free Tier Benefits (First 12 Months)
- Lambda: 1M requests/month free
- DynamoDB: 25GB storage + 25 read/write units free
- S3: 5GB storage free
- CloudFront: 50GB data transfer free
- API Gateway: 1M requests free

**With Free Tier: ~R50-100/month**

### Scaling Costs (10,000 users)
- Estimated: R800-1,200/month
- Still pay-per-use, no fixed costs
- Auto-scales without manual intervention

---

## 🚀 Quick Deployment (One Command)

### Prerequisites (15 minutes)

1. **AWS Account**
   ```bash
   # Create at https://aws.amazon.com
   # Enable billing alerts
   ```

2. **AWS CLI**
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   aws --version
   ```

3. **Configure AWS**
   ```bash
   aws configure
   # Enter: Access Key ID, Secret Access Key
   # Region: af-south-1 (Johannesburg)
   # Output: json
   ```

4. **Verify Domain Access**
   - Ensure you have access to projectkhaya.co.za DNS settings
   - You'll need to update nameservers

### Deploy (30-45 minutes)

```bash
# Set your domain
export DOMAIN_NAME="projectkhaya.co.za"
export AWS_REGION="af-south-1"

# Run deployment
./deploy-serverless.sh
```

**What it does:**
1. ✅ Creates/verifies Route 53 hosted zone
2. ✅ Installs dependencies
3. ✅ Bootstraps AWS CDK
4. ✅ Builds frontend
5. ✅ Packages Lambda functions
6. ✅ Deploys CDK stack (DynamoDB, Lambda, API Gateway, CloudFront, SSL)
7. ✅ Uploads frontend to S3
8. ✅ Invalidates CloudFront cache

---

## 📋 Manual Deployment Steps

If you prefer step-by-step control:

### Step 1: Create Route 53 Hosted Zone (5 minutes)

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name projectkhaya.co.za \
  --caller-reference $(date +%s)

# Get nameservers
aws route53 list-hosted-zones-by-name \
  --dns-name projectkhaya.co.za \
  --query 'HostedZones[0].DelegationSet.NameServers'

# Update your domain registrar with these nameservers
```

### Step 2: Install Dependencies (5 minutes)

```bash
pnpm install
cd infra && pnpm install && cd ..
```

### Step 3: Bootstrap CDK (5 minutes)

```bash
cd infra
npx cdk bootstrap aws://ACCOUNT-ID/af-south-1
cd ..
```

### Step 4: Build Application (5 minutes)

```bash
# Build frontend
pnpm build

# Package Lambda functions
cd aws-lambda/handlers
npm install --production
cd ../..
```

### Step 5: Deploy Infrastructure (15-20 minutes)

```bash
cd infra

# Get hosted zone ID
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name projectkhaya.co.za \
  --query 'HostedZones[0].Id' \
  --output text | cut -d'/' -f3)

# Deploy with domain configuration
npx cdk deploy \
  --context domainName=projectkhaya.co.za \
  --context hostedZoneId=$HOSTED_ZONE_ID \
  --outputs-file ../cdk-outputs.json

cd ..
```

### Step 6: Upload Frontend (5 minutes)

```bash
# Get bucket name from outputs
FRONTEND_BUCKET=$(jq -r '.KhayaStack.FrontendBucket' cdk-outputs.json)
DISTRIBUTION_ID=$(jq -r '.KhayaStack.DistributionId' cdk-outputs.json)

# Upload to S3
aws s3 sync dist/public/ s3://$FRONTEND_BUCKET --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

---

## 🔒 SSL Certificate Setup

The CDK stack automatically:
1. Creates an ACM certificate for your domain
2. Validates it via DNS (Route 53)
3. Attaches it to CloudFront distribution
4. Enforces HTTPS-only access

**Timeline:**
- Certificate request: Immediate
- DNS validation: 5-10 minutes
- CloudFront propagation: 15-20 minutes
- **Total: ~30 minutes**

**Verification:**
```bash
# Check certificate status
aws acm list-certificates --region us-east-1

# Test HTTPS
curl -I https://projectkhaya.co.za
```

---

## 🌐 DNS Configuration

### Automatic (via CDK)
The CDK stack creates:
- A record for `projectkhaya.co.za` → CloudFront
- A record for `www.projectkhaya.co.za` → CloudFront

### Manual (if needed)
```bash
# Get CloudFront domain
CLOUDFRONT_DOMAIN=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='KhayaCDN'].DomainName" \
  --output text)

# Create A record (alias)
aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "projectkhaya.co.za",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "'$CLOUDFRONT_DOMAIN'",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

---

## 🧪 Testing Deployment

### Automated Tests
```bash
./test-deployment.sh projectkhaya.co.za
```

### Manual Tests

1. **Frontend**
   ```bash
   curl -I https://projectkhaya.co.za
   # Should return 200 OK with SSL
   ```

2. **API Gateway**
   ```bash
   API_URL=$(jq -r '.KhayaStack.APIUrl' cdk-outputs.json)
   curl $API_URL/health
   # Should return {"status":"ok"}
   ```

3. **CloudFront**
   ```bash
   curl -I https://projectkhaya.co.za/api/health
   # Should return 200 OK (via CloudFront)
   ```

4. **DynamoDB**
   ```bash
   aws dynamodb list-tables --region af-south-1
   # Should show KhayaStack-* tables
   ```

---

## 📊 Monitoring & Logs

### CloudWatch Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/KhayaStack-ApiLambda --follow

# View API Gateway logs
aws logs tail /aws/apigateway/KhayaAPI --follow
```

### CloudWatch Metrics
```bash
# Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=KhayaStack-ApiLambda \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# API Gateway requests
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=KhayaAPI \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### CloudWatch Alarms
```bash
# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name khaya-lambda-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=KhayaStack-ApiLambda
```

---

## 🔄 Continuous Deployment

### GitHub Actions (Automated)

The `.github/workflows/deploy-production.yml` file is already configured for serverless deployment.

**Setup:**
1. Add GitHub secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DOMAIN_NAME`
   - `HOSTED_ZONE_ID`

2. Push to main branch → Auto-deploy

### Manual Updates

**Frontend only:**
```bash
pnpm build
aws s3 sync dist/public/ s3://$FRONTEND_BUCKET --delete
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

**Backend only:**
```bash
cd infra
npx cdk deploy --require-approval never
cd ..
```

**Full stack:**
```bash
./deploy-serverless.sh
```

---

## 🚨 Troubleshooting

### SSL Certificate Pending
**Issue:** Certificate stuck in "Pending validation"
**Solution:**
```bash
# Check DNS records
aws route53 list-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID

# Verify nameservers are updated at registrar
# Wait 5-10 minutes for DNS propagation
```

### CloudFront 403 Errors
**Issue:** S3 bucket not accessible
**Solution:**
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket $FRONTEND_BUCKET

# Verify OAI permissions
aws cloudfront get-cloud-front-origin-access-identity --id $OAI_ID
```

### Lambda Timeout
**Issue:** Lambda functions timing out
**Solution:**
```bash
# Increase timeout in CDK stack (khaya-stack.ts)
timeout: cdk.Duration.seconds(30), // Increase to 60

# Redeploy
cd infra && npx cdk deploy && cd ..
```

### DynamoDB Throttling
**Issue:** Read/write capacity exceeded
**Solution:**
- Already using PAY_PER_REQUEST mode (no throttling)
- Check CloudWatch metrics for anomalies
- Consider adding caching layer (ElastiCache)

---

## 🔐 Security Best Practices

### IAM Roles
- Lambda functions use least-privilege IAM roles
- Separate roles for each function
- No hardcoded credentials

### API Gateway
- Throttling enabled (500 req/sec, 1000 burst)
- CORS configured for specific origins
- Request validation enabled

### DynamoDB
- Point-in-time recovery enabled
- Encryption at rest (default)
- Streams for audit logging

### S3
- Bucket policies restrict access
- CloudFront OAI for secure access
- Versioning enabled for critical buckets

### CloudFront
- HTTPS-only enforced
- TLS 1.2+ required
- Geo-restriction available (if needed)

---

## 📈 Scaling Strategy

### Current Capacity
- **Lambda**: Auto-scales to 1,000 concurrent executions
- **API Gateway**: 10,000 req/sec
- **DynamoDB**: Unlimited (PAY_PER_REQUEST)
- **CloudFront**: Global CDN, unlimited

### Optimization Tips

1. **Enable CloudFront caching**
   ```typescript
   cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
   ```

2. **Add DynamoDB indexes**
   ```typescript
   table.addGlobalSecondaryIndex({
     indexName: 'LocationIndex',
     partitionKey: { name: 'location', type: dynamodb.AttributeType.STRING },
   });
   ```

3. **Use Lambda layers**
   ```typescript
   const depsLayer = new lambda.LayerVersion(this, 'DepsLayer', {
     code: lambda.Code.fromAsset('layers'),
   });
   ```

4. **Implement caching**
   - CloudFront for static assets
   - API Gateway caching for read-heavy endpoints
   - DynamoDB DAX for hot data

---

## 💾 Backup & Recovery

### Automated Backups
- DynamoDB: Point-in-time recovery (enabled)
- S3: Versioning (enabled)
- Lambda: Code stored in S3

### Manual Backup
```bash
# Export DynamoDB table
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:af-south-1:ACCOUNT:table/KhayaStack-UsersTable \
  --s3-bucket khaya-backups \
  --export-format DYNAMODB_JSON

# Backup S3 bucket
aws s3 sync s3://$FRONTEND_BUCKET s3://khaya-backups/frontend-$(date +%Y%m%d)
```

### Disaster Recovery
```bash
# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name KhayaStack-UsersTable-Restored \
  --backup-arn arn:aws:dynamodb:af-south-1:ACCOUNT:table/KhayaStack-UsersTable/backup/BACKUP_ID

# Restore S3
aws s3 sync s3://khaya-backups/frontend-20250110 s3://$FRONTEND_BUCKET
```

---

## 🗑️ Cleanup / Destroy Stack

### Full Cleanup
```bash
cd infra
npx cdk destroy
cd ..
```

### Selective Cleanup
```bash
# Delete CloudFront distribution
aws cloudfront delete-distribution --id $DISTRIBUTION_ID --if-match $ETAG

# Delete S3 buckets
aws s3 rb s3://$FRONTEND_BUCKET --force

# Delete DynamoDB tables
aws dynamodb delete-table --table-name KhayaStack-UsersTable
```

---

## 📞 Support

- **AWS Documentation**: https://docs.aws.amazon.com
- **CDK Documentation**: https://docs.aws.amazon.com/cdk
- **GitHub Issues**: https://github.com/lante007/Khaya/issues

---

## ✅ Deployment Checklist

- [ ] AWS account created and configured
- [ ] Domain registered (projectkhaya.co.za)
- [ ] AWS CLI installed and configured
- [ ] Node.js 22+ installed
- [ ] pnpm installed
- [ ] Route 53 hosted zone created
- [ ] Nameservers updated at registrar
- [ ] CDK bootstrapped
- [ ] Frontend built
- [ ] Lambda functions packaged
- [ ] CDK stack deployed
- [ ] SSL certificate validated
- [ ] Frontend uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] DNS propagated (24-48 hours)
- [ ] HTTPS working
- [ ] API endpoints responding
- [ ] Monitoring configured
- [ ] Backups enabled

---

**Deployment Time**: 30-45 minutes active work
**DNS Propagation**: 24-48 hours
**Total Time to Live**: ~48 hours

**Cost**: R50-280/month (depending on usage)

**Scalability**: Unlimited (auto-scales)

**Maintenance**: Minimal (serverless)

---

*Generated: 2025-11-10*
*Version: 2.0 - Full Serverless*
*Status: Production Ready*
