# Project Khaya — UX Layout & Information Architecture
> All 4 User Types · Reasoning Included · June 2026

---

## What's Wrong With the Current Worker View (Observed Today)

| What Exists Now | Problem | Fix |
|----------------|---------|-----|
| "Home" link in nav | Takes worker back to the marketing website — wrong context entirely | **Remove from authenticated nav** |
| "Browse Jobs" tab | Contradicts the wave system — workers should receive jobs, not shop for them | **Replace with "My Jobs" (incoming waves + history)** |
| "Post a Job" tab | Triggers "Client access required" error — worker can see it but can't use it | **Remove entirely from worker nav** |
| "Find Workers" tab | A worker does not need to find other workers | **Remove from worker nav** |
| Resume buried in Profile | The resume IS the worker's identity on this platform — hiding it defeats its purpose | **Make Resume the Profile page** |
| Materials tab | Generic listing — no connection to the worker's grade or earned benefits | **Rebuild as grade-based shopping experience** |
| Dashboard tab (separate) | Key metrics duplicated across pages — creates navigation confusion | **Merge critical metrics into Profile/Resume** |
| Stories (auth-gated) | Public content locked behind login — kills SEO and organic discovery | **Make public. Keep in nav for all users.** |

---

## Core UX Principle for This Platform

> **Every page a user sees should serve their role. If it doesn't, it shouldn't be there.**

A worker's app and a homeowner's app are fundamentally different products. They share infrastructure but not navigation, not landing pages, and not priorities.

---

## User Type 1 — Worker (Tradesman)

### Philosophy
The worker's entire value on this platform lives in their **Resume** — grade, response rate, skills, reviews, learning progress. This is what gets them jobs. It should be the first thing they see when they log in, not something buried two clicks deep.

Jobs come **to them** via waves. They don't browse. Browsing implies scarcity and desperation — waves imply fairness and opportunity.

### Navigation (Authenticated)
```
[ My Profile ]  [ Jobs ]  [ Materials ]  [ Stories ]  [ Logout ]
```

**5 items maximum. No clutter.**

### Page Breakdown

#### My Profile (= The Resume — Default Landing Page After Login)
This is the most important change. The resume IS the profile. When a worker logs in, this is where they land.

**Above the fold (immediately visible):**
- Grade badge — Gold / Silver / Blue (large, prominent)
- Current score — e.g. 82 / 110
- Response rate — e.g. 74% with colour indicator (green/amber/red)
- Wave rank — "#3 of 14 Silver workers in your area"
- Next grade threshold — "8 points to Gold"

**Behavioural science section — "Your Performance":**
- Workmanship score breakdown (35%)
- Reliability score breakdown (25%)
- Professionalism score breakdown (20%)
- Core Qualifications (10%)
- Learning Bonus — current points + expiry countdown

**Why this works:** Workers can see exactly where they stand and exactly what to improve. No guessing. Transparent, motivating, actionable. This is the behavioural science — clarity drives behaviour change.

**Skills section:**
- Each skill listed with individual grade, avg rating, jobs completed
- "Add a skill" button

**Reviews section:**
- Last 10 reviews, filterable by skill
- Star breakdown per dimension (workmanship, on-time, communication, cleanliness, fair pricing)

**Learning Modules section (bottom of profile):**
- Completed modules with expiry dates
- Available modules with point values
- Clear CTA: "Complete M4 to earn +2 points and move closer to Gold"

**What to REMOVE from this page:**
- Any generic "edit profile" form that asks for name/email/phone — move that to Settings
- Social media links — not relevant to this platform

---

#### Jobs (Wave Inbox — Not a Browse Page)
This is NOT a job board. Workers do not browse and apply. They receive.

**Structure:**

**Active / Incoming tab:**
- Wave notifications displayed as cards
- Each card shows: job title, category, grade required, estimate range, location, time remaining in wave
- Large [Accept] and [Decline] buttons — one tap response
- Countdown timer visible on each active wave offer
- "You are in Wave 1 — first chance. 12 minutes remaining."

**Why not a browse page:**
The wave system is a core differentiator. It rewards response rate, which rewards reliability, which builds trust. If workers can browse and cherry-pick, the response rate metric becomes meaningless and slower workers game the system by waiting to see all options.

**History tab:**
- All past jobs — completed, declined, expired
- Filter by date, category, status
- Each completed job links to the review received

**Earnings tab:**
- Payout history
- Pending balance
- Net payout per job (after platform fee)
- Download monthly statement

---

#### Materials (Grade-Based Shopping)
Not a generic listing page. A benefit tied to the worker's grade.

**Header message (dynamic):**
> "As a **Silver** worker, you receive **10% off** all listed materials. Earn Gold to unlock 15%."

