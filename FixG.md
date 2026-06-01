# Project Khaya — Developer Fix Guide (Launch Edition)
> 117 TypeScript errors triaged · June 2026

---

## The Short Version

| Priority | What | Time |
|----------|------|------|
| 🔴 Fix now | Delete `backend/` folder | 2 min |
| 🔴 Fix now | tRPC router name mismatches (5 files) | 20 min |
| 🔴 Fix now | Missing endpoints — stub them | 20 min |
| 🔴 Fix now | `.isLoading` → `.isPending` (one command) | 5 min |
| 🔴 Fix now | Field name mismatches (`.role`, `.trade`) | 10 min |
| 🔴 Fix now | StrengthMeter bad prop | 5 min |
| 🔴 Fix now | Chat property names | 15 min |
| 🔴 Fix now | WorkerResume input mismatch | 5 min |
| 🔴 Fix now | Stub ReviewForm for launch | 5 min |
| 🟡 48hrs | Email OTP, workers not displaying, Paystack live keys | — |
| ⚪ Decision | Delete backend/? AWS migration? AI feature? | — |

**Total estimated time: ~2.5 hours**

---

## 1. Error Triage

Of the 117 errors, ~60 come from the dead `backend/` folder. The rest are naming mismatches — not logic bugs.

| # | Error Type | Files | Effort |
|---|-----------|-------|--------|
| 1 | Legacy `backend/` folder with missing packages | `backend/` | `rm -rf` |
| 2 | tRPC router name mismatches | Workers, Showcase, Stories, Referrals | 20 min |
| 3 | tRPC endpoints missing entirely | Materials, Jobs, ReviewForm | 1–2 hr |
| 4 | TanStack Query v5: `.isLoading` → `.isPending` | `AuthNew.tsx` | 5 min |
| 5 | `.role` → `.userType`, `.trade` → `.trades` | Profile, ProviderOnboard | 10 min |
| 6 | Invalid `indicatorClassName` prop on Progress | `StrengthMeter.tsx` | 5 min |
| 7 | Wrong property names on message/user objects | ChatList, ChatWindow | 15 min |
| 8 | Query receives input it doesn't accept | `WorkerResume.tsx` | 5 min |
| 9 | No review router on backend | `ReviewForm.tsx` | stub |

---

## 2. Priority 1 Fixes

### Fix 1 — Delete the legacy `backend/` folder (~60 errors gone instantly)

```bash
# From project root:
rm -rf backend/

# Verify error count dropped:
pnpm check 2>&1 | grep "error TS" | wc -l
# Should now show ~57 (down from 117)
```

> ⚠️ Before deleting: run `diff -r backend/ server/` to confirm nothing in `backend/` is missing from `server/`.

---

### Fix 2 — tRPC Router Name Mismatches

Open `server/routers.ts` and check the exact keys on `appRouter`. Then update the frontend to match.

| File | Wrong | Fix to |
|------|-------|--------|
| `Workers.tsx`, `WorkerDetail.tsx`, `Showcase.tsx` | `trpc.profile.*` | `trpc.workers.*` (verify exact name in routers.ts) |
| `Stories.tsx` | `trpc.story.*` | `trpc.stories.*` |
| `Referrals.tsx` | `trpc.referral.*` | `trpc.referrals.*` |

```bash
# Quick way to see all router names:
grep -n "Router\|router" server/routers.ts | head -30
```

---

### Fix 2b — Materials endpoints missing entirely

Frontend calls `trpc.listing.getAvailable` and `trpc.listing.getById` — neither exists. Add stubs:

**Create `server/routers/listing.router.ts`:**

```typescript
import { router, publicProcedure } from "../trpc";
import { z } from "zod";

export const listingRouter = router({
  getAvailable: publicProcedure.query(async () => {
    return []; // TODO: wire up DB query post-launch
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return null; // TODO: wire up DB query post-launch
    }),
});
```

**Then add to `server/routers.ts`:**

```typescript
import { listingRouter } from "./routers/listing.router";

export const appRouter = router({
  // ...existing routers
  listing: listingRouter,
});
```

---

### Fix 2c — `Jobs.tsx` calls `trpc.job.parseSearch` (doesn't exist)

Remove AI search for launch. Use basic client-side filter instead:

```typescript
// REMOVE:
// const parsed = trpc.job.parseSearch.useQuery({ query: searchText });

// REPLACE WITH:
const allJobs = trpc.job.getAll.useQuery();
const filtered = allJobs.data?.filter(j =>
  j.title.toLowerCase().includes(searchText.toLowerCase()) ||
  j.description?.toLowerCase().includes(searchText.toLowerCase())
) ?? [];
```

> AI-powered natural language search can be wired up post-launch.

---

### Fix 3 — `.isLoading` → `.isPending` (TanStack Query v5)

```bash
# Find all affected files:
grep -r "\.isLoading" client/src --include="*.tsx" --include="*.ts" -l

# Replace all at once:
find client/src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/\.isLoading/.isPending/g'
```

---

### Fix 4 — Field Name Mismatches

**`client/src/pages/Profile.tsx`**

```typescript
// BEFORE:
if (user.role === "worker") {
const isAdmin = user.role === "admin";

// AFTER:
if (user.userType === "worker") {
const isAdmin = user.userType === "admin";
```

**`client/src/pages/ProviderOnboard.tsx`**

```typescript
// BEFORE:
formData.trade

// AFTER:
formData.trades
```

---

### Fix 5 — StrengthMeter invalid prop

**`client/src/components/StrengthMeter.tsx`**

