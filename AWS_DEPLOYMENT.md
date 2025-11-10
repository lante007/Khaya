# ProjectKhaya.co.za - AWS Serverless Deployment Guide

## Architecture Overview

This application uses a fully serverless AWS architecture for autonomous scaling and cost efficiency:

- **Frontend**: React SPA hosted on S3 + CloudFront CDN
- **Backend**: Lambda functions behind API Gateway
- **Database**: DynamoDB (NoSQL) with pay-per-request billing
- **Authentication**: AWS Cognito User Pools
- **File Storage**: S3 buckets
- **Scheduled Tasks**: EventBridge + Lambda
- **Region**: af-south-1 (Johannesburg) for low latency to KZN

## User Types

The platform supports 4 distinct user roles:
1. **Buyers** - Main clients posting jobs and purchasing materials
2. **Skilled Workers** - Tradespeople bidding on jobs
3. **Product Sellers** - Material suppliers listing products
4. **Administrators** - Platform managers

## Prerequisites

### 1. AWS Account Setup
```bash
# Create AWS account at https://aws.amazon.com
# Enable MFA for root account
# Create IAM user with AdministratorAccess
# Generate access keys
```

### 2. Install Required Tools
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter: Access Key ID, Secret Access Key, Region: af-south-1, Output: json

# AWS CDK
npm install -g aws-cdk

# Verify installations
aws --version
cdk --version
node --version  # Should be 20+
```

### 3. Domain Setup (Optional but Recommended)
- Register **projectkhaya.co.za** via AWS Route 53 or external registrar
- If using external registrar, create hosted zone in Route 53

## Deployment Steps

### Step 1: Bootstrap AWS CDK

```bash
cd infra
npm install

# Bootstrap CDK (one-time per account/region)
cdk bootstrap aws://ACCOUNT-ID/af-south-1
```

### Step 2: Build Frontend

```bash
cd ..
npm install
npm run build

# The build output will be in dist/public/
```

### Step 3: Prepare Lambda Handlers

The Lambda handlers need to be created to replace the current tRPC backend. Key handlers needed:

- `auth.ts` - Authentication (Cognito integration)
- `users.ts` - User management
- `profiles.ts` - Profile CRUD
- `jobs.ts` - Job posting and management
- `bids.ts` - Bidding system
- `listings.ts` - Material listings
- `reviews.ts` - Review system
- `referrals.ts` - Referral program
- `stories.ts` - Community stories
- `daily.ts` - Scheduled maintenance tasks

### Step 4: Deploy Infrastructure

```bash
cd infra

# Review what will be created
cdk diff

# Deploy the stack
cdk deploy

# Save the outputs (API URL, CloudFront URL, etc.)
```

### Step 5: Upload Frontend to S3

```bash
# Get bucket name from CDK output
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name KhayaStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucket`].OutputValue' \
  --output text)

# Upload built frontend
aws s3 sync ../dist/public/ s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name KhayaStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Step 6: Configure Custom Domain

```bash
# Get CloudFront distribution domain
CDN_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name KhayaStack \
  --query 'Stacks[0].Outputs[?OutputKey==`CDNUrl`].OutputValue' \
  --output text)