**Grade discount structure:**
| Grade | Discount |
|-------|----------|
| Gold | 15% off |
| Silver | 10% off |
| Blue | 5% off |

**Why this works:**
- Creates tangible financial value for achieving higher grades
- Incentivises workers to improve their score (not just for job priority — actual money saved)
- Drives sellers to want to be on the platform (access to motivated, grade-conscious buyers)
- The discount is visible BEFORE the worker upgrades — aspirational, not just a reward

**Page structure:**
- Category filter (Plumbing, Electrical, Building, Gardening, Tools)
- Product cards showing: original price, discounted price, seller name, in-stock badge
- Seller profile link on each card
- No checkout on platform for Phase 1 — "Contact Seller" CTA (direct contact)
- Phase 2: in-platform ordering

---

#### Stories
Public content — blogs, how-to guides, platform news, worker spotlights.

**For workers specifically:**
- "Worker Spotlight" stories — feature top-rated workers (social proof + motivation)
- Platform tips — "How to improve your response rate"
- Industry news relevant to tradespeople

Publicly accessible (no login required) for SEO. Workers see the same content as everyone else.

---

### Worker Nav — What's REMOVED and Why

| Removed | Reason |
|---------|--------|
| Home (→ marketing site) | Authenticated users should not be bounced to the marketing homepage |
| Browse Jobs | Contradicts wave system — workers receive jobs, not shop for them |
| Post a Job | Role-restricted. Showing it and erroring is worse UX than hiding it |
| Find Workers | A worker has no use case for finding other workers |
| Separate Dashboard tab | Key metrics now live on the Profile/Resume page — no need for a separate tab |

---

## User Type 2 — Homeowner / Commissioner

### Philosophy
The homeowner's primary action is **posting a job and getting it done**. Everything else is secondary. The nav should reflect this. Post a Job should be the most prominent element — not just another tab.

### Navigation (Authenticated)
```
[ My Jobs ]  [ Post a Job ← PRIMARY CTA ]  [ Find Workers ]  [ Materials ]  [ Stories ]  [ Profile ]  [ Logout ]
```

"Post a Job" is styled differently (button, not link) — it is the primary action.

### Page Breakdown

#### My Jobs (Default Landing Page After Login)
When a homeowner logs in, they want to know: what's happening with my jobs?

**Active Jobs tab:**
- Job cards showing: title, status (Broadcasting / Assigned / In Progress / Awaiting Confirmation), grade selected, estimate range, worker name (if assigned)
- Prominent status indicator — colour coded
- "Wave 1 of 3 — finding your Silver artisan... (12 min remaining)"
- Once assigned: worker name, grade badge, contact prompt
- Once complete: [Confirm Completion] button — large, prominent
- 24hr auto-confirm notice: "If you don't confirm by [time], payment will be released automatically"

**Past Jobs tab:**
- Completed jobs with final price, worker, rating given
- [Leave Review] button for jobs not yet reviewed

#### Post a Job
The core flow as designed in the spec:
1. Select trade category
2. Describe the problem
3. Upload up to 3 photos
4. Set urgency (Normal / Urgent)
5. Set preferred date
6. AI estimate displayed with confidence level
7. Select grade (Gold / Silver / Blue)
8. Payment authorisation
9. Wave broadcasting begins

**This page should be accessible from anywhere in the app via the persistent CTA button.**

#### Find Workers
Browse verified worker profiles before or after posting.

- Filter by trade, location, grade
- Worker cards show: name, grade badge, avg rating, jobs completed, response rate
- Click through to full resume/profile (read-only view)
- "Hire this worker" — posts a job pre-assigned to this worker (bypasses waves for direct hire, Phase 2)

#### Profile (Homeowner)
Simple — name, location, contact details, payment methods saved, notification preferences.
Not complex. Not prominent. Accessed via top-right avatar.

---

## User Type 3 — Material Seller

### Philosophy
Sellers need to manage their listings and understand their visibility. Simple, operational.

### Navigation (Authenticated)
```
[ Dashboard ]  [ My Listings ]  [ Add Listing ]  [ Profile ]  [ Logout ]
```

### Page Breakdown

#### Dashboard (Default Landing Page)
- Active listings count
- Profile status (Verified / Pending approval)
- Views on listings this week
- Enquiries received (Phase 2)
- "Your listing is pending admin approval" — if not yet verified

#### My Listings
- All listings with status (Active / Out of Stock / Inactive)
- Quick toggle: mark in/out of stock
- Edit and delete actions
- Up to 20 active listings

#### Add Listing
Simple form:
- Product/service name
- Category
- Description
- Price (optional — can hide price and show "Contact for price")
- Up to 5 photos
- In stock toggle

#### Profile
- Business name, description, logo, location, contact details
- Verification status
- "Your profile is visible to all platform users including workers browsing materials"

