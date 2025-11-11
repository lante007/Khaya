# Project Khaya - Innovative Features Implementation

## 1. Project Pulse - Milestone Heartbeat

### Overview
Real-time milestone tracking with GPS-verified proof and auto-escrow release.

### Implementation

**Database:** `milestones_enhanced` table (see schema-enhanced.ts)

**API Endpoints:**
```typescript
// server/routers/milestones.ts
export const milestoneRouter = router({
  create: protectedProcedure
    .input(z.object({
      jobId: z.number(),
      title: z.string(),
      amount: z.number(),
      dueDate: z.date()
    }))
    .mutation(async ({ input }) => {
      return await createMilestone(input);
    }),

  submitProof: protectedProcedure
    .input(z.object({
      milestoneId: z.number(),
      photoUrl: z.string(),
      gpsCoordinates: z.string()
    }))
    .mutation(async ({ input }) => {
      // Auto-verify and trigger escrow release
      await verifyProof(input);
      await scheduleEscrowRelease(input.milestoneId);
    })
});
```

**Auto-Escrow Logic:**
```typescript
// aws-lambda/milestone-handler.ts
export async function handleMilestoneProof(event) {
  const { milestoneId, photoUrl, gps } = event;
  
  // Verify GPS is within job location (100m radius)
  const isValid = await verifyLocation(gps, jobLocation);
  
  if (isValid) {
    // Schedule auto-release in 24h (dispute window)
    await scheduleRelease(milestoneId, Date.now() + 86400000);
    
    // Notify buyer
    await sendWhatsAppNotification(buyerId, {
      message: "Milestone completed! Review proof. Auto-release in 24h.",
      link: `/jobs/${jobId}/milestones/${milestoneId}`
    });
  }
}
```

---

## 2. Material Run - AI-Bundled Logistics

### Overview
Multi-seller cart with route optimization and delivery consolidation.

### Implementation

**Bundle Creation:**
```typescript
// server/ai/bundler.ts
export async function createOptimalBundle(items: CartItem[]) {
  // Group by seller
  const sellerGroups = groupBySeller(items);
  
  // Calculate optimal route
  const route = await optimizeRoute(sellerGroups.map(g => g.location));
  
  // Calculate savings
  const individualDelivery = sellerGroups.reduce((sum, g) => sum + g.deliveryFee, 0);
  const bundledDelivery = calculateBundledFee(route);
  const savings = individualDelivery - bundledDelivery;
  
  return {
    items,
    route,
    totalPrice: calculateTotal(items) + bundledDelivery,
    savings,
    deliveryDate: estimateDelivery(route)
  };
}
```

**Route Optimization:**
```typescript
// Simple nearest-neighbor algorithm
function optimizeRoute(locations: Location[]) {
  const route = [depot];
  let current = depot;
  const remaining = [...locations];
  
  while (remaining.length > 0) {
    const nearest = findNearest(current, remaining);
    route.push(nearest);
    current = nearest;
    remaining.splice(remaining.indexOf(nearest), 1);
  }
  
  return route;
}
```

---

## 3. Trust Graph - Vouch Network

### Overview
ML-based trust scoring with vouch network and Scout verification.

### Implementation

**Trust Score Calculation:**
```typescript
// server/trust/calculator.ts
export async function calculateTrustScore(userId: number) {
  const user = await getUser(userId);
  
  let score = 0;
  
  // Reviews (40%)
  const avgRating = user.reviews.reduce((sum, r) => sum + r.rating, 0) / user.reviews.length;
  score += (avgRating / 5) * 40;
  
  // Vouches (30%)
  const vouchScore = Math.min(user.vouchesReceived * 5, 30);
  score += vouchScore;
  
  // Completion rate (20%)
  score += (user.completionRate / 100) * 20;
  
  // Scout verification (10%)
  if (user.scoutVerified) score += 10;
  
  return Math.min(score, 100);
}
```

**Vouch System:**
```typescript
export async function vouchForUser(voucherId: number, voucheeId: number, message: string) {
  // Check if voucher has credibility
  const voucherScore = await getTrustScore(voucherId);
  if (voucherScore < 50) throw new Error("Insufficient trust to vouch");
  
  // Weight vouch by voucher's score
  const weight = voucherScore / 100;
  
  await createVouch({
    voucherId,
    voucheeId,
    message,
    weight
  });
  
  // Recalculate vouchee's score
  await recalculateTrustScore(voucheeId);
}
```

---

## 4. Price Watch - Intelligent Alerts

### Overview
Real-time price monitoring with trend analysis and WhatsApp notifications.

### Implementation

**Alert Creation:**
```typescript
export async function createPriceAlert(userId: number, materialId: number, targetPrice: number) {
  return await db.insert(priceAlerts).values({
    userId,
    materialId,
    targetPrice,
    active: true
  });
}
```

