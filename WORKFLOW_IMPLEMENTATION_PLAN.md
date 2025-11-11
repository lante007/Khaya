# Project Khaya - Complete Workflow Implementation Plan

## Current State Audit

### ✅ What's Already Built

**Frontend:**
- ✅ Modern landing page (khaya-connect-kzn integrated)
- ✅ Navigation with Get Started/Sign In buttons
- ✅ Auth page with role-based routing (buyer/worker/seller)
- ✅ Footer with all content pages
- ✅ Responsive design with Tailwind CSS
- ✅ shadcn/ui components

**Backend (Designed, Not Deployed):**
- ✅ Cognito User Pool design (4 groups)
- ✅ DynamoDB single-table schema
- ✅ Lambda functions: signup-buyer, signup-worker, project-create, bid-create
- ✅ CloudFormation template (template.yaml)
- ✅ Deployment scripts

**Current Auth System:**
- ✅ Email-based authentication (nodemailer)
- ✅ OTP verification
- ✅ JWT tokens
- ⚠️ Using tRPC + MySQL (needs migration to AWS)

### ❌ What's Missing (Per Your Spec)

**Phase 1: Auth & Onboarding**
- ❌ Twilio WhatsApp OTP integration
- ❌ Cognito deployment (designed but not deployed)
- ❌ EventBridge welcome alerts
- ❌ Social login (Google)
- ❌ reCAPTCHA protection
- ❌ Zulu/English language toggle

**Phase 2: Dashboard Shell**
- ❌ User-type specific dashboards
- ❌ Real-time notifications (AppSync)
- ❌ Profile completion tracking
- ❌ Quick actions per role

**Phase 3: Core Flows**
- ❌ Job posting with AI suggestions (Bedrock)
- ❌ Job browsing with semantic search
- ❌ Bid submission workflow
- ❌ Bid acceptance/rejection
- ❌ Job completion flow

**Phase 4: Payments**
- ❌ Paystack integration
- ❌ 5% platform fee logic
- ❌ Fee waivers (first 2 jobs for workers)
- ❌ Transaction history
- ❌ Escrow system

**Phase 4.5: Seller Subscriptions**
- ❌ Tiered subscription model
- ❌ Listing limits enforcement
- ❌ Paystack recurring billing

**Phase 5: Referral System**
- ❌ Referral code generation
- ❌ 5% commission tracking
- ❌ Commission payouts

**Phase 6: Messaging**
- ❌ Real-time chat (AppSync)
- ❌ AI message summaries
- ❌ File uploads
- ❌ WhatsApp bridge

**Behavioral Design**
- ❌ Social proof counters
- ❌ Progress bars
- ❌ Scarcity indicators
- ❌ Reciprocity nudges

---

## Implementation Strategy

### Approach: Hybrid Migration

**Keep Frontend:** React on S3/CloudFront (already deployed)

**Backend Options:**
1. **Full AWS Migration** (Your spec) - Cognito + DynamoDB + Lambda
2. **Hybrid Approach** (Faster MVP) - Keep current backend, add AWS features incrementally

**Recommendation:** Start with Hybrid, migrate to full AWS in phases

---

## Phase-by-Phase Implementation

### Phase 1: Enhanced Auth (Week 1)

#### Backend Tasks
1. **Deploy Cognito User Pool**
   ```bash
   cd aws-infrastructure
   sam deploy --guided
   ```

2. **Add Twilio WhatsApp OTP**
   - Lambda: `twilio-otp-send`
   - Lambda: `twilio-otp-verify`
   - Environment: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`

3. **EventBridge Welcome Flow**
   - Rule: User confirmed → Send welcome email
   - Target: SES Lambda

#### Frontend Tasks
1. **Update Auth.tsx**
   - Add Amplify Cognito integration
   - WhatsApp OTP UI
   - reCAPTCHA v3
   - Language toggle (Zulu/English)

2. **Social Login**
   - Google OAuth button
   - Cognito hosted UI integration

**Endpoint Contracts:**
```typescript
// POST /api/auth/signUp
Input: {
  email?: string,
  phone: string,
  password: string,
  userType: 'buyer' | 'worker' | 'seller'
}
Output: {
  userId: string,
  otpSent: boolean,
  method: 'whatsapp' | 'sms'
}

