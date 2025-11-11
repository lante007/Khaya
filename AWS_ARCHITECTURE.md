# Project Khaya - AWS-Native Architecture

## Overview

Complete pivot to AWS-native services for scalability, trust, and the core bidding workflow.

### Architecture Stack

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  React (TypeScript) → S3 → CloudFront → Route 53            │
│  (Keep existing - already deployed)                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY                             │
│  REST API with Cognito Authorizer                           │
│  Endpoints: /signup/{role}, /projects, /bids, /products     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    LAMBDA FUNCTIONS                          │
│  • Signup flows (Buyer/Worker/Seller)                       │
│  • Project management (CRUD)                                 │
│  • Bidding workflow                                          │
│  • Product catalog                                           │
│  • Reviews & ratings                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA & AUTH LAYER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Cognito    │  │   DynamoDB   │  │      S3      │      │
│  │  User Pools  │  │ Single-Table │  │  Portfolios  │      │
│  │  4 Groups    │  │    Design    │  │   Products   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   NOTIFICATIONS & TRUST                      │
│  • SNS → SES (Welcome emails)                               │
│  • Twilio/Pinpoint (Phone OTP)                              │
│  • EventBridge (Workflow triggers)                          │
│  • CloudWatch (Monitoring)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Workflow: Project Bidding

The heartbeat of the three-sided platform:

```
1. BUYER posts job
   ↓
2. WORKERS browse & bid
   ↓
3. BUYER reviews bids & accepts
   ↓
4. WORKER completes job
   ↓
5. BUYER reviews & rates
   ↓
6. Trust scores update
```

---

## Role System

### 4 Distinct Roles

| Role | Signup | Capabilities | Verification |
|------|--------|--------------|--------------|
| **Buyer** | Public (5 fields) | Post jobs, buy materials, review | Email + Phone |
| **Worker** | Public (10+ fields) | Bid on jobs, manage portfolio | Email + Phone + ID |
| **Seller** | Public (8 fields) | Manage catalog, fulfill orders | Email + Phone + Business Reg |
| **Admin** | Backend only | Verify users, moderate, analytics | N/A |

### Cognito Groups

Each role maps to a Cognito group with specific permissions enforced at API Gateway level.

---

## Database Schema (DynamoDB)

### Single-Table Design

**Table**: `ProjectKhaya`

**Primary Key**:
- `PK`: Partition key (e.g., `USER#123`, `PROJECT#456`)
- `SK`: Sort key (e.g., `PROFILE`, `BID#worker789`)

**GSIs**:
1. **GSI1**: Role & Location search (`ROLE#WORKER`, `LOCATION#Estcourt#USER#123`)
2. **GSI2**: Status & Timestamp (`STATUS#OPEN`, `TIMESTAMP#2025-01-20`)
3. **GSI3**: Category search (`CATEGORY#Bricks`, `PRICE#5.50#PRODUCT#123`)

### Entity Types

1. **User Profiles** (Buyer/Worker/Seller)
2. **Projects** (Jobs posted by Buyers)
3. **Bids** (Worker quotes on projects)
4. **Products** (Seller catalog items)
5. **Orders** (Buyer purchases from Sellers)
6. **Reviews** (Trust system ratings)
7. **Messages** (User communication)

See `dynamodb-schema.md` for complete data models.

---

## API Endpoints

### Public (No Auth)

```
POST /signup/buyer      - Buyer registration
POST /signup/worker     - Worker registration
POST /signup/seller     - Seller registration
POST /auth/login        - Cognito authentication
POST /auth/refresh      - Token refresh
```

### Authenticated (Cognito JWT)

#### Buyer Endpoints
```
GET  /projects          - Browse available projects
POST /projects          - Create new project
GET  /projects/{id}     - Get project details
GET  /projects/{id}/bids - Get bids for project
POST /projects/{id}/accept - Accept a bid
POST /reviews           - Submit review

GET  /products          - Browse products
POST /orders            - Create order
GET  /orders/{id}       - Get order details
```

#### Worker Endpoints
```
GET  /projects          - Browse jobs (filtered by skills/location)
POST /bids              - Submit bid on project
GET  /bids/{id}         - Get bid details
PUT  /bids/{id}         - Update bid
GET  /profile           - Get own profile
PUT  /profile           - Update profile
POST /portfolio         - Upload portfolio item
```

#### Seller Endpoints
```
GET  /products          - List own products
POST /products          - Create product
PUT  /products/{id}     - Update product
DELETE /products/{id}   - Delete product
GET  /orders            - List orders
PUT  /orders/{id}       - Update order status
```

#### Admin Endpoints
```
GET  /admin/users       - List all users
PUT  /admin/users/{id}/verify - Verify user
GET  /admin/verification-queue - Pending verifications
GET  /admin/analytics   - Platform metrics
```

---

## Trust & Verification System

### Phone Verification (All Roles)
1. User enters phone during signup
2. Twilio/Pinpoint sends OTP
3. User verifies OTP
4. `phoneVerified: true` in profile

