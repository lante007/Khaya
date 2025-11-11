# Project Khaya - API Endpoint Contracts

## Contract Format

All endpoints follow this structure:
```typescript
{
  method: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'SUBSCRIBE',
  path: '/api/endpoint',
  input: ZodSchema,
  output: ZodSchema,
  description: 'Function purpose',
  auth: 'required' | 'optional' | 'none'
}
```

---

## Phase 1: Authentication & Onboarding

### 1.1 Sign Up
```typescript
{
  method: 'POST',
  path: '/api/auth/signUp',
  auth: 'none',
  input: z.object({
    email: z.string().email().optional(),
    phone: z.string().regex(/^\+27[0-9]{9}$/),
    password: z.string().min(8),
    userType: z.enum(['buyer', 'worker', 'seller']),
    name: z.string().min(2)
  }),
  output: z.object({
    userId: z.string().uuid(),
    otpSent: z.boolean(),
    method: z.enum(['whatsapp', 'sms', 'email'])
  }),
  description: 'Create new user account and send OTP verification'
}
```

### 1.2 Verify OTP
```typescript
{
  method: 'POST',
  path: '/api/auth/verify',
  auth: 'none',
  input: z.object({
    userId: z.string().uuid(),
    otp: z.string().length(6)
  }),
  output: z.object({
    verified: z.boolean(),
    token: z.string(),
    profileId: z.string().uuid(),
    userType: z.enum(['buyer', 'worker', 'seller'])
  }),
  description: 'Verify OTP and return auth token'
}
```

### 1.3 Sign In
```typescript
{
  method: 'POST',
  path: '/api/auth/signIn',
  auth: 'none',
  input: z.object({
    identifier: z.string(), // email or phone
    password: z.string()
  }),
  output: z.object({
    token: z.string(),
    userType: z.enum(['buyer', 'worker', 'seller', 'admin']),
    userId: z.string().uuid()
  }),
  description: 'Authenticate user and return token'
}
```

### 1.4 Refresh Token
```typescript
{
  method: 'POST',
  path: '/api/auth/refresh',
  auth: 'required',
  input: z.object({
    refreshToken: z.string()
  }),
  output: z.object({
    token: z.string(),
    expiresIn: z.number()
  }),
  description: 'Refresh expired access token'
}
```

---

## Phase 2: User Context & Dashboard

### 2.1 Get User Context
```typescript
{
  method: 'GET',
  path: '/api/user/{userId}',
  auth: 'required',
  input: z.object({
    userId: z.string().uuid()
  }),
  output: z.object({
    userType: z.enum(['buyer', 'worker', 'seller', 'admin']),
    profile: z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      verified: z.boolean(),
      completionPercent: z.number().min(0).max(100),
      trustScore: z.number().min(0).max(5),
      location: z.object({
        city: z.string(),
        province: z.string(),
        lat: z.number(),
        lng: z.number()
      }).optional()
    }),
    quickActions: z.array(z.object({
      label: z.string(),
      icon: z.string(),
      route: z.string(),
      badge: z.number().optional()
    })),
    notifications: z.array(z.object({
      id: z.string().uuid(),
      type: z.enum(['bid', 'message', 'payment', 'alert']),
      message: z.string(),
      read: z.boolean(),
      timestamp: z.string().datetime()
    }))
  }),
  description: 'Get user profile and dashboard context'
}
```

### 2.2 Update Profile
```typescript
{
  method: 'PUT',
  path: '/api/user/{userId}/profile',
  auth: 'required',
  input: z.object({
    userId: z.string().uuid(),
    name: z.string().optional(),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    location: z.object({
      city: z.string(),
      province: z.string(),
      lat: z.number(),
      lng: z.number()
    }).optional(),
    portfolio: z.array(z.string().url()).optional()
  }),
  output: z.object({
    success: z.boolean(),
    completionPercent: z.number()
  }),
  description: 'Update user profile information'
}
```

### 2.3 Real-time Notifications (Subscription)
```typescript
{
  method: 'SUBSCRIBE',
  path: '/api/nudges',
  auth: 'required',
  input: z.object({
    userId: z.string().uuid()
  }),
  output: z.object({
    type: z.enum(['bid', 'alert', 'message', 'payment']),
    title: z.string(),
    message: z.string(),
    timestamp: z.string().datetime(),
    actionUrl: z.string().optional()
  }),
  description: 'Subscribe to real-time notifications stream'
}
```

---

## Phase 3: Jobs & Bidding

