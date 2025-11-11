# Khaya - Production Verification Checklist

## Pre-Deployment Verification ✅

### Backend
- [x] TypeScript compiles without errors
- [x] All 7 routers implemented
- [x] SAM template validated
- [x] Environment variables configured
- [x] AWS credentials configured
- [x] SAM CLI installed

### Frontend
- [x] tRPC client configured
- [x] Build completes successfully
- [x] Environment variables ready
- [x] All components working locally

## Deployment Verification

### Backend Deployment

```bash
# 1. Deploy backend
cd backend
sam build --region af-south-1
sam deploy --guided --region af-south-1

# 2. Verify stack created
aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --region af-south-1 \
    --query 'Stacks[0].StackStatus'
# Expected: CREATE_COMPLETE or UPDATE_COMPLETE

# 3. Get outputs
aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --region af-south-1 \
    --query 'Stacks[0].Outputs'
```

**Checklist:**
- [ ] Stack status: CREATE_COMPLETE
- [ ] API URL obtained
- [ ] User Pool ID obtained
- [ ] Client ID obtained
- [ ] S3 Bucket created
- [ ] DynamoDB table created

### API Gateway Verification

```bash
# Test API endpoint
API_URL=$(aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --region af-south-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text)

# Test health endpoint (if you add one)
curl -X POST $API_URL \
    -H "Content-Type: application/json" \
    -d '{"id":1,"jsonrpc":"2.0","method":"health"}'
```

**Checklist:**
- [ ] API responds (not 404)
- [ ] CORS headers present
- [ ] Returns JSON response

### Lambda Function Verification

```bash
# Check Lambda function
aws lambda get-function \
    --function-name khaya-backend-KhayaFunction-XXXXX \
    --region af-south-1

# View recent logs
aws logs tail /aws/lambda/khaya-backend-KhayaFunction-XXXXX \
    --region af-south-1 \
    --follow
```

**Checklist:**
- [ ] Function exists
- [ ] Runtime: nodejs20.x
- [ ] Handler: dist/server.handler
- [ ] Environment variables set
- [ ] No errors in logs

### DynamoDB Verification

```bash
# Check table
aws dynamodb describe-table \
    --table-name khaya-prod \
    --region af-south-1

# List tables
aws dynamodb list-tables --region af-south-1
```

**Checklist:**
- [ ] Table exists: khaya-prod
- [ ] Status: ACTIVE
- [ ] GSI1 exists
- [ ] GSI2 exists
- [ ] Billing mode: PAY_PER_REQUEST

### Cognito Verification

```bash
# Get User Pool details
USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --region af-south-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)

aws cognito-idp describe-user-pool \
    --user-pool-id $USER_POOL_ID \
    --region af-south-1
```

**Checklist:**
- [ ] User Pool exists
- [ ] Status: ACTIVE
- [ ] Email verification enabled
- [ ] App client created

### S3 Bucket Verification

```bash
# Check bucket
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name khaya-backend \
    --region af-south-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`UploadsBucketName`].OutputValue' \
    --output text)

aws s3 ls s3://$BUCKET_NAME
```

**Checklist:**
- [ ] Bucket exists
- [ ] CORS configured
- [ ] Public read access enabled

## Frontend Deployment Verification

### Build Verification

```bash
# Build frontend
npm run build

# Check dist folder
ls -la dist/
```

**Checklist:**
- [ ] Build completes without errors
- [ ] dist/ folder created
- [ ] index.html exists
- [ ] assets/ folder exists
- [ ] File sizes reasonable (<500KB for main bundle)

### Deployment Verification

**For Amplify:**
```bash
# Check deployment status
aws amplify list-apps --region af-south-1
```

**For S3 + CloudFront:**
```bash
# Verify files uploaded
aws s3 ls s3://khaya-frontend/

# Check CloudFront distribution
aws cloudfront list-distributions
```

**Checklist:**
- [ ] Files deployed
- [ ] index.html accessible
- [ ] Assets loading
- [ ] HTTPS enabled
- [ ] Custom domain configured

## End-to-End Testing

### 1. User Registration

```bash
# Test via frontend or API
curl -X POST $API_URL \
    -H "Content-Type: application/json" \
    -d '{
      "id": 1,
      "jsonrpc": "2.0",
      "method": "auth.register",
      "params": {
        "email": "test@example.com",
        "password": "Test123!",
        "name": "Test User",
        "userType": "client"
      }
    }'
```

**Checklist:**
- [ ] Registration form loads
- [ ] Can submit registration
- [ ] Receives verification email/SMS
- [ ] User created in Cognito
- [ ] User record in DynamoDB

### 2. User Login

**Checklist:**
- [ ] Login form loads
- [ ] Can enter credentials
- [ ] Successful login redirects
- [ ] JWT token received
- [ ] Token stored correctly
- [ ] Protected routes accessible

### 3. Job Posting (Client)

**Checklist:**
- [ ] Job form loads
- [ ] Can fill all fields
- [ ] File upload works
- [ ] Job created successfully
- [ ] Job appears in listings
- [ ] Job stored in DynamoDB

### 4. Job Browsing (Worker)