### ID Verification (Workers)
1. Worker uploads ID during signup
2. ID number hashed (SHA-256) for privacy
3. Admin reviews in verification queue
4. Admin approves/rejects
5. `idVerified: true` enables bidding

### Business Verification (Sellers)
1. Seller uploads business registration
2. Admin reviews documents
3. Admin approves/rejects
4. `businessVerified: true` enables selling

### Trust Scores
- **Initial**: 0 (unrated)
- **Range**: 0-5 stars
- **Calculation**: Average of all reviews
- **Components**:
  - Quality (1-5)
  - Communication (1-5)
  - Timeliness (1-5)
  - Professionalism (1-5)

---

## Deployment

### Prerequisites

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install SAM CLI
pip install aws-sam-cli

# Configure AWS credentials
aws configure
```

### Deploy Backend

```bash
# Deploy to dev environment
./deploy-aws-backend.sh dev

# Deploy to production
./deploy-aws-backend.sh prod
```

### Deploy Frontend

```bash
# Build React app
cd client && npm run build

# Deploy to S3
aws s3 sync dist/public/ s3://projectkhaya-frontend-1762772155/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id E4J3KAA9XDTHS \
  --paths "/*"
```

---

## Frontend Integration

### Install Amplify

```bash
cd client
npm install aws-amplify @aws-amplify/ui-react
```

### Configure Amplify

```typescript
// client/src/aws-config.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX',
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        phone: true
      }
    }
  },
  API: {
    REST: {
      ProjectKhayaAPI: {
        endpoint: 'https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/dev',
        region: 'us-east-1'
      }
    }
  }
});
```

### Update Auth Component

```typescript
// client/src/pages/Auth.tsx
import { signUp, signIn, confirmSignUp } from 'aws-amplify/auth';

// Buyer signup
const handleBuyerSignup = async () => {
  try {
    const { userId } = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          phone_number: phone,
          name,
          'custom:role': 'Buyer',
          'custom:location': JSON.stringify(location)
        }
      }
    });
    
    // Redirect to OTP verification
    setStep('verify');
  } catch (error) {
    console.error('Signup error:', error);
  }
};

// OTP verification
const handleVerifyOTP = async () => {
  try {
    await confirmSignUp({
      username: email,
      confirmationCode: otp
    });
    
    // Sign in automatically
    const { isSignedIn } = await signIn({
      username: email,
      password
    });
    
    if (isSignedIn) {
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Verification error:', error);
  }
};
```

---

## Cost Estimation (MVP - 1000 active users)

### Monthly Costs

| Service | Usage | Cost |
|---------|-------|------|
| **Cognito** | 1000 MAU | Free (under 50K) |
| **DynamoDB** | 10M reads, 2M writes | $5-10 |
| **Lambda** | 100K invocations | $0.20 |
| **API Gateway** | 100K requests | $0.35 |
| **S3** | 10GB storage, 50GB transfer | $2 |
| **CloudFront** | 100GB transfer | $8.50 |
| **SES** | 10K emails | Free (under 62K) |
| **Twilio** | 1K SMS (OTP) | R500 (~$30) |
| **Total** | | **~$46/month** |

### Scaling Costs (10K users)

- DynamoDB: $50-100/month
- Lambda: $2/month
- API Gateway: $3.50/month
- S3/CloudFront: $50/month
- Twilio: R5000 (~$300/month)
- **Total**: ~$405/month

---

## Migration from Current System

### Phase 1: Backend Setup (Week 1)
- [x] Design Cognito User Pool
- [x] Design DynamoDB schema
- [x] Create Lambda functions
- [ ] Deploy infrastructure
- [ ] Test signup flows

### Phase 2: Frontend Integration (Week 2)
- [ ] Install Amplify
- [ ] Update Auth component
- [ ] Update API calls
- [ ] Test end-to-end

### Phase 3: Data Migration (Week 3)
- [ ] Export MySQL data
- [ ] Transform to DynamoDB format
- [ ] Import to DynamoDB
- [ ] Verify data integrity

### Phase 4: Feature Completion (Week 4)
- [ ] Implement bidding workflow
- [ ] Add trust/verification system
- [ ] Build admin dashboard
- [ ] Deploy to production

---

## Next Steps

1. **Deploy Backend**:
   ```bash
   ./deploy-aws-backend.sh dev
   ```

2. **Get API Endpoint**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name ProjectKhaya-dev \
     --query 'Stacks[0].Outputs'
   ```

3. **Update Frontend Config**:
   - Add Cognito User Pool ID
   - Add API Gateway endpoint
   - Test signup flows

4. **Test Complete Flow**:
   - Buyer signup → Email verify → Post job
   - Worker signup → ID verify → Bid on job
   - Seller signup → Business verify → List product

---

## Support

For questions or issues:
- Architecture: See `dynamodb-schema.md`
- Deployment: See `deploy-aws-backend.sh`
- Frontend: See `client/src/aws-config.ts`

**Built with Ubuntu** 🏠
