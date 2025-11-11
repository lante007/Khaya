# Khaya Deployment Guide

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured (`aws configure`)
3. **AWS SAM CLI** installed
4. **Paystack Account** with API keys
5. **Domain** (khaya.co.za) configured

## Backend Deployment

### Step 1: Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: af-south-1
# Default output format: json
```

### Step 2: Set Environment Variables

```bash
export YOCO_SECRET_KEY="your_yoco_secret_key_here"
```

### Step 3: Deploy Backend

```bash
cd backend
./deploy.sh
```

This will:
- Build TypeScript to JavaScript
- Package Lambda function
- Create/update CloudFormation stack
- Deploy to AWS

### Step 4: Get Backend Outputs

After deployment, note these values:
- **API URL**: The tRPC endpoint URL
- **User Pool ID**: Cognito User Pool ID
- **Client ID**: Cognito Client ID
- **S3 Bucket**: Uploads bucket name

```bash
aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --query 'Stacks[0].Outputs' \
    --output table
```

## Frontend Deployment

### Step 1: Update Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://YOUR_API_ID.execute-api.af-south-1.amazonaws.com/prod/trpc
VITE_AWS_REGION=af-south-1
VITE_COGNITO_USER_POOL_ID=af-south-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 2: Build Frontend

```bash
npm run build
```

### Step 3: Deploy to AWS Amplify

#### Option A: GitHub Integration (Recommended)

1. Push code to GitHub
2. Go to AWS Amplify Console
3. Connect repository
4. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
5. Add environment variables in Amplify Console
6. Deploy

#### Option B: S3 + CloudFront

```bash
# Create S3 bucket
aws s3 mb s3://khaya-frontend --region af-south-1

# Enable static website hosting
aws s3 website s3://khaya-frontend \
    --index-document index.html \
    --error-document index.html

# Upload files
aws s3 sync dist/ s3://khaya-frontend --delete

# Create CloudFront distribution (manual in console)
# Point to S3 bucket
# Configure custom domain (khaya.co.za)
# Enable HTTPS with ACM certificate
```

## Post-Deployment

### 1. Configure Custom Domain

#### Backend API
- Go to API Gateway Console
- Select your API
- Custom Domain Names → Create
- Map to your API stage
- Update Route 53 DNS

#### Frontend
- In CloudFront or Amplify
- Add custom domain: khaya.co.za
- Request/import SSL certificate
- Update Route 53 DNS

### 2. Test the Deployment

```bash
# Test backend health
curl https://api.khaya.co.za/trpc/health

# Test frontend
curl https://khaya.co.za
```

### 3. Monitor

- **CloudWatch Logs**: Lambda function logs
- **CloudWatch Metrics**: API Gateway metrics
- **DynamoDB Metrics**: Table performance
- **Amplify Console**: Frontend build/deploy logs

## Environment-Specific Configurations

### Development
```env
VITE_API_URL=http://localhost:3000/trpc
```

### Staging
```env
VITE_API_URL=https://api-staging.khaya.co.za/trpc
```

### Production
```env
VITE_API_URL=https://api.khaya.co.za/trpc
```

## Rollback

If deployment fails:

```bash
# Backend
aws cloudformation delete-stack --stack-name khaya-backend

# Frontend (Amplify)
# Use Amplify Console to rollback to previous deployment

# Frontend (S3)
aws s3 sync dist-backup/ s3://khaya-frontend --delete
```

## Troubleshooting

### Backend Issues

1. **Lambda timeout**: Increase timeout in template.yaml
2. **DynamoDB throttling**: Enable auto-scaling
3. **CORS errors**: Check API Gateway CORS settings

### Frontend Issues

1. **Build fails**: Check Node version (20.x required)
2. **API connection fails**: Verify VITE_API_URL
3. **Auth issues**: Check Cognito configuration

## Cost Optimization

1. **DynamoDB**: Use on-demand billing initially
2. **Lambda**: Monitor cold starts, consider provisioned concurrency
3. **S3**: Enable lifecycle policies for old uploads
4. **CloudFront**: Use appropriate cache settings

## Security Checklist

- [ ] Enable AWS WAF on API Gateway
- [ ] Configure Cognito password policies
- [ ] Enable CloudTrail logging
- [ ] Set up AWS Config rules
- [ ] Enable S3 bucket encryption
- [ ] Configure VPC for Lambda (if needed)
- [ ] Set up AWS Secrets Manager for sensitive data
- [ ] Enable MFA for AWS root account

## Monitoring & Alerts

Set up CloudWatch Alarms for:
- Lambda errors > 5 in 5 minutes
- API Gateway 5xx errors > 10 in 5 minutes
- DynamoDB throttled requests > 0
- Lambda duration > 25 seconds

## Backup Strategy

1. **DynamoDB**: Enable Point-in-Time Recovery
2. **S3**: Enable versioning
3. **Code**: GitHub with protected branches

## Support

For issues:
1. Check CloudWatch Logs
2. Review deployment logs
3. Contact AWS Support if needed

## Quick Deploy (All-in-One)

```bash
# Set environment variables
export YOCO_SECRET_KEY="your_key"

# Deploy everything
./deploy-all.sh
```

This will:
1. Deploy backend to AWS
2. Get backend outputs
3. Configure frontend environment
4. Build frontend
5. Provide next steps for frontend deployment
