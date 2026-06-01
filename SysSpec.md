# Project Khaya — Complete System Specification v1.0
> KZN Midlands Construction Marketplace · projectkhaya.co.za · Built on AWS · June 2026
> For Business Analyst Assessment & Developer Execution

---

## User Types

| User Type | Role Summary | Access Level |
|-----------|-------------|--------------|
| Homeowner / Commissioner | Posts jobs, receives estimates, selects grade, approves bids, pays | Homeowner |
| Worker (Artisan) | Receives wave notifications, accepts jobs, completes work, gets rated | Worker |
| Material Seller | Lists products/tools/materials, manages inventory, serves artisans | Seller |
| Admin | Full platform oversight — users, jobs, payments, content, analytics | Admin |

---

## 1. Project Overview

Project Khaya is a web-based home services marketplace for the KZN Midlands (Estcourt and surrounding areas), connecting homeowners with local tradespeople — plumbers, builders, handymen, gardeners, electricians, and more. Built on AWS, designed mobile-first for a semi-rural South African market.

### Core Principles

| Principle | Meaning |
|-----------|---------|
| Trust first | Estimate accuracy matters more than precision. Ranges beat single prices. |
| Fairness by design | Waves, not complex algorithms. Simple to explain to any artisan. |
| Responsiveness rewarded | Artisans who respond quickly rise. Those who ignore jobs fall. |
| Web-only (Phase 1) | No WhatsApp API. Email + SMS for urgent jobs. Push notifications added with native app. |
| Mobile-first | Most users are on phones. All UI optimised for small screens. |
| Simple to explain | If an artisan cannot understand it, it is too complex. |
| AWS infrastructure | Scalable, reliable, SA-compliant cloud stack from day one. |

---

## 2. Core Data Entities

### 2.1 Homeowner / Commissioner

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Full name |
| email | String | Unique — login and notifications |
| phone | String | South African format (+27) |
| location | String | Town/suburb in KZN Midlands |
| verified | Boolean | Phone and/or email OTP verified |
| created_at | Timestamp | |

### 2.2 Worker (Artisan)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Full name |
| email | String | Unique |
| phone | String | South African format |
| location | String | Base town/suburb |
| trade_certification | Boolean | Has recognised trade test |
| tools_available | Boolean | Owns necessary tools |
| transport_type | Enum | Car / Bakkie / None |
| verified | Boolean | Background check complete |
| is_active | Boolean | Can receive jobs (false if suspended) |
| created_at | Timestamp | |

### 2.3 Skill (one row per skill per worker)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| artisan_id | UUID | Foreign key to worker |
| skill_name | String | e.g. Plumbing (general), Geyser installation |
| category | Enum | Plumbing / Building / Electrical / Gardening / Handyman |
| hourly_rate | Decimal | Gold: R450 \| Silver: R350 \| Blue: R250 |
| grade | Enum | Gold / Silver / Blue |
| score | Decimal | 0–110 (current rating score) |
| jobs_completed | Integer | Count of jobs using this skill |
| avg_rating | Decimal | 1–5 average from reviews (last 90 days) |
| response_rate | Decimal | 0–100% — primary sorting metric |
| on_time_rate | Decimal | 0–100% (last 90 days) |
| completion_rate | Decimal | 0–100% (last 90 days) |
| quiz_score | Decimal | 0–100 for skill-specific quiz |
| learning_bonus | Decimal | 0–10 (from module completions) |
| last_assessed | Date | Last grade calculation date |

### 2.4 Material Seller

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| business_name | String | Trading name |
| owner_name | String | Full name of account owner |
| email | String | Unique — login and notifications |
| phone | String | South African format |
| location | String | Town/suburb in KZN Midlands |
| description | Text | Short business description (max 200 chars) |
| logo_url | String | AWS S3 URL for business logo |
| category | Enum | Materials / Tools & Equipment / Both |
| verified | Boolean | Admin approved before listing goes live |
| is_active | Boolean | Listing visible on /materials |
| created_at | Timestamp | |