### 3.1 Create Job
```typescript
{
  method: 'POST',
  path: '/api/jobs/create',
  auth: 'required',
  input: z.object({
    title: z.string().min(10).max(100),
    description: z.string().min(50).max(2000),
    category: z.enum([
      'construction', 'plumbing', 'electrical', 'painting',
      'roofing', 'tiling', 'carpentry', 'landscaping', 'other'
    ]),
    location: z.object({
      address: z.string(),
      city: z.string(),
      lat: z.number(),
      lng: z.number()
    }),
    budget: z.object({
      min: z.number().positive(),
      max: z.number().positive()
    }),
    timeline: z.object({
      startDate: z.string().datetime(),
      flexible: z.boolean()
    }),
    photos: z.array(z.string().url()).max(5).optional()
  }),
  output: z.object({
    jobId: z.string().uuid(),
    aiSuggestion: z.object({
      priceRange: z.object({
        min: z.number(),
        max: z.number()
      }),
      timelineDays: z.number(),
      confidence: z.number().min(0).max(1),
      reasoning: z.string()
    }),
    matchingWorkers: z.number()
  }),
  description: 'Create new job posting with AI price/timeline suggestions'
}
```

### 3.2 List Jobs
```typescript
{
  method: 'GET',
  path: '/api/jobs',
  auth: 'optional',
  input: z.object({
    filters: z.object({
      category: z.string().optional(),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
        radius: z.number() // km
      }).optional(),
      budget: z.object({
        min: z.number(),
        max: z.number()
      }).optional(),
      searchQuery: z.string().optional(),
      status: z.enum(['open', 'in_progress', 'completed']).optional()
    }).optional(),
    page: z.string().optional(),
    limit: z.number().min(1).max(50).default(20)
  }),
  output: z.object({
    jobs: z.array(z.object({
      jobId: z.string().uuid(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      location: z.object({
        city: z.string(),
        distance: z.number().optional() // km from user
      }),
      budget: z.object({
        min: z.number(),
        max: z.number()
      }),
      bidCount: z.number(),
      viewCount: z.number(),
      postedAt: z.string().datetime(),
      buyerName: z.string(),
      buyerTrustScore: z.number(),
      matchScore: z.number().min(0).max(100).optional()
    })),
    total: z.number(),
    nextPageToken: z.string().optional()
  }),
  description: 'Browse jobs with filters and semantic search'
}
```

### 3.3 Get Job Details
```typescript
{
  method: 'GET',
  path: '/api/jobs/{jobId}',
  auth: 'optional',
  input: z.object({
    jobId: z.string().uuid()
  }),
  output: z.object({
    jobId: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    category: z.string(),
    location: z.object({
      address: z.string(),
      city: z.string(),
      lat: z.number(),
      lng: z.number()
    }),
    budget: z.object({
      min: z.number(),
      max: z.number()
    }),
    timeline: z.object({
      startDate: z.string().datetime(),
      flexible: z.boolean()
    }),
    photos: z.array(z.string().url()),
    status: z.enum(['open', 'in_progress', 'completed', 'cancelled']),
    buyer: z.object({
      id: z.string().uuid(),
      name: z.string(),
      trustScore: z.number(),
      jobsPosted: z.number()
    }),
    bids: z.array(z.object({
      bidId: z.string().uuid(),
      workerId: z.string().uuid(),
      workerName: z.string(),
      workerTrustScore: z.number(),
      quote: z.number(),
      timeline: z.object({
        startDate: z.string().datetime(),
        duration: z.number() // days
      }),
      proposal: z.string(),
      status: z.enum(['pending', 'accepted', 'rejected']),
      createdAt: z.string().datetime()
    })),
    viewCount: z.number(),
    activeViewers: z.number(), // real-time count
    postedAt: z.string().datetime()
  }),
  description: 'Get detailed job information with bids'
}
```

### 3.4 Create Bid
```typescript
{
  method: 'POST',
  path: '/api/bids/create',
  auth: 'required',
  input: z.object({
    jobId: z.string().uuid(),
    quote: z.number().positive(),
    timeline: z.object({
      startDate: z.string().datetime(),
      duration: z.number().positive() // days
    }),
    proposal: z.string().min(100).max(1000)
  }),
  output: z.object({
    bidId: z.string().uuid(),
    competitiveness: z.enum(['low', 'medium', 'high']),
    ranking: z.number(), // position among all bids
    totalBids: z.number(),
    message: z.string() // behavioral nudge
  }),
  description: 'Submit bid on job with competitiveness feedback'
}
```

