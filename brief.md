# Project Khaya — Master Developer Brief
> Single source of truth for what exists, what's broken, what needs building, and how the system should work.
> June 2026 — Send this to the developer as the complete handoff.

---

## 0. Honest Assessment of Current State

Good work has been done. Core CRUD is real, AI is wired up, Paystack calls are live, messaging works, referrals work, stories work. The foundation is there.

However there are **5 critical problems** that make the platform unsafe to put real users on right now:

| # | Problem | Risk |
|---|---------|------|
| 1 | Admin panel has zero authentication | Anyone who finds `/admin` has full access |
| 2 | Auth writes to MySQL, business logic reads from DynamoDB — they are disconnected | Users who sign in cannot be found by the application |
| 3 | OTP is a stub — accepts any code, sends nothing | Anyone can log in as anyone |
| 4 | Paystack worker payout never fires — `releasePayment` updates DB status only, never calls `initiateTransfer` | Workers complete jobs and never get paid |
| 5 | `getJobById` uses an empty sort key — will fail on every single job detail page | Core user flow is broken |

Fix these 5 before anything else.

---

## 1. Critical Security & Stability Fixes (Before Any Users)

### 1.1 — Secure the Admin Panel IMMEDIATELY

**Current state:** All admin router procedures use `publicProcedure`. The hardcoded credentials (`admin@projectkhaya.co.za` / `Admin@2024Khaya`) are in the source code. No session is created. No middleware validates subsequent admin requests.

**Fix:**

```typescript
// server/_core/trpc.ts — adminProcedure already exists, use it
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx });
});

// server/routers.ts — replace ALL publicProcedure in the admin router with adminProcedure
// Every single admin.* procedure needs this change
```

**Also:** Remove the hardcoded password from source code. Move it to an env var `ADMIN_PASSWORD` and use `bcrypt.compare()`.

---

### 1.2 — Fix the MySQL ↔ DynamoDB Disconnect

**Current state:** Manus OAuth writes the authenticated user to **MySQL**. Every business logic call in `routers.ts` queries **DynamoDB** using `ctx.user.id`. A user who just signed in exists in MySQL but not in DynamoDB — all profile/job/bid queries return nothing.

**Fix — sync user to DynamoDB on every authenticated request:**

```typescript
// server/_core/context.ts — after authenticating via Manus OAuth:
const mysqlUser = await sdk.authenticateRequest(req);
if (mysqlUser) {
  // Ensure user exists in DynamoDB too
  await dynamoDB.upsertUser({
    id: mysqlUser.id.toString(),
    name: mysqlUser.name,
    email: mysqlUser.email,
    phone: mysqlUser.phone,
    role: mysqlUser.role,
    openId: mysqlUser.openId,
  });
}
```

**Alternatively:** Consolidate on a single database. For a KZN Midlands marketplace, DynamoDB adds complexity without proportional benefit at this scale. Consider migrating fully to MySQL (already schematised in `drizzle/schema.ts`) and dropping the DynamoDB layer. This is a larger refactor but eliminates the class of bugs permanently.

**Decision needed from business owner:** See Section 6, Question 1.

---

### 1.3 — Fix OTP Authentication

**Current state:** `auth.requestOTP` returns `{ success: true }` without sending anything. `auth.verifyOTP` accepts any code.

**Fix — wire up Twilio:**

```typescript
// server/routers.ts — auth.requestOTP
requestOTP: publicProcedure
  .input(z.object({ phone: z.string(), userType: z.enum(['buyer', 'worker', 'supplier']) }))
  .mutation(async ({ input }) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    
    // Store OTP in DB (add otp_codes table or use Redis/DynamoDB with TTL)
    await db.storeOTP(input.phone, otp, expiresAt);
    
    // Send via Twilio
    await twilio.messages.create({
      body: `Your Project Khaya code is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: input.phone,
    });
    
    return { success: true };
  }),

