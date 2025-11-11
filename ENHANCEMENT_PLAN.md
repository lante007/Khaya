# Project Khaya - Enhancement Implementation Plan

## Overview
Enhance Project Khaya with AI, behavioral science, and autonomous features while keeping the current landing page intact.

## Phase 1: Enhanced Database Schema (Week 1-2)

### New Tables

```sql
-- Milestones for Project Pulse
CREATE TABLE milestones_enhanced (
  id INT PRIMARY KEY,
  job_id INT,
  title VARCHAR(255),
  amount DECIMAL(10,2),
  status ENUM('pending', 'in_progress', 'proof_submitted', 'completed'),
  proof_photo_url VARCHAR(500),
  gps_coordinates VARCHAR(100),
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  auto_release_at TIMESTAMP
);

-- Trust Graph
CREATE TABLE trust_scores (
  user_id INT PRIMARY KEY,
  score DECIMAL(5,2),
  vouches_received INT,
  vouches_given INT,
  badges JSON,
  last_calculated TIMESTAMP
);

-- Material Bundles
CREATE TABLE material_bundles (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  items JSON,
  total_price DECIMAL(10,2),
  delivery_route JSON,
  savings DECIMAL(10,2)
);

-- Price Alerts
CREATE TABLE price_alerts (
  id INT PRIMARY KEY,
  user_id INT,
  material_id INT,
  target_price DECIMAL(10,2),
  active BOOLEAN,
  last_triggered TIMESTAMP
);

-- Referrals Enhanced
CREATE TABLE referrals_enhanced (
  id INT PRIMARY KEY,
  referrer_id INT,
  referee_id INT,
  status ENUM('pending', 'signed_up', 'first_hire', 'paid'),
  reward_amount DECIMAL(10,2),
  tier VARCHAR(50),
  created_at TIMESTAMP
);
```

## Phase 2: AI Integration Architecture (Week 3-4)

### Components

1. **AI Matcher (TensorFlow.js)**
```typescript
// client/src/lib/ai-matcher.ts
import * as tf from '@tensorflow/tfjs';

export class AIWhisperer {
  async matchWorkers(jobDescription: string, budget: number) {
    // Semantic matching using embeddings
    const embedding = await this.getEmbedding(jobDescription);
    const matches = await this.findSimilar(embedding, budget);
    return matches.slice(0, 3); // Top 3 matches
  }
  
  explainMatch(worker: Worker, job: Job) {
    return {
      reason: "Similar past jobs",
      confidence: 0.85,
      factors: ["location", "budget_match", "reviews"]
    };
  }
}
```

2. **Predictive Analytics**
```typescript
// server/ai/predictions.ts
export async function predictDelay(jobId: number) {
  const history = await getJobHistory(jobId);
  const features = extractFeatures(history);
  const prediction = model.predict(features);
  return prediction > 0.7 ? "high_risk" : "low_risk";
}
```

## Phase 3: Behavioral Nudges System (Week 5-6)

### Nudge Engine

```typescript
// server/behavioral/nudges.ts
export const nudges = {
  scarcity: (item: Material) => ({
    message: `Only ${item.stock} left! 15 locals bought this week`,
    trigger: item.stock < 10,
    type: "scarcity"
  }),
  
  socialProof: (worker: Worker) => ({
    message: `Hired by ${worker.hireCount} neighbors in Estcourt`,
    trigger: worker.hireCount > 5,
    type: "social_proof"
  }),
  
  reciprocity: (user: User) => ({
    message: "Share your success story, unlock R50 credit",
    trigger: user.completedJobs > 0 && !user.hasShared,
    type: "reciprocity"
  })
};
```

## Phase 4: Autonomous Workflows (Week 7-8)

### Event-Driven Architecture

```typescript
// aws-lambda/milestone-handler.ts
export async function handleMilestoneProof(event: DynamoDBStreamEvent) {
  for (const record of event.Records) {
    if (record.eventName === 'MODIFY') {
      const milestone = record.dynamodb.NewImage;
      
      if (milestone.proof_photo_url && milestone.gps_coordinates) {
        // Auto-verify and release escrow
        await verifyProof(milestone);
        await releaseEscrow(milestone.id);
        await notifyBuyer(milestone.job_id);
      }
    }
  }
}
```

## Phase 5: Innovative Features

### 1. Project Pulse
- Real-time milestone tracking
- GPS-verified proof of work
- Auto-escrow release
- Delay predictions

### 2. Material Run
- Multi-seller cart optimization
- Route planning
- Delivery consolidation
- Savings calculator

### 3. Trust Graph
- ML-based scoring
- Vouch network
- Scout verification
- Badge system

### 4. Price Watch
- Real-time alerts
- Trend analysis
- WhatsApp notifications

### 5. AI Whisperer
- Voice search (Zulu/English)
- Semantic matching
- Explainable recommendations

### 6. Referral Vortex
- Gamified tiers
- Auto-rewards
- Viral sharing

## Implementation Priority

**Month 1: Foundation**
- Enhanced database schema
- Basic AI matcher
- Behavioral nudges framework

**Month 2: Core Features**
- Project Pulse
- Trust Graph
- Material Run

**Month 3: Advanced**
- AI Whisperer
- Price Watch
- Referral Vortex

**Month 4: Polish & Launch**
- Testing
- Optimization
- Estcourt pilot

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Iterate based on feedback

---

**Status:** Ready for implementation
**Landing Page:** Unchanged (already deployed)
**Backend:** Ready for enhancement