### 2.5 Product / Material Listing

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| seller_id | UUID | Foreign key to seller |
| name | String | Product or service name |
| description | Text | Detailed description |
| category | Enum | Plumbing / Electrical / Building / Gardening / Tools / General |
| price | Decimal | Listed price in Rands (optional) |
| price_visible | Boolean | Whether price is shown publicly |
| photos | Array | Up to 5 images — stored on AWS S3 |
| in_stock | Boolean | Seller marks availability |
| is_active | Boolean | Listing live on platform |
| created_at | Timestamp | |

### 2.6 Job

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| homeowner_id | UUID | Foreign key |
| skill_id | UUID | Foreign key (selected skill) |
| artisan_id | UUID | Null until assigned |
| description | Text | Homeowner problem description |
| photos | Array | Up to 3 images — AWS S3 |
| confidence | Enum | High / Medium / Low (from AI) |
| estimate_low / high | Decimal | AI-generated cost range in Rands |
| estimated_solution | Text | AI-generated fix description |
| estimated_parts_cost_low/high | Decimal | Parts cost range |
| estimated_labour_hours_low/high | Decimal | Labour hours range |
| estimated_travel_cost | Decimal | Fixed based on distance (Google Maps API) |
| urgency | Enum | Normal / Urgent |
| preferred_date | Date | |
| selected_grade | Enum | Gold / Silver / Blue |
| status | Enum | Pending / Estimated / Awaiting Selection / Broadcasting / Assigned / Inspection / Quoted / In Progress / Completed / Cancelled |
| final_price | Decimal | Actual price after completion |
| created_at / assigned_at / completed_at | Timestamp | |

### 2.7 Payment

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | Foreign key |
| homeowner_id | UUID | Foreign key |
| artisan_id | UUID | Foreign key |
| amount_authorised | Decimal | Amount held at job acceptance |
| amount_captured | Decimal | Final amount charged on completion |
| platform_fee | Decimal | 10% deducted from artisan payout |
| artisan_payout | Decimal | amount_captured minus platform_fee |
| gateway | String | peach / payfast / yoco |
| gateway_reference | String | Payment provider transaction ID |
| status | Enum | Pending / Authorised / Captured / Refunded / Disputed / Failed |
| authorised_at / captured_at / payout_at | Timestamp | |

### 2.8 Review

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| job_id / artisan_id / skill_id | UUID | Foreign keys |
| rating_workmanship | Integer | 1–5 |
| rating_on_time | Integer | 1–5 |
| rating_communication | Integer | 1–5 |
| rating_cleanliness | Integer | 1–5 |
| rating_fair_pricing | Integer | 1–5 (final vs estimate) |
| comment | Text | Optional |
| created_at | Timestamp | |

### 2.9 Broadcast Log

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| job_id / artisan_id | UUID | Foreign keys |
| wave | Integer | 1, 2, or 3 |
| sent_at | Timestamp | |
| responded_at | Timestamp | Null if no response |
| response_type | Enum | Accept / Decline / Ignore |

### 2.10 Learning Module Completion

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| artisan_id | UUID | Foreign key |
| module_id | String | M1–M5 |
| score | Decimal | 0–100 (pass = 80+) |
| completed_at | Timestamp | |
| expires_at | Timestamp | 90 days after completion |
| points_earned | Integer | 1–3 per module |

---

## 3. Homeowner / Commissioner Flow

| Step | Action | Detail |
|------|--------|--------|
| 1 | Post a Job | Select category, describe problem, upload up to 3 photos, set urgency and preferred date. |
| 2 | AI Estimation | System calls Claude/GPT-4o with vision. Returns confidence level, cost range, solution summary, parts and labour estimates. |
| 3 | Review Estimate | Homeowner sees High/Medium/Low confidence range per grade. Footer: "You will not pay more than the high end without your approval." |
| 4 | Select Grade | Tap Gold / Silver / Blue. System begins wave broadcasting. |
| 5 | Await Assignment | System finds worker via waves. Homeowner sees progress. Notified when worker accepts. |
| 6 | Payment Authorisation | Card authorised (held) at grade selection. Not captured until completion. |
| 7 | Low Confidence Jobs | Free 30-min inspection. Worker submits firm quote. Homeowner approves or declines before work begins. |
| 8 | Completion & Review | Homeowner confirms completion (or 24hr auto-confirm). Rates worker on 5 dimensions. |