// auth.verifyOTP — validate against stored OTP, create session
verifyOTP: publicProcedure
  .input(z.object({ phone: z.string(), otp: z.string(), userType: z.enum(['buyer', 'worker', 'supplier']) }))
  .mutation(async ({ input, ctx }) => {
    const stored = await db.getOTP(input.phone);
    if (!stored || stored.code !== input.otp || stored.expiresAt < new Date()) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired OTP' });
    }
    // Create or update user, set session cookie
    // ...
  }),
```

**Required env vars:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

---

### 1.4 — Fix `getJobById` Broken Key

**Current state:** `db-dynamodb.ts` calls `GetCommand({ Key: { id, createdAt: '' } })` — the empty sort key will never match a real record.

```typescript
// BEFORE (broken):
Key: { id, createdAt: '' }

// AFTER — remove sort key if JobsTable uses id as sole partition key:
Key: { id }

// OR — fetch createdAt first from a GSI, then use it in the GetCommand
// Check how createJob stores the item and match the key structure exactly
```

---

### 1.5 — Fix Worker Payout (Escrow Release)

**Current state:** `escrow.releasePayment` updates DB status to `'released'` but never calls `initiateTransfer`. Workers complete jobs and receive nothing.

```typescript
// server/routers.ts — escrow.releasePayment
releasePayment: protectedProcedure
  .input(z.object({ escrowId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const escrow = await db.getEscrowById(input.escrowId);
    
    // 1. Update DB status
    await db.updateEscrowStatus(input.escrowId, 'released');
    
    // 2. Actually pay the worker — THIS IS MISSING
    const workerProfile = await db.getProfileByUserId(escrow.workerId);
    
    if (workerProfile.paystackRecipientCode) {
      await paystackService.initiateTransfer({
        amount: escrow.workerPayout, // in kobo/cents
        recipient: workerProfile.paystackRecipientCode,
        reason: `Payment for job ${escrow.jobId}`,
      });
    } else {
      // Worker hasn't set up bank account — hold funds, notify them
      await db.createNotification(escrow.workerId, {
        title: 'Payment ready — add your bank account',
        message: 'Your payment is ready. Add your bank account details to receive it.',
        type: 'payment',
      });
    }
    
    return { success: true };
  }),
```

**Also:** Fix the escrow state machine — `payDeposit` sets status to `deposit_paid` but `canReleasePayment` requires `held`. Add the transition:

```typescript
// After successful Paystack verification in payDeposit:
await db.updateEscrowStatus(escrowId, 'held'); // not 'deposit_paid'
```

---

### 1.6 — Fix `acceptBid` Returns Empty workerId

```typescript
// db-dynamodb.ts — acceptBid
// Current: returns workerId: "" 
// Fix: fetch the bid first, get workerId from it

async function acceptBid(bidId: string, jobId: string) {
  const bid = await getBidById(bidId); // add this function if missing
  await updateJobStatus(jobId, 'in_progress', bid.workerId);
  await updateBidStatus(bidId, 'accepted');
  return { workerId: bid.workerId, bidId }; // return actual workerId
}
```

---

## 2. What Needs to Be Built (Missing from Codebase Entirely)

### 2.1 — Wave Broadcasting System (DOES NOT EXIST)

This is the core operational mechanic of the platform. It must be built.

**How it works:**

When a homeowner selects a grade (Gold/Silver/Blue) after seeing the AI estimate, the system starts broadcasting to eligible workers in 3 waves.

**Database additions needed:**

```sql
-- Add to schema (DynamoDB equivalent: BroadcastTable)
broadcast_log:
  id (UUID)
  job_id
  worker_id
  wave (1 | 2 | 3)
  sent_at
  responded_at (nullable)
  response_type ('accept' | 'decline' | 'ignore' | null)
  expires_at
```

**Backend logic to build:**

```typescript
// server/services/wave.ts (new file)

export async function startBroadcast(jobId: string, grade: 'gold' | 'silver' | 'blue') {
  const eligibleWorkers = await getEligibleWorkers(jobId, grade);
  const sorted = sortByResponseRate(eligibleWorkers);
  
  // Wave 1 — top 5
  await broadcastToWorkers(jobId, sorted.slice(0, 5), 1);
  
  // Schedule Wave 2 after 15 min (10 min if urgent)
  scheduleWave(jobId, sorted.slice(5, 15), 2, 15 * 60 * 1000);
  
  // Schedule Wave 3 after 30 min
  scheduleWave(jobId, sorted.slice(15), 3, 30 * 60 * 1000);
}

function getEligibleWorkers(jobId: string, grade: string) {
  // Grade eligibility:
  // Homeowner selects Gold → Gold workers only
  // Homeowner selects Silver → Silver + Gold workers
  // Homeowner selects Blue → Blue + Silver + Gold workers
  
  // Filter: has required skill, is_active, within travel radius, available on preferred date
}

function sortByResponseRate(workers: Worker[]) {
  // Primary: response_rate (highest first)
  // Secondary: grade (Gold first within same grade selection)
  // Tiebreaker: last_job_date (oldest first — fairness)
  return workers.sort((a, b) => b.responseRate - a.responseRate);
}

// Atomic accept — first worker to accept wins
export async function acceptWaveJob(jobId: string, workerId: string) {
  // Atomic DB update — only succeeds if status is still 'broadcasting'
  const result = await db.atomicUpdateJob(
    jobId,
    { status: 'broadcasting' },     // condition
    { status: 'assigned', workerId } // update
  );
  
  if (!result.success) {
    throw new TRPCError({ code: 'CONFLICT', message: 'Job already taken' });
  }
  
  // Record response in broadcast log
  await db.updateBroadcastLog(jobId, workerId, 'accept');
  
  // Notify homeowner
  await createNotification(job.homeownerId, 'Worker found!', `${worker.name} has accepted your job.`);
  
  return { success: true };
}
```

**Frontend changes:**
- Worker `Jobs` page → wave inbox (not browse), shows countdown timer per wave offer
- Homeowner `My Jobs` page → shows wave progress ("Finding your Silver worker... Wave 1 of 3")
- Remove `Browse Jobs` from worker nav

---

### 2.2 — Grading & Score System (DOES NOT EXIST)

**Current state:** Resume shows hardcoded `tier: 'Bronze'`, `strength: 0`, all metrics are `0`.

**Schema additions needed:**

```typescript
// Add to profiles table / DynamoDB ProfilesTable:
grade: 'gold' | 'silver' | 'blue'  // calculated monthly
score: number                        // 0-110
responseRate: number                 // 0-100 (%)
onTimeRate: number                   // 0-100 (%)
completionRate: number               // 0-100 (%)
learningBonus: number                // 0-10
lastGradeCalculation: Date
```

**Grade thresholds:**

| Score | Grade | Hourly Rate |
|-------|-------|-------------|
| 85–110 | Gold | R450/hr |
| 65–84 | Silver | R350/hr |
| 0–64 | Blue | R250/hr |

**Score formula (build as a scheduled job — runs 1st of every month):**

```typescript
// server/services/grading.ts (new file)

export function calculateScore(worker: WorkerStats): number {
  const workmanship = calculateWorkmanship(worker);   // × 0.35
  const reliability = calculateReliability(worker);   // × 0.25
  const professionalism = calculateProfessionalism(worker); // × 0.20
  const coreQuals = calculateCoreQuals(worker);       // × 0.10
  const learningBonus = worker.learningBonus;          // max +10
  
  return (workmanship * 0.35) + (reliability * 0.25) +
         (professionalism * 0.20) + (coreQuals * 0.10) + learningBonus;
}

// Response rate = (accepted + declined) / total broadcasts × 100
// Accepting OR declining counts — only ignoring hurts
export function calculateResponseRate(broadcastLog: BroadcastLog[]): number {
  const total = broadcastLog.length;
  if (total === 0) return 100; // new workers start at 100
  const responded = broadcastLog.filter(b => b.responseType !== 'ignore').length;
  return (responded / total) * 100;
}
```

**Response rate enforcement (add to wave logic):**

| Response Rate | Consequence |
|--------------|-------------|
| 80%+ | Normal |
| 50–79% | Warning on dashboard |
| 30–49% | Moved to back of all waves for 30 days |
| Below 30% | Account suspended — contact support |

---

### 2.3 — AI Estimation Engine

**Current state:** `ai.estimateCost` exists as a real Claude call but the prompt and return structure need to match the spec.

**Required return structure:**

```typescript
{
  confidence: 'high' | 'medium' | 'low',
  estimate_low: number,   // ZAR integer
  estimate_high: number,  // ZAR integer
  solution: string,       // max 20 words
  parts_cost_low: number,
  parts_cost_high: number,
  labour_hours_low: number,
  labour_hours_high: number,
  reasoning: string       // internal logging only
}
```

**System prompt (use exactly):**

```
You are the AI Estimation Engine for Project Khaya, a home services marketplace
in KZN Midlands, South Africa.

Return ONLY valid JSON. No preamble, no markdown, no explanation.
Use South African pricing (Builders Warehouse, Chamberlains).
Labour rates: Gold R450/hr | Silver R350/hr | Blue R250/hr.
Never return a single price — always return a range.
Wide ranges protect trust more than false precision.
If confidence is low, make the range very wide (e.g. R500–R2500).
```

**Fallback (if API fails — never block homeowner):**

```typescript
const FALLBACK: Record<string, { low: number; high: number }> = {
  plumbing:   { low: 300, high: 1800 },
  electrical: { low: 400, high: 2500 },
  building:   { low: 500, high: 5000 },
  gardening:  { low: 200, high: 800  },
  handyman:   { low: 250, high: 1200 },
};
```

---

### 2.4 — Notifications (Currently 100% Stubbed)

`createNotification`, `getNotificationsByUser`, `markNotificationAsRead` all return hardcoded values. Notifications are called throughout the codebase but silently discarded.

**Fix — implement DynamoDB writes:**

```typescript
// db-dynamodb.ts — replace stubs with real DynamoDB calls
async function createNotification(userId: string, data: NotificationData) {
  await dynamoDB.send(new PutCommand({
    TableName: process.env.NOTIFICATIONS_TABLE || 'KhayaStack-Notifications',
    Item: {
      id: uuid(),
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: false,
      relatedId: data.relatedId,
      createdAt: new Date().toISOString(),
    }
  }));
}
```

---

### 2.5 — Public Price Guide Page (`/price-guide`)

Static page — no backend required. Add to public nav.

| Job | Blue | Silver | Gold |
|-----|------|--------|------|
| Leaking tap | R150–R300 | R200–R400 | R300–R550 |
| Burst pipe | R350–R650 | R450–R850 | R650–R1,200 |
| Toilet repair | R180–R350 | R240–R450 | R350–R620 |
| Geyser replacement | R2,000–R3,200 | R2,600–R4,000 | R3,200–R5,200 |
| Light fitting | R200–R400 | R260–R520 | R380–R700 |
| DB board fault | R350–R800 | R450–R1,050 | R650–R1,400 |
| Ceiling crack | R300–R700 | R400–R900 | R580–R1,200 |
| Roof leak (minor) | R500–R1,200 | R650–R1,600 | R950–R2,200 |
| Garden tidy | R250–R600 | R320–R800 | R500–R1,100 |
| Paint 1 room | R600–R1,400 | R800–R1,800 | R1,200–R2,500 |

---

## 3. Schema Fixes Required

### 3.1 — Fix `profiles.trade` (single string → array)

`ProviderOnboard.tsx` lets workers select multiple trades. The DB field `trade` is a single `varchar`. Workers lose all but the first trade on save.

```sql
-- Option A: Change to JSON array
ALTER TABLE profiles ADD COLUMN trades JSON;
-- Migrate: UPDATE profiles SET trades = JSON_ARRAY(trade);
-- Then drop old column

-- Option B: Separate worker_skills table (matches our spec better)
CREATE TABLE worker_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  worker_id INT NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  category ENUM('plumbing','building','electrical','gardening','handyman'),
  grade ENUM('gold','silver','blue') DEFAULT 'blue',
  score DECIMAL(5,2) DEFAULT 50.00,
  hourly_rate INT DEFAULT 25000, -- cents
  FOREIGN KEY (worker_id) REFERENCES users(id)
);
```

Option B matches the system spec exactly and supports per-skill grading.

### 3.2 — Add `userType` alias or rename `role`

The frontend uses `user.userType` but the DB column is `role`. Either:
- Add a computed alias in the tRPC context: `userType: user.role`
- Or do a global find/replace: `user.role` → `user.userType` in the DB schema and backend

Pick one and be consistent.

### 3.3 — Fix `verifyOTP` userType mismatch

`auth.verifyOTP` input accepts `userType: 'buyer' | 'worker' | 'seller'` but the DB enum is `'supplier'` not `'seller'`. The mapping is never resolved.

```typescript
// Map at the boundary:
const dbRole = input.userType === 'seller' ? 'supplier' : input.userType;
```

---

## 4. What to Remove / Clean Up

| Item | Action | Reason |
|------|--------|--------|
| `backend/` folder | **Delete** | Dead AWS Lambda version — causing ~60 TypeScript errors, not used in production |
| `drizzle/schema-enhanced.ts` | **Delete** | Defines tables never migrated or used — creates confusion |
| `server/ai/matcher.ts` | **Delete or wire up** | `AIWhisperer` class exists but `getAvailableWorkers()` returns `[]` and is never called from any router. Either implement it or remove it — dead code |
| `server/behavioral/nudges.ts` | **Wire up** | `NudgeEngine` has good logic — 5 nudge types defined. Wire to worker dashboard. Don't delete — just needs a router endpoint |
| `server/_core/llm.ts` (Manus Forge) | **Keep but don't mix** | Platform-provided LLM — useful for general chat. Don't mix with the Claude/OpenAI calls for estimation |
| Duplicate message routers (`message` + `messages`) | **Consolidate into one** | Two separate routers doing the same thing creates confusion |
| `user.getUploadUrl` stub | **Fix or remove** | Returns a fake S3 URL — either implement real S3 presigned URLs or remove and use the existing Manus storage proxy |

---

## 5. All 4 User Types — Navigation & Page Spec

### Role → Landing Page Mapping

| Role | DB Value | Landing Page After Login |
|------|----------|------------------------|
| Homeowner/Commissioner | `buyer` | My Jobs (`/dashboard/jobs`) |
| Worker/Tradesman | `worker` | My Profile/Resume (`/dashboard/profile`) |
| Material Seller | `supplier` | Seller Dashboard (`/dashboard/seller`) |
| Admin | `admin` | Admin Dashboard (`/admin`) |

---

### Worker Navigation
```
My Profile  |  Jobs  |  Materials  |  Stories  |  [Avatar → Settings / Logout]
```

**My Profile = The Resume (default landing page)**
All behavioural metrics front and centre, visible immediately on login:
- Grade badge (Gold/Silver/Blue) — large
- Score (e.g. 82/110)
- Response rate with colour indicator (green ≥80%, amber 50–79%, red <50%)
- Wave rank ("You are #3 of 14 Silver workers in your area")
- "8 points to Gold" — progress indicator
- Skills with individual grades and ratings
- Last 10 reviews
- Learning modules progress + available modules
- Earnings summary

**Jobs = Wave Inbox (NOT a browse page)**
- Incoming tab: active wave offers with countdown timers, [Accept] [Decline] buttons
- History tab: past jobs, filter by status
- Earnings tab: payout history, pending balance

**Materials = Grade-Based Shopping**
- Header: "As a Silver worker, you get 10% off all materials. Earn Gold to unlock 15%."
- Grade discounts: Gold = 15%, Silver = 10%, Blue = 5%
- Category filter, in-stock indicator, seller contact CTA

**Remove from worker nav:** Home (→ marketing site), Browse Jobs, Post a Job, Find Workers, separate Dashboard tab

---

### Homeowner Navigation
```
My Jobs  |  [POST A JOB ← primary CTA button]  |  Find Workers  |  Materials  |  Stories  |  [Avatar → Profile / Logout]
```

**My Jobs (default landing page)**
- Active jobs with live status: Broadcasting → Assigned → In Progress → Awaiting Confirmation
- Wave progress indicator while searching: "Wave 1 of 3 — finding your Silver worker... 12 min remaining"
- [Confirm Completion] button on completed jobs (24hr auto-confirm if no action)
- Past jobs with review prompts

**Post a Job (primary CTA)**
Full flow: Category → Description → Photos → Urgency → Date → AI Estimate → Grade Select → Payment Auth → Broadcasting begins

---

### Material Seller Navigation
```
Dashboard  |  My Listings  |  Add Listing  |  [Avatar → Profile / Logout]
```

**Dashboard (default landing page)**
- Active listings count
- Verification status (pending admin approval before listings go live)
- Views this week (Phase 2)

**Note:** Seller listings must be approved by admin before going live. Add seller approval queue to admin panel.

---

### Admin Navigation (separate `/admin` route — not shared with user-facing app)
```
Dashboard  |  Users  |  Jobs  |  Payments  |  Content  |  Analytics  |  Logout
```

**ALL admin routes must use `adminProcedure` — fix this before launch.**

**Admin MVP (required on launch):**
- User list: filter by role, view profile, suspend/reinstate, approve sellers
- Job list: filter by status, re-broadcast expired jobs, cancel
- Payment list: view transactions, issue refunds, resolve disputes
- Content: create/edit/publish/delete stories
- Basic analytics: jobs posted, assignment rate, revenue

---

### Public Navigation (not logged in)
```
Home  |  Stories  |  Find Workers  |  Materials  |  Price Guide  |  [Sign In]  |  [Get Started]
```

**Stories must be public (no login required).** Currently the stories router uses protected procedures for `getAll` — change to `publicProcedure`.

---

## 6. Answers to Your 6 Questions

**Q1: Is DynamoDB provisioned?**
Decision needed: For a KZN Midlands marketplace at this stage, consolidating on **MySQL** (already fully schematised in `drizzle/schema.ts`) is the pragmatic choice. DynamoDB adds operational complexity, cost, and is the root cause of the MySQL/DynamoDB disconnect bug. Recommendation: migrate the active DynamoDB calls to MySQL and drop the DynamoDB layer. The drizzle schema is well-defined and ready.

If staying on DynamoDB: the tables need to be provisioned in AWS (`UsersTable`, `ProfilesTable`, `JobsTable`, `BidsTable`, `ListingsTable`, `ReviewsTable`, `CreditsTable`, `ReferralsTable`, `StoriesTable`, `NotificationsTable`) and the MySQL/DynamoDB sync issue (Section 1.2) must be fixed.

**Q2: Paystack account status**
Live keys required. Business owner to complete KYC at `paystack.com/za` and replace test keys in `.env.production`. `PAYSTACK_SECRET_KEY` must be marked as REQUIRED (not optional) in `.env.production.example`.

**Q3: `schema-enhanced.ts` — planned migration or abandoned?**
Abandon it. Delete the file. The system spec has a clearer, simpler data model. The enhanced tables (`escrow_payments`, `worker_badges`, `trust_scores`) should be built fresh based on Section 2.2 of this document, not from the enhanced schema.

**Q4: Admin security**
IP restriction alone is not sufficient. The admin panel needs:
1. `adminProcedure` middleware on all admin routes (immediate fix)
2. Proper session management (not `localStorage` token)
3. Environment-variable-based credentials (not hardcoded in source)

**Q5: OTP delivery — Twilio configured?**
Not yet. Required env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`. Implementation spec is in Section 1.3 above. The OTP stub is currently accepting ANY code for ANY phone number — this is a significant security hole even in testing.