// POST /api/auth/verify
Input: {
  userId: string,
  otp: string
}
Output: {
  verified: boolean,
  token: string,
  profileId: string
}
```

---

### Phase 2: Dashboard Shell (Week 2)

#### Backend Tasks
1. **User Context API**
   - Lambda: `get-user-context`
   - Returns: userType, profile, quickActions, notifications

2. **AppSync Real-time Notifications**
   - GraphQL schema for nudges
   - Subscription: `onNewNudge(userId)`

3. **Profile Completion Tracking**
   - DynamoDB: Profile completion percentage
   - EventBridge: Nudge on incomplete profiles

#### Frontend Tasks
1. **Dashboard Layout**
   - Sidebar with role-specific menu
   - Header with notifications bell
   - Mobile hamburger menu

2. **Role-Specific Dashboards**
   - Buyer: "Post Job", "My Jobs", "Messages"
   - Worker: "Browse Jobs", "My Bids", "Earnings"
   - Seller: "My Products", "Orders", "Subscription"

3. **Real-time Notifications**
   - AppSync subscription hook
   - Toast notifications with Sonner
   - Pulse animation on bell icon

**Endpoint Contracts:**
```typescript
// GET /api/user/{userId}
Output: {
  userType: 'buyer' | 'worker' | 'seller',
  profile: {
    name: string,
    email: string,
    phone: string,
    verified: boolean,
    completionPercent: number
  },
  quickActions: [
    { label: string, icon: string, route: string }
  ],
  notifications: [
    { id: string, type: string, message: string, read: boolean }
  ]
}

// SUBSCRIBE /api/nudges
Input: { userId: string }
Output: Stream {
  type: 'bid' | 'alert' | 'message',
  title: string,
  message: string,
  timestamp: string
}
```

---

### Phase 3: Core Flows - Jobs & Bids (Week 3-4)

#### Backend Tasks
1. **Job Posting with AI**
   - Lambda: `create-job`
   - Bedrock integration for price/timeline suggestions
   - S3 presigned URLs for photo uploads
   - EventBridge: Notify matching workers

2. **Job Browsing**
   - Lambda: `list-jobs`
   - GSI: Category + Location queries
   - Bedrock: Semantic search embeddings
   - Pagination with page tokens

3. **Bidding System**
   - Lambda: `create-bid`
   - Lambda: `accept-bid`
   - Lambda: `complete-job`
   - Status transitions: OPEN → ACCEPTED → IN_PROGRESS → COMPLETED

#### Frontend Tasks
1. **Post Job Wizard**
   - Step 1: Describe (title, description, category)
   - Step 2: Budget (min/max, timeline)
   - Step 3: Review (AI suggestions, photos)
   - Progress bar with behavioral nudges

2. **Browse Jobs**
   - Infinite scroll with filters
   - Semantic search bar
   - Job cards with bid counts
   - "12 workers viewing" social proof

3. **Bid Submission**
   - Bid form with quote, timeline, proposal
   - Portfolio showcase
   - "Your bid is competitive" nudges

**Endpoint Contracts:**
```typescript
// POST /api/jobs/create
Input: {
  title: string,
  description: string,
  category: 'construction' | 'plumbing' | 'electrical' | ...,
  location: { lat: number, lng: number, address: string },
  budget: { min: number, max: number },
  timeline: { startDate: string, flexible: boolean },
  photos?: string[]
}
Output: {
  jobId: string,
  aiSuggestion: {
    priceRange: { min: number, max: number },
    timelineDays: number,
    confidence: number
  }
}

// GET /api/jobs
Input: {
  filters: {
    category?: string,
    location?: { lat: number, lng: number, radius: number },
    budget?: { min: number, max: number },
    searchQuery?: string
  },
  page?: string
}
Output: {
  jobs: [
    {
      jobId: string,
      title: string,
      description: string,
      category: string,
      location: object,
      budget: object,
      bidCount: number,
      viewCount: number,
      postedAt: string
    }
  ],
  total: number,
  nextPageToken?: string
}

