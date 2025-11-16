# Production Monitoring Guide
**Last Updated:** November 12, 2025

---

## 🎯 Quick Health Check

### One-Line Status Check
```bash
curl -s -o /dev/null -w "API: %{http_code}\n" https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc/auth.me && \
curl -s -o /dev/null -w "Frontend: %{http_code}\n" https://d3q4wvlwbm3s1h.cloudfront.net
```

**Expected Output:**
```
API: 401 (authentication required - this is correct!)
Frontend: 200 (OK)
```

---

## 📊 System Components

### 1. Backend API
**Endpoint:** `https://p5gc1z4as1.execute-api.us-east-1.amazonaws.com/prod/trpc`  
**Lambda:** `project-khaya-api-KhayaFunction-I6k37ZDJBMEw`  
**Status:** ✅ Operational

#### Monitor Lambda
```bash
# View recent logs
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --follow

# View logs from last hour
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --since 1h

# View logs from last 24 hours
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --since 24h

# Filter for errors
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --since 1h --filter-pattern "ERROR"
```

#### Check Lambda Metrics
```bash
# Get function configuration
aws lambda get-function-configuration \
  --function-name project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --region us-east-1

# Get invocation metrics (last hour)
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Get error metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

### 2. Frontend (CloudFront)
**URL:** `https://d3q4wvlwbm3s1h.cloudfront.net`  
**Distribution ID:** `E4J3KAA9XDTHS`  
**Status:** ✅ Deployed

#### Monitor CloudFront
```bash
# Get distribution status
aws cloudfront get-distribution \
  --id E4J3KAA9XDTHS \
  --query 'Distribution.{Status:Status,Enabled:DistributionConfig.Enabled,DomainName:DomainName}' \
  --output table

# Get distribution config
aws cloudfront get-distribution-config --id E4J3KAA9XDTHS

# Check invalidations
aws cloudfront list-invalidations --distribution-id E4J3KAA9XDTHS
```

#### CloudFront Metrics
```bash
# Get request count
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E4J3KAA9XDTHS \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Get error rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name 4xxErrorRate \
  --dimensions Name=DistributionId,Value=E4J3KAA9XDTHS \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-1
```

### 3. API Gateway
**API ID:** `p5gc1z4as1`  
**Stage:** `prod`  
**Status:** ✅ Active

#### Monitor API Gateway
```bash
# Get API details
aws apigateway get-rest-api --rest-api-id p5gc1z4as1 --region us-east-1

# Get stage details
aws apigateway get-stage --rest-api-id p5gc1z4as1 --stage-name prod --region us-east-1

# Get request count
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=project-khaya-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1

# Get latency
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Latency \
  --dimensions Name=ApiName,Value=project-khaya-api \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-1
```

### 4. DynamoDB
**Table:** `khaya-prod`  
**Status:** ✅ Active

#### Monitor DynamoDB
```bash
# Get table details
aws dynamodb describe-table --table-name khaya-prod --region us-east-1

# Get item count
aws dynamodb describe-table \
  --table-name khaya-prod \
  --query 'Table.ItemCount' \
  --region us-east-1

# Scan table (use carefully in production!)
aws dynamodb scan \
  --table-name khaya-prod \
  --max-items 10 \
  --region us-east-1

# Get consumed capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=khaya-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

### 5. S3 Buckets
**Frontend:** `projectkhaya-frontend-1762772155`  
**Uploads:** `khaya-uploads-615608124862`  
**Status:** ✅ Active

#### Monitor S3
```bash
# List frontend bucket contents
aws s3 ls s3://projectkhaya-frontend-1762772155/ --region us-east-1

# List uploads bucket contents
aws s3 ls s3://khaya-uploads-615608124862/ --region us-east-1

# Get bucket size
aws s3 ls s3://projectkhaya-frontend-1762772155/ --recursive --summarize --region us-east-1

