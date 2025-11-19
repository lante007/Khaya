# Auto-Updating Résumé System - Implementation Plan

## Phase 1: MVP (Immediate - 2-3 days)
**Goal:** Basic résumé tracking with strength score and trust badges

### Backend
1. **Create Resume Router** (`backend/src/routers/resume.router.ts`)
   - `getWorkerResume` - Fetch worker's résumé
   - `calculateStrength` - Calculate strength score
   - `updateResumeEntry` - Add completed job to résumé
   - `getBadges` - Get earned badges

2. **Add Resume Library** (`backend/src/lib/resume.ts`)
   ```typescript
   // Strength calculation
   strength = Math.min(100, 
     verified_jobs * 10 + 
     proof_photos * 5 + 
     avg_rating * 20
   );
   
   // Tier assignment
   if (strength >= 90) tier = 'Platinum';
   else if (strength >= 70) tier = 'Gold';
   else if (strength >= 40) tier = 'Silver';
   else tier = 'Bronze';
   
   // Badge logic
   badges = {
     'Ubaba Reliable': jobs >= 5 && rating >= 4.5,
     'Isisebenzi Esihle': jobs >= 10,
     'Iqhawe': jobs >= 25,
     'Ubuntu Master': jobs >= 10 && rating >= 4.8
   };
   ```

3. **Update Jobs Router**
   - Add résumé update trigger on job completion
   - Store GPS coordinates with proof photos
   - Auto-infer skills from job description

4. **DynamoDB Schema**
   ```
   PK: WORKER#{workerId}
   SK: RESUME
   
   Attributes:
   - workerId
   - strength (0-100)
   - tier (Bronze/Silver/Gold/Platinum)
   - badges: []
   - totalJobs
   - avgRating
   - skills: []
   - projects: [
       {
         jobId,
         title,
         description,
         location,
         completedAt,
         rating,
         proofPhotos: [],
         gpsCoords: {lat, lon}
       }
     ]
   ```

### Frontend
1. **Components**
   - `StrengthMeter.tsx` - Visual strength gauge (0-100)
   - `TrustBadges.tsx` - Display earned badges
   - `ResumeTimeline.tsx` - Chronological job history
   - `ResumeStats.tsx` - Key metrics dashboard

2. **Pages**
   - Update `WorkerDetail.tsx` to show résumé
   - Update `Profile.tsx` to show own résumé
   - Add résumé preview to onboarding

### Integration Points
- ✅ Job completion → Update résumé
- ✅ Photo upload → Increment proof count
- ✅ Rating submission → Recalculate strength
- ✅ Payment release → Mark job verified

---

## Phase 2: Enhanced Features (1 week)
**Goal:** Behavioral nudges, skill inference, offline support

### Backend
1. **Nudge System** (`backend/src/lib/nudges.ts`)
   - 20 nudge variants (Zulu + English)
   - SMS via Twilio
   - In-app notifications
   - Trigger conditions:
     - Job completion
     - Tier upgrade
     - Wizard progress
     - Inactivity (7 days)

2. **Skill Inference**
   ```typescript
   const skillMap = {
     plumb: 'Plumbing',
     electric: 'Electrical',
     paint: 'Painting',
     roof: 'Roofing',
     fence: 'Fencing',
     tile: 'Tiling',
     brick: 'Bricklaying',
     weld: 'Welding',
     carpenter: 'Carpentry'
   };
   
   // Extract from job title/description
   function inferSkills(text: string): string[] {
     const lower = text.toLowerCase();
     return Object.entries(skillMap)
       .filter(([key]) => lower.includes(key))
       .map(([, skill]) => skill);
   }
   ```

3. **GPS Validation**
   ```typescript
   // KZN bounds
   const KZN_BOUNDS = {
     lat: { min: -30.5, max: -28.5 },
     lon: { min: 29.0, max: 31.5 }
   };
   
   function isValidKZNLocation(lat: number, lon: number): boolean {
     return lat >= KZN_BOUNDS.lat.min && 
            lat <= KZN_BOUNDS.lat.max &&
            lon >= KZN_BOUNDS.lon.min && 
            lon <= KZN_BOUNDS.lon.max;
   }
   ```