**Q6: `profiles.trade` single string — schema gap?**
Schema gap. Workers need multiple skills with individual grades. Fix per Section 3.1 above — recommend Option B (separate `worker_skills` table) as it supports per-skill grading which is core to the platform's value proposition.

---

## 7. Required Environment Variables

All must be set before any user-facing testing:

```bash
# Database
DATABASE_URL=mysql://...              # MySQL connection string
AWS_REGION=af-south-1                 # If keeping DynamoDB
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Auth
JWT_SECRET=...                        # Strong random string (64+ chars)
OWNER_OPEN_ID=...                     # Manus OAuth ID of the platform admin
COOKIE_NAME=khaya_session

# OTP
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+27...

# AI
ANTHROPIC_API_KEY=...                 # Required — Claude estimation + bid proposals
OPENAI_API_KEY=...                    # Required — search parsing, material recommendations

# Payments
PAYSTACK_SECRET_KEY=...               # REQUIRED (not optional) — must be live key for ZA payouts
PAYSTACK_WEBHOOK_SECRET=...           # For webhook signature verification

# Email
MAILERSEND_API_KEY=...                # Or AWS SES credentials
SES_FROM_EMAIL=noreply@projectkhaya.co.za

# Storage
S3_BUCKET_NAME=projectkhaya-uploads   # If using S3 for photos
S3_REGION=af-south-1

# Admin
ADMIN_PASSWORD=...                    # Replace hardcoded Admin@2024Khaya
```

