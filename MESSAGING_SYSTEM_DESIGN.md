# 💬 Messaging System Architecture

**Date:** November 14, 2025  
**Approach:** Polling-based (Simple, Serverless-friendly)  
**Future:** WebSocket upgrade path

---

## 🎯 Design Goals

### MVP Requirements
- ✅ Simple and reliable
- ✅ Serverless-compatible
- ✅ No additional infrastructure
- ✅ Works on mobile
- ✅ File sharing support

### Non-Goals (Post-MVP)
- Real-time typing indicators
- Read receipts
- Message reactions
- Voice messages
- Video calls

---

## 🏗️ Architecture

### Polling-Based Approach

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │         │   API        │         │  DynamoDB   │
│  (Browser)  │         │  (Lambda)    │         │             │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │  Poll every 3s        │                        │
       ├──────────────────────>│                        │
       │                       │  Query new messages    │
       │                       ├───────────────────────>│
       │                       │<───────────────────────┤
       │<──────────────────────┤                        │
       │                       │                        │
       │  Send message         │                        │
       ├──────────────────────>│                        │
       │                       │  Store message         │
       │                       ├───────────────────────>│
       │                       │<───────────────────────┤
       │<──────────────────────┤                        │
```

### Why Polling?
1. **Simple** - No WebSocket infrastructure needed
2. **Serverless** - Works with Lambda
3. **Reliable** - No connection drops
4. **Mobile-friendly** - Works on any network
5. **Cost-effective** - Pay per request

### Polling Strategy
- Poll every 3 seconds when chat is open
- Stop polling when chat is closed
- Exponential backoff on errors
- Batch fetch (last 50 messages)

---

## 📊 Data Model

### Message Schema
```typescript
interface Message {
  id: string;                    // message_timestamp_nanoid
  conversationId: string;        // conv_userId1_userId2
  senderId: string;              // User ID
  receiverId: string;            // User ID
  content: string;               // Message text
  type: 'text' | 'image' | 'file'; // Message type
  fileUrl?: string;              // S3 URL for files
  fileName?: string;             // Original filename
  fileSize?: number;             // File size in bytes
  status: 'sent' | 'delivered' | 'read'; // Message status
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

### Conversation Schema
```typescript
interface Conversation {
  id: string;                    // conv_userId1_userId2
  participants: string[];        // [userId1, userId2]
  jobId?: number;                // Related job
  lastMessage?: string;          // Preview text
  lastMessageAt?: string;        // Last activity
  unreadCount: {                 // Per user
    [userId: string]: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### DynamoDB Structure
```
PK: CONVERSATION#conv_id
SK: CONVERSATION#conv_id
- Conversation metadata

PK: CONVERSATION#conv_id
SK: MESSAGE#timestamp#msg_id
- Individual messages

PK: USER#user_id
SK: CONVERSATION#conv_id
- User's conversations (GSI)
```

---

## 🔄 Message Flow

### Send Message
```
1. User types message
2. Click send
3. POST /messages/send
4. Validate sender
5. Store in DynamoDB
6. Update conversation metadata
7. Return success
8. UI shows message immediately (optimistic)
```

### Receive Messages
```
1. Poll every 3 seconds
2. GET /messages/list?conversationId=xxx&since=timestamp
3. Fetch messages newer than last seen
4. Return new messages
5. UI appends to chat
6. Mark as delivered
```

### File Upload
```
1. User selects file
2. Upload to S3 (presigned URL)
3. Send message with fileUrl
4. Receiver downloads from S3
```

---

## 🎨 UI Components

### Chat List
```
┌─────────────────────────────────┐
│  Messages                    🔍 │
├─────────────────────────────────┤
│  👤 John Smith              2m  │
│  Great! I'll start tomorrow     │
│  ● 1                            │
├─────────────────────────────────┤
│  👤 Jane Doe                1h  │
│  When can you come?             │
├─────────────────────────────────┤
│  👤 Mike Worker             2d  │
│  Job completed ✓                │
└─────────────────────────────────┘
```

### Chat Window
```
┌─────────────────────────────────┐
│  ← John Smith            Job #42│
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────┐            │
│  │ Hi! I can start │  You  10:30│
│  │ tomorrow        │            │
│  └─────────────────┘            │
│                                 │
│            ┌─────────────────┐  │
│  John 10:32│ Great! What     │  │
│            │ time?           │  │
│            └─────────────────┘  │
│                                 │
│  ┌─────────────────┐            │
│  │ 8 AM works?     │  You  10:33│
│  └─────────────────┘            │
│                                 │
├─────────────────────────────────┤
│  📎  Type a message...     Send │
└─────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Phase 1: Basic Messaging (Day 1)
- [x] Design architecture
- [ ] Create message service
- [ ] Add database functions
- [ ] Create API endpoints
- [ ] Build chat UI

### Phase 2: File Sharing (Day 2)
- [ ] S3 presigned URLs
- [ ] File upload component
- [ ] Image preview
- [ ] File download

### Phase 3: Polish (Day 3)
- [ ] Unread counts
- [ ] Message status
- [ ] Error handling
- [ ] Mobile optimization

---

## 📝 API Endpoints

### Messages Router
```typescript
messages.send              // Send message
messages.list              // Get messages
messages.getConversations  // Get user's chats
messages.markAsRead        // Mark messages read
messages.uploadFile        // Get S3 upload URL
```

### Endpoint Details

#### Send Message
```typescript
POST /messages/send
{
  receiverId: string,
  content: string,
  type: 'text' | 'image' | 'file',
  fileUrl?: string,
  jobId?: number
}

Response:
{
  message: Message,
  conversationId: string
}
```

#### List Messages
```typescript
GET /messages/list?conversationId=xxx&since=timestamp&limit=50

Response:
{
  messages: Message[],
  hasMore: boolean
}
```

#### Get Conversations
```typescript
GET /messages/conversations

Response:
{
  conversations: Conversation[]
}
```

---

## 🔒 Security

### Access Control
- ✅ Users can only see their own conversations
- ✅ Users can only send to job participants
- ✅ File URLs are presigned (temporary)
- ✅ Message content validation

### Data Privacy
- ✅ Messages encrypted in transit (HTTPS)
- ✅ No message indexing/search (privacy)
- ✅ Files stored securely in S3
- ✅ Automatic file expiry (optional)

---

## 📊 Performance

### Polling Optimization
```typescript
// Adaptive polling
const POLL_INTERVALS = {
  active: 3000,      // 3s when chat open
  background: 10000, // 10s when tab inactive
  idle: 30000,       // 30s after 5 min idle
};
```

### Caching
- Cache last 50 messages locally
- Only fetch new messages
- Optimistic UI updates
- Background sync

### Limits
- Max message length: 2000 characters
- Max file size: 10 MB
- Max messages per request: 50
- Rate limit: 10 messages/minute

---

## 💰 Cost Estimate

### DynamoDB
```
Assumptions:
- 1000 messages/day
- 100 conversations
- 30 days retention

Storage: ~1 GB = $0.25/month
Reads: 100K/month = $0.25/month
Writes: 30K/month = $0.38/month

Total: ~$1/month
```

### S3 (Files)
```
Assumptions:
- 100 files/day
- 1 MB average
- 30 days retention

Storage: 3 GB = $0.07/month
Requests: 3K = $0.02/month

Total: ~$0.10/month
```

### Lambda
```
Polling requests: 1M/month
Message sends: 30K/month

Total: ~$2/month
```

**Total Messaging Cost: ~$3/month** 🎉

---

## 🚀 Future Enhancements

### Phase 2 (Post-MVP)
1. **WebSocket Upgrade**
   - Real-time messages
   - Typing indicators
   - Online status

2. **Rich Features**
   - Message reactions
   - Reply/quote
   - Message editing
   - Message deletion

3. **Advanced**
   - Group chats
   - Voice messages
   - Video calls
   - Screen sharing

### Migration Path
```
Polling → WebSocket
- Keep same data model
- Add WebSocket layer
- Fallback to polling
- Gradual rollout
```

---

## 🧪 Testing Strategy

### Unit Tests
- Message validation
- Conversation creation
- File upload logic
- Access control

### Integration Tests
- Send/receive flow
- File upload/download
- Polling mechanism
- Error handling

### E2E Tests
- Full chat conversation
- File sharing
- Multiple users
- Mobile devices

---

## 📋 Implementation Checklist

### Backend
- [ ] Message service
- [ ] Database functions
- [ ] API endpoints
- [ ] File upload (S3)
- [ ] Access control

### Frontend
- [ ] Chat list component
- [ ] Chat window component
- [ ] Message input
- [ ] File upload UI
- [ ] Polling logic

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests

### Deployment
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test in production
- [ ] Monitor performance

---

## ✅ Decision Summary

**Chosen Approach:** Polling-based messaging

**Rationale:**
1. Simple to implement
2. Serverless-compatible
3. No additional infrastructure
4. Reliable and predictable
5. Easy to upgrade later

**Trade-offs:**
- Not truly real-time (3s delay)
- More API calls than WebSocket
- No typing indicators (MVP)

**Acceptable because:**
- 3s delay is fine for job coordination
- Cost is still very low (~$3/month)
- Can upgrade to WebSocket post-MVP
- Simpler = faster to market

---

**Status:** ✅ Architecture Complete  
**Next:** Implement message service  
**Timeline:** 3 days to full implementation
