# Escrow Payment System - DynamoDB Schema

## Table: KhayaTable (Single Table Design)

### Payment Records (Escrow Tracking)

**Primary Key Pattern:**
- `PK`: `PAYMENT#${paymentId}`
- `SK`: `METADATA`

**GSI1 (Job Payments):**
- `GSI1PK`: `JOB#${jobId}`
- `GSI1SK`: `${createdAt}`

**Attributes:**
```typescript
{
  PK: string;                    // PAYMENT#uuid
  SK: string;                    // METADATA
  paymentId: string;             // UUID
  jobId: string;                 // Job reference
  clientId: string;              // Buyer user ID
  workerId: string;              // Worker user ID
  amount: number;                // Total amount in ZAR
  escrowAmount: number;          // Amount held in escrow
  status: 'pending' | 'completed' | 'failed';
  paystackReference: string;     // Paystack transaction reference
  paystackAccessCode: string;    // Paystack access code
  
  // Escrow tracking
  released: boolean;             // false = funds held, true = released
  proofNeeded: boolean;          // true = requires photo proof
  proofUrl?: string;             // S3 URL of submitted proof
  proofVerified: boolean;        // Proof validation status
  
  // Payout details
  platformFee?: number;          // 5% platform fee
  workerAmount?: number;         // 95% to worker
  releasedAt?: string;           // ISO timestamp
  
  // Timestamps
  createdAt: string;             // ISO timestamp
  completedAt?: string;          // Payment completed
  paidAt?: string;               // Paystack confirmation
  
  // Indexes
  GSI1PK: string;                // JOB#jobId
  GSI1SK: string;                // createdAt
}
```

---

### Job Records (Escrow State)

**Primary Key Pattern:**
- `PK`: `JOB#${jobId}`
- `SK`: `METADATA`

**GSI2 (Status Index):**
- `GSI2PK`: `STATUS#${status}`
- `GSI2SK`: `${createdAt}`

**Escrow Attributes:**
```typescript
{
  // ... existing job fields ...
  
  // Escrow tracking
  escrowHeld: boolean;           // true when payment received
  escrowAmount: number;          // Amount in escrow
  escrowReleased: boolean;       // true when proof verified
  
  // Proof tracking
  proofUrl?: string;             // S3 URL of completion proof
  proofSubmittedAt?: string;     // ISO timestamp
  
  // Status tracking
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  startedAt?: string;            // When payment received
  completedAt?: string;          // When proof verified
}
```

---

### User Records (Balance Tracking)

**Primary Key Pattern:**
- `PK`: `USER#${userId}`
- `SK`: `PROFILE`

**Balance Attributes:**
```typescript
{
  // ... existing user fields ...
  
  // Financial tracking
  balance: number;               // Available balance (ZAR)
  totalEarnings: number;         // Lifetime earnings
  pendingEscrow: number;         // Amount in active escrows
  
  // Bank details (for payouts)
  bankAccount?: string;          // Account number
  bankCode?: string;             // Bank code
  bankName?: string;             // Bank name
  recipientCode?: string;        // Paystack recipient code
}
```

---

## Escrow Flow States

### 1. Payment Received (charge.success webhook)
```typescript
Payment: {
  status: 'completed',
  released: false,
  proofNeeded: true,
  escrowAmount: 500.00
}

Job: {
  status: 'in_progress',
  escrowHeld: true,
  escrowAmount: 500.00
}
```

### 2. Proof Submitted (jobs.complete mutation)
```typescript
Payment: {
  status: 'completed',
  released: true,
  proofUrl: 's3://bucket/proof.jpg',
  proofVerified: true,
  platformFee: 25.00,    // 5%
  workerAmount: 475.00,  // 95%
  releasedAt: '2025-11-11T18:00:00Z'
}

Job: {
  status: 'completed',
  escrowReleased: true,
  proofUrl: 's3://bucket/proof.jpg',
  completedAt: '2025-11-11T18:00:00Z'
}

Worker: {
  balance: 475.00,
  totalEarnings: 475.00,
  completedJobs: 1
}
```

---

## Query Patterns

### Get unreleased payments for a job
```typescript
queryItems({
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :pk',
  FilterExpression: 'released = :false AND proofNeeded = :true',
  ExpressionAttributeValues: {
    ':pk': 'JOB#jobId',
    ':false': false,
    ':true': true
  }
})
```

### Get jobs requiring proof
```typescript
queryItems({
  IndexName: 'GSI2',
  KeyConditionExpression: 'GSI2PK = :status',
  FilterExpression: 'escrowHeld = :true AND escrowReleased = :false',
  ExpressionAttributeValues: {
    ':status': 'STATUS#in_progress',
    ':true': true,
    ':false': false
  }
})
```

### Get worker pending escrows
```typescript
queryItems({
  FilterExpression: 'workerId = :workerId AND released = :false',
  ExpressionAttributeValues: {
    ':workerId': 'userId',
    ':false': false
  }
})
```

---

## Security Rules

1. **No automatic payouts** - All releases require photo proof
2. **Webhook signature verification** - All Paystack webhooks must be verified
3. **Client-only completion** - Only job owner can submit proof
4. **Single release** - Payment can only be released once
5. **Amount validation** - Escrow amount must match payment amount

---

## SMS Notifications

### On Payment Success (charge.success)
```
To: Buyer
Message: "Job started! Payment of R{amount} is held securely. 
         Once work is complete, submit photo proof to release 
         payment to the worker. - Project Khaya"
```

### On Proof Submission (jobs.complete)
```
To: Worker
Message: "Payment released! R{workerAmount} has been added to 
         your balance. Withdraw anytime. - Project Khaya"
```

---

## Environment Variables Required

```bash
# Paystack
PAYSTACK_SECRET_KEY=PAYSTACK_SECRET_KEY_HERE
PAYSTACK_PUBLIC_KEY=pk_live_xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=+27xxx

# DynamoDB
DYNAMODB_TABLE_NAME=KhayaTable
AWS_REGION=us-east-1
```