# In Route 53, create:
# - A record for projectkhaya.co.za pointing to CloudFront
# - CNAME for www.projectkhaya.co.za pointing to CloudFront
```

## DynamoDB Schema Design

### Users Table
```
Partition Key: id (String - UUID)
Attributes: email, phone, name, role, createdAt, lastSignedIn
GSI: EmailIndex (email), PhoneIndex (phone)
```

### Profiles Table
```
Partition Key: userId (String)
Attributes: bio, trade, location, photoUrl, certifications, trustScore, verified, completedJobs
GSI: LocationIndex (location + trustScore)
```

### Jobs Table
```
Partition Key: id (String)
Sort Key: createdAt (String - ISO timestamp)
Attributes: title, description, budget, location, status, buyerId
GSI: StatusIndex (status + createdAt)
```

### Bids Table
```
Partition Key: id (String)
Sort Key: jobId (String)
Attributes: workerId, amount, message, status, createdAt
GSI: JobIndex (jobId + amount)
```

### Listings Table
```
Partition Key: id (String)
Attributes: title, description, price, category, sellerId, stock, location
GSI: CategoryIndex (category + createdAt)
```

### Reviews Table
```
Partition Key: id (String)
Sort Key: reviewedId (String)
Attributes: reviewerId, rating, comment, jobId, createdAt
```

### Credits Table
```
Partition Key: id (String)
Sort Key: userId (String)
Attributes: amount, type, description, relatedReferralId, createdAt
```

### Referrals Table
```
Partition Key: id (String)
Attributes: referrerId, referredId, referralCode, status, rewardAmount, createdAt
GSI: CodeIndex (referralCode)
```

### Stories Table
```
Partition Key: id (String)
Sort Key: createdAt (String)
Attributes: userId, title, content, type, featured, approved, likes, mediaUrl
```

## Environment Variables

The Lambda functions automatically receive these environment variables from CDK:

- `USERS_TABLE` - DynamoDB users table name
- `PROFILES_TABLE` - DynamoDB profiles table name
- `JOBS_TABLE` - DynamoDB jobs table name
- `BIDS_TABLE` - DynamoDB bids table name
- `LISTINGS_TABLE` - DynamoDB listings table name
- `REVIEWS_TABLE` - DynamoDB reviews table name
- `CREDITS_TABLE` - DynamoDB credits table name
- `REFERRALS_TABLE` - DynamoDB referrals table name
- `STORIES_TABLE` - DynamoDB stories table name
- `STORAGE_BUCKET` - S3 storage bucket name
- `USER_POOL_ID` - Cognito User Pool ID
- `USER_POOL_CLIENT_ID` - Cognito User Pool Client ID

## Cost Estimates

### Free Tier (First 12 months)
- Lambda: 1M requests/month free
- DynamoDB: 25GB storage + 25 read/write units free
- S3: 5GB storage free
- CloudFront: 50GB data transfer free
- API Gateway: 1M requests free

### After Free Tier (Estimated for 1000 active users)
- Lambda: ~R50/month
- DynamoDB: ~R100/month
- S3: ~R20/month
- CloudFront: ~R50/month
- API Gateway: ~R30/month
- **Total: ~R250/month**

### At Scale (10,000 users)
- Estimated: R800-1200/month (still pay-per-use, no fixed costs)

## Monitoring & Maintenance

### CloudWatch Dashboards
```bash
# View Lambda logs
aws logs tail /aws/lambda/KhayaStack-ApiLambda --follow

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=KhayaStack-ApiLambda \
  --start-time 2025-11-10T00:00:00Z \
  --end-time 2025-11-10T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### Alerts Setup
The CDK stack can be extended to add CloudWatch Alarms for:
- Lambda errors > 1%
- API Gateway 5xx errors
- DynamoDB throttling
- High costs

## CI/CD Pipeline (Future Enhancement)

Can be automated with AWS CodePipeline:
1. GitHub push triggers pipeline
2. CodeBuild builds frontend and Lambda functions
3. CDK deploys infrastructure changes
4. Frontend uploaded to S3
5. CloudFront cache invalidated

## Security Best Practices

1. **IAM Roles**: Lambda functions use least-privilege IAM roles
2. **Cognito**: Phone-based authentication for rural users
3. **API Gateway**: Throttling enabled (500 req/sec, 1000 burst)
4. **S3**: Bucket policies restrict public access to frontend only
5. **DynamoDB**: Point-in-time recovery enabled
6. **CloudFront**: HTTPS-only enforced

## Troubleshooting

### Lambda Cold Starts
- Provisioned concurrency can be added for critical functions
- Current timeout: 30 seconds

### DynamoDB Throttling
- Using PAY_PER_REQUEST mode (no throttling)
- Can switch to PROVISIONED if predictable traffic

### CloudFront Cache Issues
```bash
# Invalidate entire cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## Rollback Procedure

```bash
# List stack history
cdk deploy --no-execute

# Rollback to previous version
aws cloudformation cancel-update-stack --stack-name KhayaStack

# Or delete and redeploy
cdk destroy
cdk deploy
```

## Next Steps

1. **Complete Lambda Handlers**: Convert tRPC routers to Lambda handlers
2. **Update Frontend**: Point API calls to API Gateway URL
3. **Test Authentication**: Implement Cognito sign-up/sign-in flow
4. **Add WhatsApp Integration**: Use Twilio/Meta API for notifications
5. **Payment Integration**: Add Paystack for escrow payments
6. **Custom Domain SSL**: Request ACM certificate for projectkhaya.co.za

## Support

For AWS-specific issues:
- AWS Support: https://console.aws.amazon.com/support
- AWS Forums: https://forums.aws.amazon.com
- CDK Documentation: https://docs.aws.amazon.com/cdk

## License

This deployment configuration is part of Project Khaya.
