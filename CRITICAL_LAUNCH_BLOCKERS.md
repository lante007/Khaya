# 🚨 CRITICAL LAUNCH BLOCKERS
**Must fix before public launch**

---

## 1. Admin Dashboard Authentication ⚠️ BLOCKING

**Problem:** Cannot login to admin dashboard  
**Impact:** Cannot moderate users, approve profiles, handle disputes  
**Status:** Backend works, frontend broken  

**Current Error:**
```
{
  "error": {
    "json": {
      "message": "Required",
      "code": -32600,
      "data": {
        "code": "BAD_REQUEST",
        "httpStatus": 400,
        "path": "admin.login"
      }
    }
  }
}
```

**Root Cause:** `AdminLogin.tsx` not using tRPC properly

**Fix:**
```typescript
// File: client/src/pages/AdminLogin.tsx
// Replace raw fetch with tRPC mutation

const login = trpc.admin.login.useMutation({
  onSuccess: (data) => {
    localStorage.setItem('adminToken', data.token);
    setLocation('/admin/dashboard');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});

const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  login.mutate({ email, password });
};
```

**Test Credentials:**
- Email: `admin@projectkhaya.co.za`
- Password: `Admin@2024Khaya`

**Estimated Time:** 1 hour

---

## 2. Paystack Live Payment Testing ⚠️ BLOCKING

**Problem:** Using test keys, cannot process real money  
**Impact:** Cannot launch with real payments  
**Status:** Backend complete, needs live credentials  

**Current:** Test key in `backend/src/lib/paystack.ts`

**Required Steps:**
1. Create Paystack business account at https://paystack.com
2. Complete KYC verification
3. Get live secret key from dashboard
4. Update `backend/samconfig.toml`:
   ```toml
   [prod.deploy.parameters]
   parameter_overrides = [
     "PaystackSecretKey=sk_live_YOUR_LIVE_KEY_HERE"
   ]
   ```
5. Redeploy backend: `cd backend && sam build && sam deploy`
6. Test with R10 transaction
7. Verify escrow hold/release
8. Test webhook callbacks

**Estimated Time:** 2-3 hours (waiting for Paystack approval may take 1-2 days)

---

## 3. Real User Testing ⚠️ BLOCKING

**Problem:** No real users have tested the platform  
**Impact:** Unknown bugs, UX issues, edge cases  
**Status:** Not started  

**Required Test Scenarios:**

### Buyer Journey (2 testers)
1. Register via SMS (+27 number)
2. Verify OTP code
3. Post job with photos
4. Review 3+ bids
5. Accept one bid
6. Make R100 test payment
7. Chat with worker
8. Mark job complete
9. Leave 5-star review

### Worker Journey (2 testers)
1. Register via SMS
2. Complete 4-step onboarding
3. Upload portfolio (3+ photos)
4. Browse open jobs
5. Submit bid with itemized quote
6. Chat with buyer
7. Receive payment notification
8. Upload completion proof
9. Receive payout

### Seller Journey (1 tester)
1. Register via SMS
2. List 5+ materials with photos
3. Set prices and delivery zones
4. Receive order notification
5. Update inventory

### Admin Journey (You)
1. Login to admin dashboard
2. Review pending users
3. Approve/reject profiles
4. Moderate flagged job
5. View payment audit trail
6. Generate weekly report

**Recruit:** 5 KZN beta users (friends, family, local community)

**Estimated Time:** 1 week (including recruitment)

---

## 4. Legal Documentation ⚠️ HIGH PRIORITY

**Problem:** No Terms of Service or Privacy Policy  
**Impact:** Legal liability, POPIA non-compliance, user trust issues  
**Status:** Not created  

**Required Documents:**

### Terms of Service
- Platform rules and user conduct
- Service provider responsibilities
- Payment terms and escrow rules
- Dispute resolution process
- Liability limitations
- Account termination conditions