### 3.1 Estimate Display by Confidence Level

#### High Confidence
> *"We are highly confident in this range based on your photo."*

| Grade | Estimate Range | Arrival |
|-------|---------------|---------|
| Gold | R850 – R1,050 | Today, 2–4 hours |
| Silver | R680 – R840 | Tomorrow |
| Blue | R560 – R700 | Within 2 days |

#### Medium Confidence
> *"Some uncertainty — final price may vary. Your artisan will confirm before starting."*

| Grade | Estimate Range | Arrival |
|-------|---------------|---------|
| Gold | R800 – R1,300 | Today, 2–4 hours |
| Silver | R640 – R1,040 | Tomorrow |
| Blue | R520 – R860 | Within 2 days |

#### Low Confidence
> *"⚠ This job requires an on-site inspection. First 30 minutes free. No obligation to proceed."*

| Grade | Estimate Range | Arrival |
|-------|---------------|---------|
| Gold | R500 – R2,500 | Today, 2–4 hours |
| Silver | R400 – R2,000 | Tomorrow |
| Blue | R300 – R1,600 | Within 2 days |

---

## 4. Wave-Based Broadcasting

| Wave | Receives Job | Wait Time | If No Accept |
|------|-------------|-----------|-------------|
| Wave 1 | Top 5 eligible workers | 15 min (10 min urgent) | Proceed to Wave 2 |
| Wave 2 | Next 10 workers | 15 min (10 min urgent) | Proceed to Wave 3 |
| Wave 3 | All remaining eligible | 2 hrs (1 hr urgent) | Job expires |

### 4.1 Sorting Within Waves
- Primary sort: Response rate (highest first)
- Secondary sort: Grade (Gold first if opting into lower-grade jobs)
- Tiebreaker: Last job date (oldest first — fairness)

### 4.2 Grade Eligibility

| Homeowner Selects | Eligible Workers |
|-------------------|-----------------|
| Gold | Gold only |
| Silver | Silver + Gold (Gold paid at Silver rate R350/hr — their choice) |
| Blue | Blue + Silver + Gold |

### 4.3 Race Condition Handling

First worker to click Accept wins. System uses atomic database lock:

```sql
UPDATE jobs SET status = 'assigned', artisan_id = ?
WHERE id = ? AND status = 'broadcasting'
```

If UPDATE returns 1 row → success. If 0 rows → job already taken. Worker sees "Job taken" message.

---

## 5. Rating & Grading System

> **Core Principle:** Only the last 90 days count. Gold is never permanent. Grades recalculate on the 1st of every month.

| Score Range | Grade | Hourly Rate |
|-------------|-------|-------------|
| 85–110 | Gold | R450 / hour |
| 65–84 | Silver | R350 / hour |
| 0–64 | Blue | R250 / hour |

### 5.1 Score Formula

```
Score = (Workmanship × 0.35) + (Reliability × 0.25) + (Professionalism × 0.20) + (CoreQuals × 0.10) + LearningBonus
```

| Pillar | Weight | Components |
|--------|--------|-----------|
| Workmanship | 35% | Avg rating (60%) + Repeat hire rate (20%) + Defect rate (20%) |
| Reliability | 25% | Response rate (40%) + On-time arrival (30%) + Job completion rate (30%) |
| Professionalism | 20% | Avg of: communication + cleanliness + fair pricing ratings |
| Core Qualifications | 10% | Trade cert (40%) + Quiz score (30%) + Tools & transport (30%) |
| Learning Bonus | Max +10 | Module completions. Expires 90 days after each module. |

### 5.2 Response Rate — Core Metric