```tsx
// BEFORE:
<Progress value={strength} indicatorClassName="bg-green-500" />

// AFTER:
<Progress value={strength} className="[&>div]:bg-green-500" />
```

---

### Fix 6 — Chat property names

Check the exact field names returned by the messages router, then update the frontend to match:

```bash
# Find the chat/messages router:
grep -n "message\|chat\|conversation" server/routers.ts

# Common mismatches to check in ChatList.tsx and ChatWindow.tsx:
# message.senderId  vs  message.sender_id  vs  message.from
# message.createdAt  vs  message.timestamp  vs  message.created_at
# user.displayName  vs  user.name  vs  user.fullName
```

---

### Fix 7 — WorkerResume passes input to a no-input query

**`client/src/pages/WorkerResume.tsx`**

```typescript
// BEFORE:
const resume = trpc.worker.getResume.useQuery({ userId: id });

// OPTION A — if endpoint uses auth context (no input needed):
const resume = trpc.worker.getResume.useQuery();

// OPTION B — if endpoint should take userId, fix the backend:
// getResume: protectedProcedure
//   .input(z.object({ userId: z.string() }))
//   .query(async ({ input, ctx }) => { ... })
```

Check `server/routers.ts` to see which applies.

---

### Fix 8 — ReviewForm: Stub for launch

No review router exists on the backend. Quickest fix for today:

**`client/src/components/ReviewForm.tsx`**

```typescript
// Comment out the tRPC call:
// const submitReview = trpc.review.create.useMutation();

const handleSubmit = async () => {
  // TODO: wire up post-launch
  toast({ title: "Review submitted!", description: "Thank you for your feedback." });
  onClose();
};
```

**Full review router for post-launch (create `server/routers/review.router.ts`):**

```typescript
export const reviewRouter = router({
  create: protectedProcedure
    .input(z.object({
      jobId: z.string(),
      workmanship: z.number().min(1).max(5),
      onTime: z.number().min(1).max(5),
      communication: z.number().min(1).max(5),
      cleanliness: z.number().min(1).max(5),
      fairPricing: z.number().min(1).max(5),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Save to DB, update artisan avg_rating
    }),
});
```

---

## 3. Verification Checklist

```bash
# 1. Confirm 0 TypeScript errors:
pnpm check 2>&1 | grep "error TS" | wc -l

# 2. Start dev server:
pnpm dev
```

**Manual smoke test — check each page loads with no console errors:**

- [ ] `/` — Home page loads
- [ ] `/workers` — Workers listed (not empty, no errors)
- [ ] `/materials` — Materials page loads
- [ ] `/jobs` — Jobs listed, search works
- [ ] `/stories` — Visible **without** logging in
- [ ] `/post-job` — Job form submits successfully
- [ ] `/login` — OTP flow works (SMS received)
- [ ] `/dashboard` — Worker dashboard loads after login
- [ ] `/admin` — Admin login works
- [ ] Submit a bid — No errors in console or Network tab

---

## 4. Priority 2 — Fix Within 48 Hours

| Item | What to Do |
|------|-----------|
| **Email OTP not sending** | Check AWS SES config. Verify sender domain is verified. Check if SES is still in sandbox mode — must request production access at `console.aws.amazon.com/ses`. |
| **Workers not displaying** | Check workers router query — ensure `is_active` filter isn't blocking all workers. Check DB has active test workers. |
| **Stories require login** | In the stories router, change `protectedProcedure` to `publicProcedure` for the `getAll` query. |
| **Review system** | Build the full review router (see Fix 8 Option B above). Hook up to score calculation. |
| **Paystack live keys** | Replace test keys in `.env` with live keys. Requires KYC-verified account at `paystack.com/za`. |
| **Legal content** | Replace placeholder text in `Terms.tsx` and `Privacy.tsx` with real SA-compliant content. |

---

## 5. Decisions Needed

| Decision | Options | Recommendation |
|----------|---------|----------------|
| `backend/` folder | Delete (dead code) vs Keep (if Lambda migration still planned) | **Delete it.** Active server is `server/`. Clean codebase = fewer bugs. |
| AWS architecture | Stay on Express + MySQL vs Migrate to Lambda + DynamoDB | **Stay on Express + MySQL for launch.** Migrate post-traction. |
| AI bid proposal | Wire it up now vs Leave as stub | **Leave for Week 2.** One less risk on launch day. |
| Referrals feature | Keep (5 min fix) vs Remove | **Keep it** — just a router rename. |

---

## 6. Launch Sequence

```
Step 1  rm -rf backend/                          → 2 min
Step 2  pnpm check (confirm ~57 errors)           → 1 min
Step 3  Fix tRPC router names (Fix 2)             → 20 min
Step 4  Add stub listings router + remove parseSearch → 20 min
Step 5  Fix .isLoading → .isPending (one command) → 5 min
Step 6  Fix .role → .userType, .trade → .trades   → 10 min
Step 7  Fix StrengthMeter prop                    → 5 min
Step 8  Fix Chat property names                   → 15 min
Step 9  Fix WorkerResume input                    → 5 min
Step 10 Stub ReviewForm                           → 5 min
Step 11 pnpm check → confirm 0 errors             → 1 min
Step 12 pnpm dev → smoke test all pages           → 30 min
Step 13 Deploy to AWS                             → 15–30 min
Step 14 Live homeowner + payment test             → 30 min
```

**Total: ~2.5 hours**

---

*Project Khaya · Developer Fix Guide · Launch Edition · June 2026*