### 3.5 Accept Bid
```typescript
{
  method: 'POST',
  path: '/api/bids/{bidId}/accept',
  auth: 'required',
  input: z.object({
    bidId: z.string().uuid(),
    jobId: z.string().uuid()
  }),
  output: z.object({
    success: z.boolean(),
    paymentSessionId: z.string(),
    escrowAmount: z.number(),
    feeBreakdown: z.object({
      subtotal: z.number(),
      platformFee: z.number(),
      total: z.number()
    })
  }),
  description: 'Accept bid and initiate payment/escrow'
}
```

### 3.6 Complete Job
```typescript
{
  method: 'POST',
  path: '/api/jobs/{jobId}/complete',
  auth: 'required',
  input: z.object({
    jobId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    review: z.string().min(20).max(500),
    photos: z.array(z.string().url()).optional()
  }),
  output: z.object({
    success: z.boolean(),
    payoutInitiated: z.boolean(),
    workerEarnings: z.number()
  }),
  description: 'Mark job complete and release payment'
}
```

---

## Phase 4: Payments

### 4.1 Create Payment Session
```typescript
{
  method: 'POST',
  path: '/api/payments/session',
  auth: 'required',
  input: z.object({
    amount: z.number().positive(),
    jobId: z.string().uuid(),
    feeType: z.enum(['buyer', 'worker']),
    userId: z.string().uuid()
  }),
  output: z.object({
    sessionId: z.string(),
    netAmount: z.number(),
    feeBreakdown: z.object({
      platform: z.number(),
      total: z.number(),
      message: z.string() // "95% goes to you"
    }),
    paystackUrl: z.string().url(),
    feeWaived: z.boolean()
  }),
  description: 'Create Paystack payment session with fee calculation'
}
```

### 4.2 Verify Payment
```typescript
{
  method: 'POST',
  path: '/api/payments/verify',
  auth: 'required',
  input: z.object({
    reference: z.string(),
    sessionId: z.string()
  }),
  output: z.object({
    verified: z.boolean(),
    status: z.enum(['success', 'failed', 'pending']),
    amount: z.number(),
    transactionId: z.string().uuid()
  }),
  description: 'Verify Paystack payment status'
}
```

### 4.3 List Transactions
```typescript
{
  method: 'GET',
  path: '/api/transactions/{userId}',
  auth: 'required',
  input: z.object({
    userId: z.string().uuid(),
    type: z.enum(['all', 'earnings', 'payments']).optional(),
    page: z.string().optional()
  }),
  output: z.object({
    transactions: z.array(z.object({
      id: z.string().uuid(),
      jobId: z.string().uuid(),
      jobTitle: z.string(),
      amount: z.number(),
      fee: z.number(),
      net: z.number(),
      status: z.enum(['pending', 'completed', 'failed', 'refunded']),
      type: z.enum(['payment', 'earning', 'refund']),
      date: z.string().datetime()
    })),
    summary: z.object({
      totalEarned: z.number(),
      totalPaid: z.number(),
      pendingPayouts: z.number(),
      feeWaiversRemaining: z.number()
    }),
    nextPageToken: z.string().optional()
  }),
  description: 'Get transaction history with summary'
}
```

---

## Phase 4.5: Seller Subscriptions

### 4.5.1 Get Subscription Tier
```typescript
{
  method: 'GET',
  path: '/api/subscriptions/tier/{userId}',
  auth: 'required',
  input: z.object({
    userId: z.string().uuid()
  }),
  output: z.object({
    tier: z.enum(['starter', 'pro', 'elite']),
    limit: z.number(),
    used: z.number(),
    expires: z.string().datetime(),
    features: z.array(z.string()),
    price: z.number()
  }),
  description: 'Get current subscription tier and usage'
}
```

### 4.5.2 Upgrade Subscription
```typescript
{
  method: 'POST',
  path: '/api/subscriptions/upgrade',
  auth: 'required',
  input: z.object({
    tier: z.enum(['pro', 'elite']),
    userId: z.string().uuid()
  }),
  output: z.object({
    subscriptionId: z.string(),
    trialEnd: z.string().datetime().optional(),
    nextBilling: z.string().datetime(),
    paystackUrl: z.string().url()
  }),
  description: 'Upgrade to paid subscription tier'
}
```

### 4.5.3 Cancel Subscription
```typescript
{
  method: 'POST',
  path: '/api/subscriptions/cancel',
  auth: 'required',
  input: z.object({
    userId: z.string().uuid(),
    reason: z.string().optional()
  }),
  output: z.object({
    cancelled: z.boolean(),
    endDate: z.string().datetime(),
    refundAmount: z.number().optional()
  }),
  description: 'Cancel subscription (end of billing period)'
}
```