// POST /api/bids/create
Input: {
  jobId: string,
  quote: number,
  timeline: { startDate: string, duration: number },
  proposal: string
}
Output: {
  bidId: string,
  competitiveness: 'low' | 'medium' | 'high'
}
```

---

### Phase 4: Payments with Paystack (Week 5)

#### Backend Tasks
1. **Paystack Integration**
   - Lambda: `create-payment-session`
   - Lambda: `paystack-webhook`
   - 5% fee calculation
   - Fee waiver logic (first 2 jobs for workers)

2. **Transaction History**
   - Lambda: `list-transactions`
   - DynamoDB: Transactions table
   - Escrow status tracking

3. **Webhook Handling**
   - Verify Paystack signatures
   - Update transaction status
   - Trigger payouts

#### Frontend Tasks
1. **Payment Modal**
   - Paystack popup integration
   - Fee breakdown tooltip
   - "95% goes to you" framing

2. **Transaction History**
   - Table with net/gross amounts
   - Filter by status
   - Export to CSV

3. **Fee Waiver Progress**
   - "1 of 2 free jobs used" progress bar
   - Reciprocity nudges

**Endpoint Contracts:**
```typescript
// POST /api/payments/session
Input: {
  amount: number,
  jobId: string,
  feeType: 'buyer' | 'worker',
  userId: string
}
Output: {
  sessionId: string,
  netAmount: number,
  feeBreakdown: {
    platform: number,
    total: number,
    message: string
  },
  paystackUrl: string
}

// GET /api/transactions/{userId}
Output: {
  transactions: [
    {
      id: string,
      jobId: string,
      amount: number,
      fee: number,
      net: number,
      status: 'pending' | 'completed' | 'failed',
      date: string
    }
  ],
  totalEarned: number,
  feeWaiversRemaining: number
}
```

---

### Phase 4.5: Seller Subscriptions (Week 6)

#### Backend Tasks
1. **Subscription Tiers**
   - Lambda: `upgrade-subscription`
   - Lambda: `cancel-subscription`
   - Paystack subscription plans
   - Listing limit enforcement

2. **Usage Tracking**
   - Middleware: Check listing limits
   - DynamoDB: Track listings per seller

#### Frontend Tasks
1. **Subscription Page**
   - Tier comparison table (Elite first - anchoring)
   - Usage meter: "1/2 listings used"
   - Upgrade flow with Paystack

2. **Behavioral Nudges**
   - "500+ sellers on Pro plan" social proof
   - "Trial ends in 3 days" scarcity

**Endpoint Contracts:**
```typescript
// POST /api/subscriptions/upgrade
Input: {
  tier: 'pro' | 'elite',
  userId: string
}
Output: {
  subscriptionId: string,
  trialEnd: string,
  nextBilling: string,
  paystackUrl: string
}

// GET /api/subscriptions/tier/{userId}
Output: {
  tier: 'starter' | 'pro' | 'elite',
  limit: number,
  used: number,
  expires: string
}
```

---

### Phase 5: Referral System (Week 7)

#### Backend Tasks
1. **Referral Tracking**
   - Lambda: `generate-referral-code`
   - Lambda: `apply-referral`
   - Lambda: `calculate-commission`
   - 5% commission on first transaction
   - R500 cap per referral

2. **Commission Payouts**
   - EventBridge: Transaction completed → Calculate commission
   - Auto-payout to referrer

#### Frontend Tasks
1. **Referral Dashboard**
   - Code generation and sharing
   - WhatsApp/QR code sharing
   - Earnings chart

2. **Behavioral Elements**
   - "Earned R50 – share for another R50!" reciprocity
   - "Thandi earned R1200" social proof

**Endpoint Contracts:**
```typescript
// POST /api/referrals/code
Input: { userId: string }
Output: {
  code: string,
  shareUrl: string,
  totalEarned: number
}