```
Response Rate = (Accepted + Declined) / Total Broadcasts × 100
```

Accepting OR declining counts as a response. Only ignoring hurts.

| Response Rate | Consequence |
|--------------|-------------|
| 80%+ | No restriction |
| 50–79% | Warning displayed on dashboard |
| 30–49% | Moved to back of waves for 30 days |
| Below 30% | Suspended — must contact support |

New artisans: 30-day grace period before enforcement.

---

## 6. Payment System

Payment uses an escrow-style hold — card authorised at job acceptance, only captured on confirmed completion.

### 6.1 Standard Payment Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Homeowner | Selects grade. Enters card details. Payment authorised (held) — not yet charged. |
| 2 | Worker | Receives Wave 1 notification. Accepts job. |
| 3 | Worker | Completes work. Marks job complete in dashboard. |
| 4 | Homeowner | Confirms completion. Or 24-hour auto-confirm if no response. |
| 5 | System | Captures payment. Worker paid within 1–2 business days via EFT. 10% platform fee deducted. |

### 6.2 Payment Gateway

| Provider | Fee | Recommendation |
|----------|-----|----------------|
| Peach Payments | ~2.5–3.5% | RECOMMENDED — best marketplace/split payout support in SA |
| PayFast | ~2.9% + R2 | Widely used. Good fallback. |
| Yoco | 2.95% | Simple but limited for marketplace payouts. |

### 6.3 Price Protection
- Homeowner never charged more than estimate high without explicit approval.
- If final price exceeds range, worker submits a change request with reason.
- If homeowner declines change request, price is capped at estimate high.
- All price overrides logged for admin review.

### 6.4 Dispute Resolution

| Scenario | Resolution |
|----------|-----------|
| Homeowner unhappy with work | Admin reviews. Payment held (max 7 days). Admin mediates. |
| Worker claims completion, homeowner disputes | Admin requires photographic evidence from worker. |
| Payment capture fails | System retries once. Homeowner notified to re-enter card. |
| Job cancelled before worker arrives | Full refund. No fee. |
| Job cancelled after worker arrives | R100 call-out fee charged. Remainder refunded. |

---

## 7. Worker Flow

| Step | Action |
|------|--------|
| Register | Complete worker profile: skills, grade, location, trade certification, tools, transport. |
| Receive Wave Notification | Email notification when job matches skills and grade. Shows job summary, estimate range, grade, location. |
| Accept or Decline | Worker has 15 min (Wave 1/2) or 2 hrs (Wave 3) to respond. First to accept wins. |
| Complete Job | Mark job complete via dashboard. Upload completion photo if required. |
| Get Paid | EFT payout within 1–2 business days. 10% platform fee deducted. Net payout shown upfront. |
| Build Grade | Rating and response rate updated after each job. Grade recalculated monthly. |

### 7.1 Worker Dashboard

| Section | Content |
|---------|---------|
| Current Grade | Gold / Silver / Blue with score (e.g. 82/110) |
| Response Rate | Current % with target (80%+) |
| Wave Rank | e.g. #3 of 12 Silver workers in your area |
| Learning Bonus | Current points + expiry date |
| Improvement Path | "To reach Gold: need 2 more 5-star reviews (+3 points)" |
| Recent Jobs | Last 5 jobs with ratings |
| Available Modules | Uncompleted learning modules with point values |
| Payout History | Recent EFT payouts and pending balance |

---

## 8. Material Seller Flow

| Step | Action |
|------|--------|
| Register | Sign up at /register/seller. Provide business name, category, location, description, logo. |
| Admin Approval | Admin verifies business before listing goes live. Prevents fake sellers. |
| Manage Listings | Add, edit, or deactivate product/material listings via seller dashboard. |
| Visibility | Approved listings appear on /materials — public, no login required. |
| Enquiries | Phase 2: In-platform contact form for buyer enquiries. |

### 8.1 Grade-Based Discounts for Workers