---

## Phase 5: Referrals

### 5.1 Generate Referral Code
```typescript
{
  method: 'POST',
  path: '/api/referrals/code',
  auth: 'required',
  input: z.object({
    userId: z.string().uuid()
  }),
  output: z.object({
    code: z.string(),
    shareUrl: z.string().url(),
    qrCodeUrl: z.string().url(),
    totalEarned: z.number()
  }),
  description: 'Generate unique referral code and share links'
}
```

### 5.2 Apply Referral Code
```typescript
{
  method: 'POST',
  path: '/api/referrals/apply',
  auth: 'required',
  input: z.object({
    code: z.string(),
    userId: z.string().uuid()
  }),
  output: z.object({
    applied: z.boolean(),
    referrerName: z.string(),
    bonus: z.number()
  }),
  description: 'Apply referral code during signup'
}
```

### 5.3 Get Referral Stats
```typescript
{
  method: 'GET',
  path: '/api/referrals/{userId}',
  auth: 'required',
  input: z.object({
    userId: z.string().uuid()
  }),
  output: z.object({
    pending: z.array(z.object({
      buyerId: z.string().uuid(),
      name: z.string(),
      signupDate: z.string().datetime(),
      commission: z.number()
    })),
    completed: z.array(z.object({
      buyerId: z.string().uuid(),
      name: z.string(),
      commission: z.number(),
      paidAt: z.string().datetime()
    })),
    summary: z.object({
      totalReferrals: z.number(),
      totalEarned: z.number(),
      pendingCommission: z.number(),
      tier: z.enum(['bronze', 'silver', 'gold'])
    })
  }),
  description: 'Get referral statistics and earnings'
}
```

---

## Phase 6: Messaging

### 6.1 Send Message
```typescript
{
  method: 'POST',
  path: '/api/chat/send',
  auth: 'required',
  input: z.object({
    jobId: z.string().uuid(),
    message: z.string().max(2000),
    files: z.array(z.string().url()).max(5).optional()
  }),
  output: z.object({
    messageId: z.string().uuid(),
    timestamp: z.string().datetime()
  }),
  description: 'Send message in job conversation'
}
```

### 6.2 Subscribe to Messages
```typescript
{
  method: 'SUBSCRIBE',
  path: '/api/chat/{jobId}',
  auth: 'required',
  input: z.object({
    jobId: z.string().uuid()
  }),
  output: z.object({
    messages: z.array(z.object({
      id: z.string().uuid(),
      senderId: z.string().uuid(),
      senderName: z.string(),
      message: z.string(),
      files: z.array(z.string().url()).optional(),
      timestamp: z.string().datetime(),
      read: z.boolean()
    })),
    participants: z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      type: z.enum(['buyer', 'worker']),
      online: z.boolean()
    })),
    typing: z.array(z.string().uuid()) // user IDs currently typing
  }),
  description: 'Subscribe to real-time chat updates'
}
```

### 6.3 Summarize Conversation
```typescript
{
  method: 'POST',
  path: '/api/chat/summarize',
  auth: 'required',
  input: z.object({
    jobId: z.string().uuid()
  }),
  output: z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
    actionItems: z.array(z.object({
      description: z.string(),
      assignedTo: z.string().uuid().optional()
    })),
    sentiment: z.enum(['positive', 'neutral', 'negative'])
  }),
  description: 'AI-powered conversation summary'
}
```

---

## Behavioral Endpoints

### Get Social Proof Data
```typescript
{
  method: 'GET',
  path: '/api/behavioral/social-proof',
  auth: 'optional',
  input: z.object({
    type: z.enum(['job_views', 'active_users', 'completed_jobs']),
    entityId: z.string().uuid().optional()
  }),
  output: z.object({
    count: z.number(),
    message: z.string(),
    trend: z.enum(['up', 'down', 'stable'])
  }),
  description: 'Get real-time social proof metrics'
}
```

---

## Error Responses

All endpoints return errors in this format:
```typescript
{
  error: {
    code: string, // 'VALIDATION_ERROR', 'AUTH_ERROR', etc.
    message: string,
    details: object // optional
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid input
- `AUTH_ERROR` - Authentication required/failed
- `NOT_FOUND` - Resource not found
- `PERMISSION_DENIED` - Insufficient permissions
- `RATE_LIMIT` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Rate Limits

- Auth endpoints: 5 requests/minute
- Read endpoints: 100 requests/minute
- Write endpoints: 20 requests/minute
- Subscriptions: 10 concurrent connections

---

**Built with Ubuntu** 🏠