### Privacy Policy (POPIA Compliant)
- Data collection (what we collect)
- Data usage (how we use it)
- Data storage (where and how long)
- Data sharing (third parties)
- User rights (access, deletion, portability)
- Cookie policy
- Contact information for data requests

### Payment Terms
- Escrow mechanics (30/70 split)
- Platform fee (5%)
- Refund policy
- Dispute resolution
- Payout timelines
- Failed payment handling

**Implementation:**
1. Draft documents (use templates + lawyer review)
2. Create pages:
   - `client/src/pages/TermsOfService.tsx`
   - `client/src/pages/PrivacyPolicy.tsx`
   - `client/src/pages/PaymentTerms.tsx`
3. Add footer links
4. Require acceptance on registration

**Estimated Time:** 2-3 days (with lawyer review)

---

## 5. Error Handling & Edge Cases ⚠️ MEDIUM PRIORITY

**Problem:** Basic error handling, many edge cases unhandled  
**Impact:** Poor user experience, potential data corruption  

**Critical Edge Cases:**

### Concurrent Bid Acceptance
**Scenario:** Two buyers accept same worker's bid simultaneously  
**Current:** No locking mechanism  
**Fix:** Add optimistic locking with version numbers

### Failed SMS Delivery
**Scenario:** Twilio SMS fails (number invalid, network down)  
**Current:** User stuck, no retry  
**Fix:** Add retry logic (3 attempts) + fallback to email

### Payment Webhook Failures
**Scenario:** Paystack webhook doesn't reach our server  
**Current:** Payment stuck in limbo  
**Fix:** Add webhook retry + manual reconciliation tool

### Duplicate Job Posts
**Scenario:** User clicks "Post Job" twice quickly  
**Current:** Creates two identical jobs  
**Fix:** Add debouncing + duplicate detection

### Image Upload Failures
**Scenario:** S3 upload fails mid-upload  
**Current:** Broken image references  
**Fix:** Add upload retry + cleanup of failed uploads

**Estimated Time:** 2-3 days

---

## 6. Monitoring & Alerts ⚠️ MEDIUM PRIORITY

**Problem:** No alerts if site goes down  
**Impact:** Won't know about outages until users complain  
**Status:** CloudWatch logs exist, no alarms  

**Required Alarms:**

1. **Lambda Error Rate > 5%**
   - Trigger: 5+ errors in 5 minutes
   - Action: SNS email to admin

2. **API Gateway 5xx Errors**
   - Trigger: Any 500/502/503 response
   - Action: SNS email + SMS

3. **DynamoDB Throttling**
   - Trigger: Read/write capacity exceeded
   - Action: Auto-scale + alert

4. **CloudFront Error Rate > 1%**
   - Trigger: 4xx/5xx errors spike
   - Action: SNS email

5. **Payment Failures**
   - Trigger: Paystack webhook failure
   - Action: SNS email + Slack

**Implementation:**
Add to `backend/template.yaml`:
```yaml
LambdaErrorAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: khaya-lambda-errors
    MetricName: Errors
    Namespace: AWS/Lambda
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref AlertTopic

AlertTopic:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: khaya-alerts
    Subscription:
      - Endpoint: admin@projectkhaya.co.za
        Protocol: email
```

**Estimated Time:** 3-4 hours

---

## 7. Database Backups ⚠️ MEDIUM PRIORITY

**Problem:** No backups configured  
**Impact:** Data loss if DynamoDB corrupted  
**Status:** Point-in-time recovery not enabled  

**Fix:**
Enable PITR in `backend/template.yaml`:
```yaml
KhayaTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: khaya-prod
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: true
```

**Cost:** ~$0.20/GB/month (minimal for MVP)

**Estimated Time:** 15 minutes

---

## 8. Security Hardening ⚠️ MEDIUM PRIORITY

**Problem:** Several security gaps  
**Impact:** Vulnerable to attacks  

**Critical Fixes:**