# Get bucket metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name NumberOfObjects \
  --dimensions Name=BucketName,Value=projectkhaya-frontend-1762772155 Name=StorageType,Value=AllStorageTypes \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Average \
  --region us-east-1
```

---

## 🚨 Alert Thresholds

### Critical Alerts (Immediate Action Required)
- **Lambda Errors:** > 5% error rate
- **API Gateway 5xx:** > 1% error rate
- **CloudFront 5xx:** > 1% error rate
- **DynamoDB Throttling:** Any throttled requests
- **Lambda Duration:** > 25 seconds (approaching timeout)

### Warning Alerts (Monitor Closely)
- **Lambda Duration:** > 15 seconds
- **API Gateway 4xx:** > 10% error rate
- **CloudFront 4xx:** > 5% error rate
- **Lambda Memory:** > 400 MB (80% of allocated)
- **DynamoDB Capacity:** > 80% consumed

---

## 📈 Key Metrics to Track

### Performance Metrics
1. **API Response Time:** Target < 200ms
2. **Frontend Load Time:** Target < 2 seconds
3. **Lambda Cold Start:** Target < 2 seconds
4. **Lambda Warm Start:** Target < 100ms
5. **CloudFront Cache Hit Ratio:** Target > 80%

### Reliability Metrics
1. **Uptime:** Target 99.9%
2. **Error Rate:** Target < 0.1%
3. **Success Rate:** Target > 99.9%

### Usage Metrics
1. **API Requests per Hour**
2. **Unique Users per Day**
3. **Page Views per Day**
4. **File Uploads per Day**
5. **Email Sends per Day**

---

## 🔍 Common Issues & Solutions

### Issue 1: High Lambda Duration
**Symptoms:** Slow API responses, timeouts  
**Check:**
```bash
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --since 1h --filter-pattern "REPORT"
```
**Solutions:**
- Optimize database queries
- Implement caching
- Increase Lambda memory
- Review cold start optimization

### Issue 2: High Error Rate
**Symptoms:** 5xx errors, failed requests  
**Check:**
```bash
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --since 1h --filter-pattern "ERROR"
```
**Solutions:**
- Review error logs
- Check environment variables
- Verify database connectivity
- Check third-party service status

### Issue 3: CloudFront Cache Issues
**Symptoms:** Stale content, slow loads  
**Check:**
```bash
aws cloudfront list-invalidations --distribution-id E4J3KAA9XDTHS
```
**Solutions:**
```bash
# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id E4J3KAA9XDTHS \
  --paths "/*"
```

### Issue 4: DynamoDB Throttling
**Symptoms:** Failed database operations  
**Check:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=khaya-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```
**Solutions:**
- Enable auto-scaling
- Increase provisioned capacity
- Implement exponential backoff
- Review query patterns

### Issue 5: Email Delivery Failures
**Symptoms:** Users not receiving OTP emails  
**Check:**
```bash
aws logs tail /aws/lambda/project-khaya-api-KhayaFunction-I6k37ZDJBMEw --since 1h --filter-pattern "EMAIL"
```
**Solutions:**
- Verify MailerSend API key
- Check domain verification
- Review email logs in MailerSend dashboard
- Verify sender email is verified

---

## 🛠️ Maintenance Tasks

### Daily
- [ ] Check error logs
- [ ] Review API response times
- [ ] Monitor user registrations
- [ ] Check email delivery rate

### Weekly
- [ ] Review CloudWatch metrics
- [ ] Analyze usage patterns
- [ ] Check storage usage
- [ ] Review security logs
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Review AWS costs
- [ ] Analyze performance trends
- [ ] Plan capacity adjustments
- [ ] Review and rotate secrets
- [ ] Update documentation

---

## 📊 Monitoring Dashboard

### Create CloudWatch Dashboard
```bash
# Create a custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name KhayaProduction \
  --dashboard-body file://dashboard-config.json \
  --region us-east-1
```