// GET /api/referrals/{userId}
Output: {
  pending: [
    { buyerId: string, name: string, commission: number }
  ],
  completed: [
    { buyerId: string, name: string, commission: number, paidAt: string }
  ],
  totalEarned: number
}
```

---

### Phase 6: Messaging & Support (Week 8)

#### Backend Tasks
1. **Real-time Chat**
   - AppSync GraphQL API
   - Subscriptions for messages
   - DynamoDB: Messages table with TTL

2. **AI Summaries**
   - Bedrock: Summarize conversations
   - Trigger after 10+ messages

3. **File Uploads**
   - S3 presigned URLs
   - Image/document support

#### Frontend Tasks
1. **Chat Interface**
   - Real-time message updates
   - Typing indicators
   - File upload with progress

2. **AI Features**
   - "Summarize conversation" button
   - Key points extraction

3. **WhatsApp Bridge**
   - "Continue on WhatsApp" button
   - Deep link generation

**Endpoint Contracts:**
```typescript
// SUBSCRIBE /api/chat/{jobId}
Output: Stream {
  messages: [
    {
      id: string,
      senderId: string,
      message: string,
      timestamp: string,
      files?: string[]
    }
  ],
  participants: [
    { id: string, name: string, type: string }
  ]
}

// POST /api/chat/send
Input: {
  jobId: string,
  message: string,
  files?: string[]
}
Output: {
  messageId: string,
  timestamp: string
}

// POST /api/chat/summarize
Input: { jobId: string }
Output: {
  summary: string,
  keyPoints: string[]
}
```

---

## Behavioral Design Implementation

### Global Behavioral Components

**1. Social Proof Component**
```typescript
<SocialProof 
  type="viewing" 
  count={12} 
  message="people viewing this job"
/>
```

**2. Progress Bar Component**
```typescript
<ProgressBar 
  current={1} 
  total={2} 
  label="free jobs used"
  reward="Unlock unlimited bids"
/>
```

**3. Scarcity Badge**
```typescript
<ScarcityBadge 
  type="time" 
  remaining="24h"
  message="Featured spot available"
/>
```

**4. Reciprocity Nudge**
```typescript
<ReciprocityNudge 
  message="We waived your fee – share for R50 credit?"
  action="Share Now"
/>
```

### Integration Points

- **Auth Page:** Progress bar for signup steps
- **Dashboard:** Profile completion progress
- **Job Posting:** "Most homeowners add photos" nudge
- **Bidding:** "Your bid is competitive" feedback
- **Payments:** "95% goes to you" framing
- **Referrals:** "Earned R50" celebration toast

---

## Testing Strategy

### Backend Testing
```bash
# Unit tests
npm test -- --coverage

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Frontend Testing
```bash
# Component tests
npm test

# E2E with Playwright
npm run test:e2e

# Storybook
npm run storybook
```

---

## Deployment Checklist

### Backend Deployment
- [ ] Configure AWS credentials
- [ ] Set environment variables (Twilio, Paystack, Bedrock)
- [ ] Deploy CloudFormation stack
- [ ] Seed initial data
- [ ] Configure CloudWatch alarms
- [ ] Test webhooks

### Frontend Deployment
- [ ] Update API endpoints
- [ ] Configure Amplify
- [ ] Build production bundle
- [ ] Deploy to S3/CloudFront
- [ ] Invalidate cache
- [ ] Test on live site

---

## Success Metrics

### KPIs to Track
1. **Conversion Rate:** Sign up → First job post (Target: 40%)
2. **Engagement:** Messages sent per job (Target: 5+)
3. **Retention:** 30-day active users (Target: 60%)
4. **Monetization:** Fee revenue per transaction (Target: R50 avg)
5. **Virality:** Referral conversion rate (Target: 15%)

### Behavioral Metrics
- Social proof click-through rate
- Progress bar completion rate
- Scarcity badge conversion
- Reciprocity nudge acceptance

---

## Next Steps

**Immediate Actions:**
1. Deploy Cognito User Pool
2. Migrate auth to Cognito
3. Build dashboard shell
4. Implement job posting flow
5. Add Paystack integration

**Priority Order:**
1. Auth (Week 1)
2. Dashboard (Week 2)
3. Jobs & Bids (Week 3-4)
4. Payments (Week 5)
5. Subscriptions (Week 6)
6. Referrals (Week 7)
7. Messaging (Week 8)

**Built with Ubuntu** 🏠