### Rate Limiting
**Add to API Gateway:**
```yaml
KhayaApi:
  Type: AWS::Serverless::Api
  Properties:
    ThrottleSettings:
      RateLimit: 1000
      BurstLimit: 2000
```

### Admin MFA
**Enable in Cognito User Pool:**
```yaml
KhayaUserPool:
  Properties:
    MfaConfiguration: OPTIONAL
    EnabledMfas:
      - SOFTWARE_TOKEN_MFA
```

### Input Sanitization
**Add to all routers:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedInput = DOMPurify.sanitize(input.description);
```

### CORS Restrictions
**Tighten in API Gateway:**
```yaml
Cors:
  AllowOrigins:
    - https://projectkhaya.co.za
    - https://www.projectkhaya.co.za
  AllowMethods:
    - GET
    - POST
    - PUT
    - DELETE
  AllowHeaders:
    - Content-Type
    - Authorization
```

**Estimated Time:** 1 day

---

## PRIORITY RANKING

### 🔴 MUST FIX (Launch Blockers)
1. **Admin Dashboard Auth** - 1 hour
2. **Paystack Live Testing** - 2-3 hours (+ 1-2 days approval)
3. **Real User Testing** - 1 week

**Total:** ~10 days (including Paystack approval + user testing)

### 🟡 SHOULD FIX (High Priority)
4. **Legal Documentation** - 2-3 days
5. **Error Handling** - 2-3 days
6. **Monitoring & Alerts** - 3-4 hours
7. **Database Backups** - 15 minutes
8. **Security Hardening** - 1 day

**Total:** ~5-6 days

### 🟢 CAN DEFER (Post-Launch)
- Performance optimization
- Advanced search
- Analytics dashboard
- Mobile PWA enhancements
- Multi-language support
- ML features

---

## LAUNCH TIMELINE

### Week 1 (Nov 16-22)
- **Day 1:** Fix admin auth (1 hour)
- **Day 1:** Setup Paystack live account (2 hours)
- **Day 1-2:** Create legal docs (2 days)
- **Day 2:** Add monitoring alarms (4 hours)
- **Day 2:** Enable database backups (15 min)
- **Day 3:** Security hardening (1 day)
- **Day 3-4:** Error handling improvements (2 days)
- **Day 4-5:** Wait for Paystack approval
- **Day 5:** Test live payments (2 hours)
- **Day 5-7:** Recruit beta users

### Week 2 (Nov 23-29)
- **Day 8-14:** Beta user testing (5 users, 1 week)
- **Day 14:** Collect feedback
- **Day 14:** Fix critical bugs

### Week 3 (Nov 30 - Dec 6)
- **Day 15-17:** Address beta feedback (3 days)
- **Day 18:** Final testing
- **Day 19:** Soft launch (limited users)
- **Day 20-21:** Monitor, fix issues

### Week 4 (Dec 7+)
- **Day 22:** Public launch 🚀

---

## IMMEDIATE NEXT STEPS (Today)

1. ✅ **Fix Admin Login** (1 hour)
   - Update `AdminLogin.tsx` to use tRPC
   - Test with credentials
   - Verify dashboard loads

2. ✅ **Create Paystack Account** (30 min)
   - Sign up at paystack.com
   - Submit KYC documents
   - Wait for approval email

3. ✅ **Draft Terms of Service** (2 hours)
   - Use template from termsfeed.com
   - Customize for Project Khaya
   - Add escrow/payment terms

4. ✅ **Enable Database Backups** (15 min)
   - Update template.yaml
   - Deploy: `sam build && sam deploy`

5. ✅ **Add Basic Monitoring** (1 hour)
   - Create SNS topic
   - Add Lambda error alarm
   - Test alert delivery

**Total Today:** ~5 hours of focused work

---

**Bottom Line:** We're 95% done, but these 8 critical items stand between us and launch. Most can be fixed in 1-2 weeks. The platform is impressive and functional - we just need to cross the finish line safely.