### Dashboard Widgets to Include
1. **Lambda Invocations** (line chart)
2. **Lambda Errors** (line chart)
3. **Lambda Duration** (line chart)
4. **API Gateway Requests** (line chart)
5. **API Gateway Latency** (line chart)
6. **CloudFront Requests** (line chart)
7. **CloudFront Error Rate** (line chart)
8. **DynamoDB Consumed Capacity** (line chart)

---

## 🔔 Setting Up Alarms

### Lambda Error Alarm
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name khaya-lambda-errors \
  --alarm-description "Alert when Lambda error rate exceeds threshold" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --region us-east-1
```

### API Gateway 5xx Alarm
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name khaya-api-5xx-errors \
  --alarm-description "Alert when API Gateway 5xx rate exceeds threshold" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ApiName,Value=project-khaya-api \
  --region us-east-1
```

### Lambda Duration Alarm
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name khaya-lambda-duration \
  --alarm-description "Alert when Lambda duration approaches timeout" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 25000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=project-khaya-api-KhayaFunction-I6k37ZDJBMEw \
  --region us-east-1
```

---

## 📱 Monitoring Tools

### AWS Console
- **CloudWatch:** https://console.aws.amazon.com/cloudwatch/
- **Lambda:** https://console.aws.amazon.com/lambda/
- **API Gateway:** https://console.aws.amazon.com/apigateway/
- **DynamoDB:** https://console.aws.amazon.com/dynamodb/
- **S3:** https://console.aws.amazon.com/s3/
- **CloudFront:** https://console.aws.amazon.com/cloudfront/

### Third-Party Tools (Recommended)
- **Datadog** - Comprehensive monitoring
- **New Relic** - Application performance monitoring
- **Sentry** - Error tracking
- **LogRocket** - Frontend monitoring
- **Pingdom** - Uptime monitoring

---

## 🎯 Success Criteria

### Launch Day (First 24 Hours)
- ✅ Zero critical errors
- ✅ API response time < 500ms
- ✅ Frontend load time < 3 seconds
- ✅ Uptime > 99%

### First Week
- ✅ API response time < 200ms
- ✅ Frontend load time < 2 seconds
- ✅ Uptime > 99.5%
- ✅ Error rate < 1%

### First Month
- ✅ API response time < 200ms
- ✅ Frontend load time < 2 seconds
- ✅ Uptime > 99.9%
- ✅ Error rate < 0.1%

---

## 📞 Escalation

### Level 1: Monitoring (Automated)
- CloudWatch alarms
- Automated notifications
- Log aggregation

### Level 2: Investigation (Developer)
- Review logs
- Check metrics
- Identify root cause

### Level 3: Resolution (DevOps)
- Deploy fixes
- Scale resources
- Update configuration

### Level 4: Incident (Team Lead)
- Coordinate response
- Communicate with stakeholders
- Post-mortem analysis

---

## 📝 Logging Best Practices

### Log Levels
- **ERROR:** Critical issues requiring immediate attention
- **WARN:** Potential issues to monitor
- **INFO:** Important business events
- **DEBUG:** Detailed diagnostic information

### What to Log
- ✅ Authentication attempts
- ✅ API requests/responses
- ✅ Database operations
- ✅ Email sends
- ✅ File uploads
- ✅ Errors and exceptions
- ✅ Performance metrics

### What NOT to Log
- ❌ Passwords
- ❌ API keys
- ❌ JWT tokens
- ❌ Personal information (PII)
- ❌ Credit card numbers

---

## 🔄 Continuous Improvement

### Weekly Review
1. Analyze error patterns
2. Identify performance bottlenecks
3. Review user feedback
4. Plan optimizations

### Monthly Review
1. Review all metrics
2. Analyze trends
3. Plan capacity changes
4. Update monitoring strategy

---

**Last Updated:** November 12, 2025  
**Next Review:** November 19, 2025  
**Status:** ✅ All systems operational
