# DynamoDB Single-Table Design for Project Khaya

## Table: `ProjectKhaya`

### Primary Key Structure
- **PK (Partition Key)**: Entity identifier
- **SK (Sort Key)**: Entity type or relationship

### Global Secondary Indexes (GSI)

#### GSI1: Role & Location Search
- **GSI1PK**: `ROLE#{role}`
- **GSI1SK**: `LOCATION#{location}#USER#{userId}`
- **Use**: Find Workers/Sellers by location

#### GSI2: Status & Timestamp
- **GSI2PK**: `STATUS#{status}`
- **GSI2SK**: `TIMESTAMP#{timestamp}`
- **Use**: Query active projects, pending bids, recent orders

#### GSI3: Category Search
- **GSI3PK**: `CATEGORY#{category}`
- **GSI3SK**: `PRICE#{price}#PRODUCT#{productId}`
- **Use**: Browse products by category, sorted by price

---

## Access Patterns & Data Models

### 1. User Profiles

#### Buyer Profile
```json
{
  "PK": "USER#buyer123",
  "SK": "PROFILE",
  "entityType": "BUYER",
  "userId": "buyer123",
  "cognitoSub": "cognito-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+27812345678",
  "location": {
    "address": "123 Main St, Estcourt, KZN",
    "lat": -29.0089,
    "lng": 29.8728,
    "city": "Estcourt",
    "province": "KZN"
  },
  "verified": true,
  "phoneVerified": true,
  "trustScore": 4.5,
  "totalProjects": 12,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-20T15:30:00Z",
  "GSI1PK": "ROLE#BUYER",
  "GSI1SK": "LOCATION#Estcourt#USER#buyer123"
}
```

#### Worker Profile
```json
{
  "PK": "USER#worker456",
  "SK": "PROFILE",
  "entityType": "WORKER",
  "userId": "worker456",
  "cognitoSub": "cognito-uuid",
  "name": "Mike Builder",
  "email": "mike@example.com",
  "phone": "+27823456789",
  "location": {
    "address": "456 Oak Ave, Estcourt, KZN",
    "lat": -29.0100,
    "lng": 29.8750,
    "city": "Estcourt",
    "province": "KZN"
  },
  "skills": ["bricklaying", "plastering", "painting"],
  "bio": "10 years experience in residential construction",
  "idNumber": "hashed-id-number",
  "verified": true,
  "phoneVerified": true,
  "idVerified": true,
  "trustScore": 4.8,
  "totalJobs": 45,
  "completionRate": 0.96,
  "avgResponseTime": 120,
  "portfolio": [
    "s3://khaya-portfolios/worker456/project1.jpg",
    "s3://khaya-portfolios/worker456/project2.jpg"
  ],
  "createdAt": "2024-06-10T08:00:00Z",
  "updatedAt": "2025-01-20T12:00:00Z",
  "GSI1PK": "ROLE#WORKER",
  "GSI1SK": "LOCATION#Estcourt#USER#worker456"
}
```

#### Seller Profile
```json
{
  "PK": "USER#seller789",
  "SK": "PROFILE",
  "entityType": "SELLER",
  "userId": "seller789",
  "cognitoSub": "cognito-uuid",
  "businessName": "Estcourt Building Supplies",
  "businessType": "Supplier",
  "contactName": "Sarah Smith",
  "email": "sarah@ebs.co.za",
  "phone": "+27834567890",
  "location": {
    "address": "789 Industrial Rd, Estcourt, KZN",
    "lat": -29.0050,
    "lng": 29.8800,
    "city": "Estcourt",
    "province": "KZN"
  },
  "businessReg": "2023/123456/07",
  "deliveryOptions": {
    "canDeliver": true,
    "deliveryRadius": 50,
    "freeDeliveryOver": 5000
  },
  "verified": true,
  "phoneVerified": true,
  "businessVerified": true,
  "trustScore": 4.6,
  "totalOrders": 230,
  "createdAt": "2024-03-20T09:00:00Z",
  "updatedAt": "2025-01-20T14:00:00Z",
  "GSI1PK": "ROLE#SELLER",
  "GSI1SK": "LOCATION#Estcourt#USER#seller789"
}
```

---

### 2. Projects (Jobs Posted by Buyers)

#### Project Record
```json
{
  "PK": "PROJECT#proj001",
  "SK": "METADATA",
  "entityType": "PROJECT",
  "projectId": "proj001",
  "buyerId": "buyer123",
  "title": "Build 3-bedroom house foundation",
  "description": "Need experienced bricklayer for foundation work...",
  "category": "Construction",
  "skills": ["bricklaying", "foundation"],
  "location": {
    "address": "Plot 45, Estcourt",
    "lat": -29.0120,
    "lng": 29.8700
  },
  "budget": {
    "min": 50000,
    "max": 80000,
    "currency": "ZAR"
  },
  "timeline": {
    "startDate": "2025-02-01",
    "endDate": "2025-03-15",
    "flexible": true
  },
  "status": "OPEN",
  "bidCount": 5,
  "acceptedBidId": null,
  "createdAt": "2025-01-20T10:00:00Z",
  "updatedAt": "2025-01-21T08:30:00Z",
  "GSI2PK": "STATUS#OPEN",
  "GSI2SK": "TIMESTAMP#2025-01-20T10:00:00Z"
}
```

---

### 3. Bids (Worker Quotes on Projects)