| Worker Grade | Discount on Materials |
|-------------|----------------------|
| Gold | 15% off |
| Silver | 10% off |
| Blue | 5% off |

---

## 9. Learning Module System

| Module | Topic | Points | Time |
|--------|-------|--------|------|
| M1 | Customer Service Basics | +2 | 10 min |
| M2 | Accurate Quoting & Estimates | +2 | 15 min |
| M3 | Safety on Site | +2 | 10 min |
| M4 | Managing Difficult Customers | +2 | 15 min |
| M5 | Using Project Khaya App | +1 | 5 min |

- 5 multiple-choice questions per module. 80% pass mark (4/5).
- Bonus lasts 90 days then expires — keeps workers engaged.
- Same module cannot be retaken for points within 180 days.
- Bonus applies to ALL skills — customer service is universal.

---

## 10. Admin Dashboard

Required from Day 1. Without admin tools, production operations cannot be safely managed.

### 10.1 Admin Modules

| Module | Key Actions |
|--------|------------|
| User Management | View all users by role, view profile + history, suspend/reinstate, override grade, reset password |
| Seller Approval | Approve or reject seller registrations before listings go live |
| Job Management | View all jobs, filter by status/date/category, re-broadcast expired jobs, cancel jobs, override assignment |
| Payment & Finance | View all transactions, issue refunds, resolve disputes, view artisan payouts, export CSV |
| Content / Stories | Create, edit, unpublish, and delete platform stories |
| Analytics | Jobs posted, assignment rate, avg time to assign, response rate, dispute rate, revenue, grade distribution, estimate accuracy |

### 10.2 Admin Role Permissions

| Permission | Super Admin | Support | Finance |
|-----------|-------------|---------|---------|
| User Management | Full | View + Suspend | View only |
| Job Management | Full | Full | View only |
| Payments & Refunds | Full | View only | Full |
| Stories / Content | Full | Full | None |
| Seller Approval | Full | Full | None |
| Grade Override | Yes | No | No |
| Analytics | Full | Full | Finance only |

---

## 11. Tech Stack (AWS)

| Layer | Technology | AWS Service |
|-------|-----------|-------------|
| Frontend | React (mobile-first) | AWS Amplify Hosting or S3 + CloudFront |
| Backend API | Node.js or Python (Django/FastAPI) | AWS Lambda + API Gateway or EC2/ECS |
| Database | PostgreSQL | AWS RDS (PostgreSQL) or Aurora Serverless v2 |
| Authentication | JWT / OAuth2 | AWS Cognito (4 user pools) |
| Image Storage | Photo uploads | AWS S3 + CloudFront CDN |
| Email | OTP, notifications, receipts | AWS SES |
| SMS (urgent jobs) | OTP + urgent job alerts | AWS SNS or Twilio |
| AI Estimation | Vision-based cost estimation | Anthropic Claude (claude-sonnet) or OpenAI GPT-4o |
| Maps / Distance | Travel cost calculation | Google Maps Distance Matrix API |
| Payments | Card auth + capture + EFT payout | Peach Payments (primary) / PayFast (fallback) |
| Monitoring | Logs, errors, performance | AWS CloudWatch |
| Push Notifications | Phase 3 — native app only | AWS SNS Mobile Push or Firebase FCM |
| WhatsApp | Phase 3 — native app only | Twilio WhatsApp API or 360dialog |

---

## 12. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user (role specified in body) |
| POST | /api/auth/login | Login — returns JWT token |
| POST | /api/jobs | Create new job |
| GET | /api/jobs/:id/estimate | Get AI estimate (confidence + range) |
| POST | /api/jobs/:id/select | Select grade — starts wave broadcasting |
| GET | /api/jobs/:id/status | Poll assignment status |
| POST | /api/jobs/:id/accept | Worker accepts job (atomic — first wins) |
| POST | /api/jobs/:id/decline | Worker declines job |
| POST | /api/jobs/:id/quote | Worker submits firm quote (low confidence) |
| POST | /api/jobs/:id/complete | Worker marks job complete |
| POST | /api/jobs/:id/confirm | Homeowner confirms completion |
| POST | /api/jobs/:id/review | Homeowner submits review |
| GET | /api/workers/:id/dashboard | Worker dashboard data |
| POST | /api/modules/:id/complete | Complete learning module |
| GET | /api/sellers | List all approved sellers |
| POST | /api/sellers | Register seller |
| POST | /api/sellers/:id/listings | Add product listing |
| GET | /api/admin/users | Admin: list all users |
| PATCH | /api/admin/users/:id | Admin: suspend/reinstate/override grade |
| GET | /api/admin/analytics | Admin: platform metrics |