**Checklist:**
- [ ] Job listings load
- [ ] Can filter by category
- [ ] Can filter by location
- [ ] Can search jobs
- [ ] Job details page loads
- [ ] Can view client profile

### 5. Bidding System

**Checklist:**
- [ ] Bid form loads
- [ ] Can submit bid
- [ ] Bid appears in client's view
- [ ] Client can accept bid
- [ ] Job status updates
- [ ] Notifications sent

### 6. Payment Processing

**Checklist:**
- [ ] Payment form loads
- [ ] Yoco integration works
- [ ] Can enter card details
- [ ] Payment processes
- [ ] Escrow created
- [ ] Payment status updates

### 7. Messaging

**Checklist:**
- [ ] Message list loads
- [ ] Can send message
- [ ] Message appears instantly
- [ ] Unread count updates
- [ ] Can mark as read
- [ ] Real-time updates work

### 8. File Uploads

**Checklist:**
- [ ] Upload button works
- [ ] File selection works
- [ ] Upload progress shown
- [ ] File uploaded to S3
- [ ] Signed URL generated
- [ ] File accessible

### 9. Subscriptions

**Checklist:**
- [ ] Plans page loads
- [ ] Can select plan
- [ ] Payment flow works
- [ ] Subscription activated
- [ ] Features unlocked
- [ ] Can cancel subscription

### 10. Referrals

**Checklist:**
- [ ] Referral code generated
- [ ] Can share code
- [ ] Code validation works
- [ ] Referral tracked
- [ ] Rewards credited
- [ ] Leaderboard updates

## Performance Testing

### Load Time

```bash
# Test page load time
curl -w "@curl-format.txt" -o /dev/null -s https://khaya.co.za

# Create curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_appconnect:  %{time_appconnect}\n
time_pretransfer:  %{time_pretransfer}\n
time_redirect:  %{time_redirect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

**Targets:**
- [ ] First byte < 200ms
- [ ] Page load < 2s
- [ ] API response < 500ms

### API Performance

```bash
# Test API response time
for i in {1..10}; do
  curl -w "%{time_total}\n" -o /dev/null -s $API_URL
done
```

**Targets:**
- [ ] Average response < 500ms
- [ ] P95 response < 1s
- [ ] No timeouts

## Security Testing

### SSL/TLS

```bash
# Check SSL certificate
openssl s_client -connect khaya.co.za:443 -servername khaya.co.za
```

**Checklist:**
- [ ] Valid SSL certificate
- [ ] Certificate not expired
- [ ] TLS 1.2+ enabled
- [ ] Strong cipher suites

### CORS

```bash
# Test CORS
curl -H "Origin: https://khaya.co.za" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     $API_URL
```

**Checklist:**
- [ ] CORS headers present
- [ ] Correct origin allowed
- [ ] Credentials allowed
- [ ] Proper methods allowed

### Authentication

**Checklist:**
- [ ] Protected routes require auth
- [ ] Invalid tokens rejected
- [ ] Expired tokens handled
- [ ] Role-based access works
- [ ] No sensitive data in tokens

## Monitoring Setup

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
    --evaluation-periods 1
```

**Checklist:**
- [ ] Lambda error alarm
- [ ] API Gateway 5xx alarm
- [ ] DynamoDB throttle alarm
- [ ] High latency alarm

### Logging

**Checklist:**
- [ ] Lambda logs enabled
- [ ] API Gateway logs enabled
- [ ] CloudFront logs enabled (if used)
- [ ] Log retention configured
- [ ] Can view logs in CloudWatch

## Cost Monitoring

```bash
# Check current costs
aws ce get-cost-and-usage \
    --time-period Start=2024-01-01,End=2024-01-31 \
    --granularity MONTHLY \
    --metrics BlendedCost
```

**Checklist:**
- [ ] Billing alerts configured
- [ ] Budget set
- [ ] Cost allocation tags added
- [ ] Regular cost reviews scheduled

## Backup & Recovery

**Checklist:**
- [ ] DynamoDB point-in-time recovery enabled
- [ ] S3 versioning enabled
- [ ] Code in version control
- [ ] Infrastructure as code saved
- [ ] Backup strategy documented

## Documentation

**Checklist:**
- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Troubleshooting guide created
- [ ] Architecture diagram created
- [ ] Runbook for common issues

## Final Sign-Off

### Technical Review
- [ ] All features working
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Monitoring configured

### Business Review
- [ ] Meets requirements
- [ ] User flows tested
- [ ] Payment processing verified
- [ ] Legal compliance checked
- [ ] Terms of service in place

### Operations Review
- [ ] Deployment automated
- [ ] Rollback plan tested
- [ ] On-call rotation set
- [ ] Incident response plan ready
- [ ] Support channels established

## Go Live! 🚀

Once all items are checked:

1. **Announce Launch**
   - Social media
   - Email list
   - Press release

2. **Monitor Closely**
   - Watch logs for 24 hours
   - Check error rates
   - Monitor user feedback

3. **Be Ready to Respond**
   - Have team on standby
   - Quick rollback if needed
   - Fast bug fixes

4. **Celebrate!** 🎉
   - You've built something amazing
   - Time to grow and scale

---

**Status:** Ready for Production ✅

**Deployed By:** _____________

**Date:** _____________

**Sign-off:** _____________