---

## 8. Phased Build Plan

### Phase 1 — Safe to Launch (fix this week)
1. ✅ Delete `backend/` folder
2. ✅ Secure admin panel (`adminProcedure` on all admin routes)
3. ✅ Fix MySQL/DynamoDB auth disconnect
4. ✅ Fix OTP (wire Twilio or keep Manus OAuth as sole auth method)
5. ✅ Fix `getJobById` broken key
6. ✅ Fix `acceptBid` empty workerId
7. ✅ Fix escrow state machine (`deposit_paid` → `held`)
8. ✅ Wire `initiateTransfer` in `releasePayment`
9. ✅ Fix notifications (replace stubs with real DynamoDB writes)
10. ✅ Make stories public (`publicProcedure` on `story.getAll`)
11. ✅ Apply all TypeScript fixes from `ProjectKhaya_DevFix_LaunchGuide.md`
12. ✅ Fix `profiles.trade` → `trades` (array)
13. ✅ Add public price guide page (`/price-guide`)
14. ✅ Fix all 4 user-type navigation views (remove irrelevant nav items per Section 5)
15. ✅ Promote resume to be the worker profile page
16. ✅ Register Paystack webhook route (`POST /webhook/paystack`)

### Phase 2 — Core Differentiators (week 2)
1. Wave broadcasting system (Section 2.1)
2. Grading & score system (Section 2.2)
3. AI estimation engine with confidence levels (Section 2.3)
4. Grade-based material discounts
5. Grade change notifications (7-day warning)
6. Learning modules (M1 + M2)
7. Full admin dashboard with real data
8. Review system properly wired to grade calculation

### Phase 3 — Native App Features
1. Push notifications (AWS SNS Mobile Push)
2. WhatsApp integration (Twilio / 360dialog)
3. Worker matcher AI (`server/ai/matcher.ts` — implement properly)
4. Behavioral nudges (`server/behavioral/nudges.ts` — wire to dashboard)
5. Seller in-platform enquiry form
6. Seller analytics

---

## 9. Files to Send to Developer

Along with this document, send:
1. `ProjectKhaya_DevFix_LaunchGuide.md` — TypeScript fixes
2. `ProjectKhaya_UX_Layout_AllUsers.md` — nav and page spec for all 4 users
3. `ProjectKhaya_SystemSpec_v1.0.docx` — full system specification
4. `ProjectKhaya_AI_Prompt_Spec.docx` — AI estimation prompt

---

*Project Khaya · Master Developer Brief · June 2026 · Confidential*