---

## User Type 4 — Admin

### Philosophy
Admin is an operational tool, not a user-facing product. It should be functional, dense, and fast. No marketing fluff.

### Navigation (Authenticated — separate /admin route)
```
[ Dashboard ]  [ Users ]  [ Jobs ]  [ Payments ]  [ Content ]  [ Analytics ]  [ Logout ]
```

### Page Breakdown

#### Dashboard (Default Landing Page)
Live platform health at a glance:
- Jobs posted today / this week
- Assignment rate (% assigned within 30 min)
- Active disputes
- Pending seller approvals
- Platform response rate
- Revenue today / this month

#### Users
- Filterable table: All / Homeowners / Workers / Sellers
- Search by name, email, phone
- Click into any user: full profile, job history, payment history
- Actions: Suspend, Reinstate, Override Grade, Reset Password
- Seller approval queue — highlighted, actionable

#### Jobs
- All jobs with full filter (status, date, category, grade, location)
- Click into any job: description, photos, wave log, bid history, payment status
- Actions: Re-broadcast, Cancel, Override Assignment

#### Payments
- All transactions filterable by status
- Pending captures, active disputes, completed payouts
- Actions: Issue refund, Resolve dispute, Manual payout
- CSV export by date range

#### Content (Stories)
- Create, edit, unpublish, delete stories
- Simple rich-text editor
- Preview before publishing

#### Analytics
- Time-series charts: jobs posted, assignment rate, revenue
- Grade distribution (Gold/Silver/Blue counts)
- Estimate accuracy (estimate high vs final price — variance)
- Top workers by response rate
- Dispute rate trend

---

## Page Audit — Remove / Merge / Keep

| Page | Action | Reason |
|------|--------|--------|
| Marketing Home (when logged in) | **Remove from nav** | Authenticated users don't need the marketing homepage |
| Separate Dashboard (worker) | **Merge into Profile/Resume** | Duplication — metrics belong on the resume |
| Browse Jobs (worker) | **Replace with Jobs inbox** | Contradicts wave system |
| Post a Job (worker nav) | **Remove** | Role-restricted — showing it creates confusion |
| Find Workers (worker nav) | **Remove** | No worker use case |
| Worker Resume (buried) | **Promote to = My Profile** | The resume is the profile |
| Stories (auth-gated) | **Make public** | SEO + organic discovery |
| Materials (generic listing) | **Rebuild as grade shopping** | Needs discount logic tied to grade |
| Messages/Chat | **Keep — but only show if conversation exists** | Don't show empty inbox as a nav item |
| Referrals | **Keep — fix router name** | 5 min fix, adds value |
| WorkerResume (separate page) | **Fold into My Profile** | One page, not two |
| ProviderOnboard | **Keep — entry point for worker registration** | Needed for onboarding flow |
| Showcase | **Review post-launch** | Nice to have, not core |

---

## Navigation Summary by User Type

### Worker (logged in)
```
My Profile  |  Jobs  |  Materials  |  Stories  |  [Avatar → Settings / Logout]
```
Landing page: **My Profile (Resume)**

### Homeowner (logged in)
```
My Jobs  |  [POST A JOB]  |  Find Workers  |  Materials  |  Stories  |  [Avatar → Profile / Logout]
```
Landing page: **My Jobs**

### Material Seller (logged in)
```
Dashboard  |  My Listings  |  Add Listing  |  [Avatar → Profile / Logout]
```
Landing page: **Dashboard**

### Admin (logged in — /admin route)
```
Dashboard  |  Users  |  Jobs  |  Payments  |  Content  |  Analytics  |  [Logout]
```
Landing page: **Dashboard**

### Public (not logged in)
```
Home  |  Stories  |  Find Workers  |  Materials  |  Price Guide  |  [Sign In]  |  [Get Started]
```

---

## Key Reasoning Summary

| Decision | Reasoning |
|----------|-----------|
| Resume = Profile for workers | The resume contains all the behavioural science — hiding it is hiding the product's value proposition |
| No browse jobs for workers | Wave system is the differentiator. Browse kills response rate as a metric and lets workers cherry-pick |
| Grade-based material discounts | Tangible financial incentive to improve grade. Reinforces the whole grading system with real-world value |
| Remove Home link from authenticated nav | Logged-in users have a role-specific app. The marketing homepage is for non-users |
| Stories public | Public content = SEO = free acquisition. Gating it behind login serves nobody |
| Post a Job as CTA button not nav link | The homeowner's primary action should be visually distinct, not buried in a list of links |
| Merge Dashboard into Profile | Workers should have one place to understand their performance, not two |
| Separate /admin route | Admin is a different product. It should not share nav with user-facing pages |

---

*Project Khaya · UX Layout & IA · All 4 User Types · June 2026*