### Frontend
1. **PWA Offline Support**
   - Service worker for offline access
   - IndexedDB for draft résumés
   - Background sync for updates

2. **Zulu Translation**
   - i18n setup
   - Zulu strings for all UI
   - Language toggle

---

## Phase 3: Advanced Features (2 weeks)
**Goal:** Paystack webhooks, EventBridge automation, full testing

### Backend
1. **Paystack Webhook Handler**
   ```typescript
   // backend/src/routers/webhooks.router.ts
   export const webhooksRouter = router({
     paystackWebhook: publicProcedure
       .input(z.object({
         event: z.string(),
         data: z.any()
       }))
       .mutation(async ({ input }) => {
         // Verify signature
         // Handle events:
         // - charge.success (30% deposit)
         // - transfer.success (70% release)
         // - Update résumé atomically
       })
   });
   ```

2. **EventBridge Rules**
   - Daily strength recalculation
   - Weekly inactive worker nudges
   - Monthly tier review

3. **Atomic Updates**
   ```typescript
   // DynamoDB transactions
   await dynamodb.transactWrite({
     TransactItems: [
       {
         Update: {
           TableName: 'khaya-prod',
           Key: { PK: `WORKER#${workerId}`, SK: 'RESUME' },
           UpdateExpression: 'SET strength = :s, tier = :t',
           ConditionExpression: 'attribute_exists(PK)'
         }
       }
     ]
   });
   ```

### Testing
1. **Unit Tests** (Jest)
   - Strength calculation
   - Badge logic
   - Skill inference
   - GPS validation

2. **Integration Tests**
   - Job completion → Résumé update
   - Payment → Verification
   - Photo upload → Proof count

3. **E2E Tests** (Playwright)
   - Worker onboarding flow
   - Job completion flow
   - Résumé viewing

---

## Current Status: Phase 1 MVP

### What Exists Already
✅ DynamoDB table (`khaya-prod`)
✅ Jobs router with completion flow
✅ Payments router with escrow
✅ User profiles with ratings
✅ Photo upload to S3
✅ Worker onboarding wizard

### What Needs to Be Built
🔨 Resume router
🔨 Strength calculation logic
🔨 Resume timeline component
🔨 Strength meter component
🔨 Trust badges component
🔨 Auto-update triggers

---

## Implementation Priority

### Today (High Priority)
1. Create resume router with basic CRUD
2. Add strength calculation function
3. Create StrengthMeter component
4. Create TrustBadges component
5. Update job completion to trigger résumé update

### This Week (Medium Priority)
6. Create ResumeTimeline component
7. Add résumé to WorkerDetail page
8. Add skill inference
9. Add GPS validation
10. Create nudge system

### Next Week (Lower Priority)
11. Paystack webhook integration
12. EventBridge automation
13. PWA offline support
14. Zulu translation
15. Comprehensive testing

---

## Cost Estimate

### MVP (Phase 1)
- Development: 2-3 days
- AWS costs: +$5/month (DynamoDB reads/writes)
- No additional SMS costs

### Full System (Phase 3)
- Development: 2-3 weeks
- AWS costs: +$15/month (EventBridge, more Lambda invocations)
- SMS costs: ~R50/month (nudges for 100 workers)

---

## Success Metrics (MVP)

- ✅ 100% of completed jobs appear in résumé
- ✅ Strength score updates within 1 minute
- ✅ Badges display correctly
- ✅ Workers can view their résumé
- ✅ Customers can view worker résumés

---

## Ubuntu Design Principles

All code will include:
- Encouraging comments: "// Yebo! Worker strength growing 💪"
- Zulu terms in UI: "Sawubona!", "Siyabonga!"
- Celebration animations on tier upgrades
- Transparent strength calculation
- Trust-first design

---

## Next Steps

**Immediate Action:**
1. Create `backend/src/routers/resume.router.ts`
2. Create `backend/src/lib/resume.ts`
3. Create `client/src/components/StrengthMeter.tsx`
4. Create `client/src/components/TrustBadges.tsx`
5. Update `jobs.router.ts` to trigger résumé updates

**Ready to proceed with Phase 1 MVP implementation?**