#### Bid Record
```json
{
  "PK": "PROJECT#proj001",
  "SK": "BID#worker456",
  "entityType": "BID",
  "bidId": "bid123",
  "projectId": "proj001",
  "workerId": "worker456",
  "workerName": "Mike Builder",
  "workerTrustScore": 4.8,
  "quote": 65000,
  "currency": "ZAR",
  "timeline": {
    "startDate": "2025-02-05",
    "duration": 35,
    "unit": "days"
  },
  "proposal": "I have 10 years experience with foundations...",
  "status": "PENDING",
  "createdAt": "2025-01-20T14:00:00Z",
  "updatedAt": "2025-01-20T14:00:00Z",
  "GSI2PK": "STATUS#PENDING",
  "GSI2SK": "TIMESTAMP#2025-01-20T14:00:00Z"
}
```

#### Query Pattern: Get all bids for a project
```
Query: PK = "PROJECT#proj001" AND SK begins_with "BID#"
```

---

### 4. Products (Seller Catalog)

#### Product Record
```json
{
  "PK": "SELLER#seller789",
  "SK": "PRODUCT#prod456",
  "entityType": "PRODUCT",
  "productId": "prod456",
  "sellerId": "seller789",
  "sellerName": "Estcourt Building Supplies",
  "title": "Red Clay Bricks",
  "description": "High-quality fired clay bricks...",
  "category": "Bricks",
  "subcategory": "Clay Bricks",
  "price": 5.50,
  "unit": "per brick",
  "currency": "ZAR",
  "stock": 10000,
  "minOrder": 100,
  "images": [
    "s3://khaya-products/seller789/prod456-1.jpg",
    "s3://khaya-products/seller789/prod456-2.jpg"
  ],
  "specifications": {
    "dimensions": "220x110x75mm",
    "weight": "3.2kg",
    "color": "Red"
  },
  "delivery": {
    "available": true,
    "cost": 500,
    "freeOver": 5000
  },
  "status": "ACTIVE",
  "createdAt": "2024-08-15T10:00:00Z",
  "updatedAt": "2025-01-20T09:00:00Z",
  "GSI3PK": "CATEGORY#Bricks",
  "GSI3SK": "PRICE#0005.50#PRODUCT#prod456"
}
```

#### Query Pattern: Browse products by category
```
Query GSI3: GSI3PK = "CATEGORY#Bricks" (sorted by price)
```

---

### 5. Orders (Buyer Purchases from Sellers)

#### Order Record
```json
{
  "PK": "ORDER#order789",
  "SK": "METADATA",
  "entityType": "ORDER",
  "orderId": "order789",
  "buyerId": "buyer123",
  "sellerId": "seller789",
  "items": [
    {
      "productId": "prod456",
      "title": "Red Clay Bricks",
      "quantity": 5000,
      "unitPrice": 5.50,
      "subtotal": 27500
    }
  ],
  "totals": {
    "subtotal": 27500,
    "delivery": 500,
    "tax": 4200,
    "total": 32200,
    "currency": "ZAR"
  },
  "delivery": {
    "address": "123 Main St, Estcourt",
    "date": "2025-02-10",
    "instructions": "Call on arrival"
  },
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "createdAt": "2025-01-21T11:00:00Z",
  "updatedAt": "2025-01-21T11:00:00Z",
  "GSI2PK": "STATUS#PENDING",
  "GSI2SK": "TIMESTAMP#2025-01-21T11:00:00Z"
}
```

---

### 6. Reviews (Trust System)

#### Review Record
```json
{
  "PK": "USER#worker456",
  "SK": "REVIEW#proj001#buyer123",
  "entityType": "REVIEW",
  "reviewId": "rev123",
  "reviewerId": "buyer123",
  "reviewerName": "John Doe",
  "revieweeId": "worker456",
  "revieweeType": "WORKER",
  "projectId": "proj001",
  "rating": 5,
  "comment": "Excellent work, completed on time and within budget",
  "aspects": {
    "quality": 5,
    "communication": 5,
    "timeliness": 5,
    "professionalism": 5
  },
  "createdAt": "2025-03-20T16:00:00Z"
}
```

#### Query Pattern: Get all reviews for a user
```
Query: PK = "USER#worker456" AND SK begins_with "REVIEW#"
```

---

### 7. Messages (Communication)

#### Message Record
```json
{
  "PK": "CONVERSATION#buyer123#worker456",
  "SK": "MESSAGE#2025-01-21T12:30:00Z",
  "entityType": "MESSAGE",
  "messageId": "msg456",
  "conversationId": "buyer123#worker456",
  "senderId": "buyer123",
  "recipientId": "worker456",
  "projectId": "proj001",
  "content": "Can you start on February 5th?",
  "read": false,
  "createdAt": "2025-01-21T12:30:00Z"
}
```

---

## Summary of Access Patterns

| Pattern | Query |
|---------|-------|
| Get user profile | `PK = USER#{userId}, SK = PROFILE` |
| Get worker by location | `GSI1: GSI1PK = ROLE#WORKER, GSI1SK begins_with LOCATION#{city}` |
| Get all projects | `GSI2: GSI2PK = STATUS#OPEN` |
| Get project bids | `PK = PROJECT#{projectId}, SK begins_with BID#` |
| Get seller products | `PK = SELLER#{sellerId}, SK begins_with PRODUCT#` |
| Browse products by category | `GSI3: GSI3PK = CATEGORY#{category}` |
| Get user reviews | `PK = USER#{userId}, SK begins_with REVIEW#` |
| Get conversation messages | `PK = CONVERSATION#{user1}#{user2}, SK begins_with MESSAGE#` |

---

## Capacity Planning

### Initial Provisioning (On-Demand Mode)
- **Read**: Auto-scales based on demand
- **Write**: Auto-scales based on demand
- **Cost**: Pay per request (~$1.25 per million writes, $0.25 per million reads)

### Estimated Monthly Costs (1000 active users)
- **Storage**: 1GB = $0.25/month
- **Reads**: 10M requests = $2.50/month
- **Writes**: 2M requests = $2.50/month
- **Total**: ~$5-10/month for MVP