**Price Monitoring (EventBridge Cron):**
```typescript
// aws-lambda/price-monitor.ts
export async function checkPriceAlerts() {
  const alerts = await getActiveAlerts();
  
  for (const alert of alerts) {
    const currentPrice = await getCurrentPrice(alert.materialId);
    
    if (currentPrice <= alert.targetPrice) {
      // Trigger alert
      await sendWhatsAppAlert(alert.userId, {
        message: `Price drop! ${alert.materialName} now R${currentPrice} (was R${alert.targetPrice})`,
        link: `/materials/${alert.materialId}`
      });
      
      // Mark as triggered
      await markTriggered(alert.id);
    }
  }
}
```

---

## 5. AI Whisperer - Predictive Matcher

### Overview
Voice-enabled semantic matching with explainable recommendations.

### Implementation

**Voice Search:**
```typescript
// client/src/components/VoiceSearch.tsx
export function VoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  
  const startListening = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'zu-ZA'; // Zulu
    recognition.continuous = false;
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      const matches = await aiMatcher.matchWorkers(transcript, budget, location);
      setResults(matches);
    };
    
    recognition.start();
    setIsListening(true);
  };
  
  return (
    <Button onClick={startListening}>
      {isListening ? 'Listening...' : 'Tell me what you need'}
    </Button>
  );
}
```

**Explainable Results:**
```typescript
// Display match explanation
{matches.map(match => (
  <Card key={match.workerId}>
    <h3>{match.worker.name}</h3>
    <Badge>{match.confidence * 100}% match</Badge>
    <p>{match.explanation.reason}</p>
    <ul>
      {match.explanation.factors.map(factor => (
        <li key={factor}>{factor.replace('_', ' ')}</li>
      ))}
    </ul>
  </Card>
))}
```

---

## 6. Referral Vortex - Viral Loops

### Overview
Gamified referral system with tiered rewards and auto-payouts.

### Implementation

**Referral Link Generation:**
```typescript
export async function generateReferralLink(userId: number) {
  const code = nanoid(8);
  await db.insert(referralCodes).values({
    userId,
    code,
    active: true
  });
  
  return `https://projectkhaya.co.za/join?ref=${code}`;
}
```

**Tier System:**
```typescript
const TIERS = {
  bronze: { referrals: 0, reward: 50 },
  silver: { referrals: 5, reward: 250 },
  gold: { referrals: 15, reward: 750 },
  platinum: { referrals: 50, reward: 2500 }
};

export async function checkTierUpgrade(userId: number) {
  const referralCount = await getReferralCount(userId);
  const currentTier = await getUserTier(userId);
  
  for (const [tier, config] of Object.entries(TIERS)) {
    if (referralCount >= config.referrals && tier > currentTier) {
      await upgradeTier(userId, tier);
      await creditReward(userId, config.reward);
      await sendCongratulations(userId, tier, config.reward);
    }
  }
}
```

**Auto-Payout:**
```typescript
// Triggered when referee completes first hire
export async function processReferralReward(referralId: number) {
  const referral = await getReferral(referralId);
  
  if (referral.status === 'first_hire') {
    // Credit referrer
    await creditAccount(referral.referrerId, referral.rewardAmount);
    
    // Update status
    await updateReferral(referralId, { status: 'paid', paidAt: new Date() });
    
    // Check for tier upgrade
    await checkTierUpgrade(referral.referrerId);
  }
}
```

---

## Deployment Strategy

### Phase 1: Foundation (Week 1-2)
- Deploy enhanced database schema
- Set up EventBridge cron jobs
- Implement basic AI matcher

### Phase 2: Core Features (Week 3-4)
- Project Pulse with auto-escrow
- Trust Graph with vouch system
- Price Watch with alerts

### Phase 3: Advanced (Week 5-6)
- Material Run with route optimization
- AI Whisperer with voice search
- Referral Vortex with gamification

### Phase 4: Testing (Week 7-8)
- Estcourt pilot with 30 users
- A/B test nudges
- Optimize based on feedback

---

## Monitoring & Metrics

### Key Metrics
- **AI Matcher:** Match accuracy (target: 80%), time to hire (target: 40% faster)
- **Behavioral Nudges:** Conversion lift (target: 30%), opt-out rate (target: <5%)
- **Project Pulse:** Auto-release rate (target: 90%), dispute rate (target: <2%)
- **Trust Graph:** Score accuracy (target: 85%), vouch participation (target: 25%)
- **Referral Vortex:** Viral coefficient (target: 1.5), tier upgrade rate (target: 20%)

### Dashboards
- CloudWatch for Lambda metrics
- Custom analytics for user behavior
- A/B test results tracking

---

**Status:** Implementation ready
**Next:** Begin Phase 1 deployment