---

## 13. Public Price Guide

Static page at `/price-guide` — publicly accessible, no login required.

| Job Type | Blue | Silver | Gold |
|----------|------|--------|------|
| Leaking tap (washer/valve) | R150–R300 | R200–R400 | R300–R550 |
| Burst pipe (accessible) | R350–R650 | R450–R850 | R650–R1,200 |
| Toilet cistern repair | R180–R350 | R240–R450 | R350–R620 |
| Geyser replacement | R2,000–R3,200 | R2,600–R4,000 | R3,200–R5,200 |
| Light fitting replacement | R200–R400 | R260–R520 | R380–R700 |
| DB board fault / trip | R350–R800 | R450–R1,050 | R650–R1,400 |
| Ceiling crack repair | R300–R700 | R400–R900 | R580–R1,200 |
| Roof leak (minor) | R500–R1,200 | R650–R1,600 | R950–R2,200 |
| Garden tidy / cut | R250–R600 | R320–R800 | R500–R1,100 |
| Paint 1 room interior | R600–R1,400 | R800–R1,800 | R1,200–R2,500 |

---

## 14. Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Time from job post to assignment | < 30 minutes | System timestamps (created_at → assigned_at) |
| Homeowner grade selection rate | > 60% | Jobs where grade was selected / total jobs posted |
| Artisan response rate (platform avg) | > 70% | Broadcasts with Accept or Decline / total broadcasts |
| Job completion rate | > 90% | Assigned → Completed / total assigned |
| Average homeowner rating | > 4.5 / 5 | Review averages |
| Artisan retention (90 days) | > 70% | Still active after 90 days |
| Estimate accuracy | Within 20% of final | (Final − Estimate High) / Final |
| Dispute rate | < 5% | Disputes raised / total completed jobs |
| Seller listing approval time | < 24 hours | Registration → admin approval timestamp |

---

## 15. MVP Scope — Phase 1 (Launch)

| Feature | Phase 1 | Notes |
|---------|---------|-------|
| Homeowner job form (text + photo) | ✅ Launch | Core flow |
| AI estimation (Claude / GPT-4o) | ✅ Launch | With confidence levels and ranges |
| Gold / Silver / Blue grade toggle | ✅ Launch | |
| Wave broadcasting (3 waves) | ✅ Launch | Email notifications |
| First-to-accept atomic logic | ✅ Launch | Race condition handled |
| Worker dashboard + response rate | ✅ Launch | |
| Post-job review (5 dimensions) | ✅ Launch | |
| Grade calculation (monthly) | ✅ Launch | |
| Payment (escrow-style) | ✅ Launch | Peach Payments |
| Seller/materials profile & listings | ✅ Launch | Admin approval required |
| Admin dashboard (MVP) | ✅ Launch | Required for safe operations |
| Public price guide page | ✅ Launch | SEO + trust |
| Learning modules (2 modules) | ✅ Launch | M1 + M2 |
| SMS for urgent jobs | Phase 2 | AWS SNS |
| Low confidence inspection flow | Phase 2 | |
| Seller in-platform enquiry form | Phase 2 | |
| Push notifications | Phase 3 (native app) | AWS SNS Mobile Push |
| WhatsApp integration | Phase 3 (native app) | Twilio / 360dialog |

---

*Project Khaya · System Specification v1.0 · projectkhaya.co.za · June 2026 · CONFIDENTIAL*
