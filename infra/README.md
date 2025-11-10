# Khaya AWS Infrastructure

This directory contains the AWS CDK infrastructure code for deploying ProjectKhaya.co.za as a serverless application.

## Quick Start

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/af-south-1

# Deploy
cdk deploy
```

## What Gets Created

- **9 DynamoDB Tables**: users, profiles, jobs, bids, listings, reviews, credits, referrals, stories
- **Cognito User Pool**: Phone-based authentication
- **Lambda Functions**: API handlers and scheduled tasks
- **API Gateway**: REST API endpoint
- **S3 Buckets**: Frontend hosting + file storage
- **CloudFront Distribution**: Global CDN
- **EventBridge Rules**: Daily maintenance tasks

## Estimated Costs

- **Free Tier**: R0/month for first 12 months
- **Production**: R250-500/month for 1000 users
- **Scale**: R800-1200/month for 10,000 users

## Commands

- `npm run build` - Compile TypeScript
- `cdk diff` - Compare deployed stack with current state
- `cdk deploy` - Deploy stack to AWS
- `cdk destroy` - Remove all resources
- `cdk synth` - Emit CloudFormation template

## Architecture

See `../AWS_DEPLOYMENT.md` for full deployment guide.
