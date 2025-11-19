# JobDetail Page Fixes Needed

## Issues Found

### 1. Wrong Parameter Name for job.getById
**Frontend:** `trpc.job.getById.useQuery({ id: jobId })`  
**Backend expects:** `{ jobId: string }`  
**Fix:** Change frontend to pass `jobId` instead of `id`, and convert number to string

### 2. Wrong Endpoint Name for Bids
**Frontend:** `trpc.bid.getByJob.useQuery({ jobId })`  
**Backend has:** `getJobBids` not `getByJob`  
**Fix:** Change frontend to use `trpc.bid.getJobBids.useQuery({ jobId })`

### 3. Missing review.getByJob Endpoint
**Frontend:** `trpc.review.getByJob.useQuery({ jobId })`  
**Backend:** No review router exists!  
**Fix:** Either remove review calls or create review router

### 4. Missing ai.generateBidProposal Endpoint
**Frontend:** `trpc.ai.generateBidProposal.useMutation()`  
**Backend:** AI router exists but no generateBidProposal  
**Fix:** Add generateBidProposal to AI router

### 5. Wrong Endpoint Name for bid.create
**Frontend:** `trpc.bid.create.useMutation()`  
**Backend has:** `submit` not `create`  
**Fix:** Change frontend to use `trpc.bid.submit.useMutation()`

## Quick Fixes

### Option A: Fix Frontend (Faster)
Change JobDetail.tsx to match existing backend endpoints

### Option B: Add Missing Backend Endpoints
Add review router and generateBidProposal to AI router

**Recommendation:** Do both - fix frontend for immediate fix, add missing features for completeness
