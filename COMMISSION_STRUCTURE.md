# 💰 Khaya Commission Structure

**Updated:** November 14, 2025  
**Model:** Dual-sided 5% commission

---

## 🎯 Commission Model

### Simple Rule
**We take 5% from BOTH parties on every transaction**

- **Buyer pays:** Job Amount + 5%
- **Worker receives:** Job Amount - 5%
- **Platform earns:** 10% total revenue

---

## 📊 Example Calculations

### Example 1: R1,000 Gardening Job

```
Job Amount (agreed price):     R1,000.00

BUYER SIDE:
  Job Amount:                  R1,000.00
  Service Fee (5%):            R   50.00
  ─────────────────────────────────────
  Buyer Pays Total:            R1,050.00
  
  Payment Schedule:
    Deposit (30%):             R  315.00  ← Paid upfront
    On Completion (70%):       R  735.00  ← Paid after verification

WORKER SIDE:
  Job Amount:                  R1,000.00
  Service Fee (5%):            R   50.00
  ─────────────────────────────────────
  Worker Receives:             R  950.00

PLATFORM:
  From Buyer:                  R   50.00
  From Worker:                 R   50.00
  ─────────────────────────────────────
  Total Revenue:               R  100.00  (10% of job amount)
```

---

### Example 2: R5,000 Plumbing Job

```
Job Amount:                    R5,000.00

Buyer Pays:                    R5,250.00  (R5,000 + R250)
  Deposit (30%):               R1,575.00
  On Completion (70%):         R3,675.00

Worker Receives:               R4,750.00  (R5,000 - R250)

Platform Revenue:              R  500.00  (R250 + R250)
```

---

### Example 3: R500 Small Job

```
Job Amount:                    R  500.00

Buyer Pays:                    R  525.00  (R500 + R25)
  Deposit (30%):               R  157.50
  On Completion (70%):         R  367.50

Worker Receives:               R  475.00  (R500 - R25)

Platform Revenue:              R   50.00  (R25 + R25)
```

---

## 💡 Why This Model?

### For Buyers
✅ **Transparent** - See exact fee upfront  
✅ **Fair** - Only 5% service fee  
✅ **Protected** - Escrow security  
✅ **Clear** - No hidden charges  

### For Workers
✅ **Competitive** - Only 5% commission  
✅ **Guaranteed** - Payment protected  
✅ **Simple** - Easy to calculate  
✅ **Fair** - Same rate for everyone  

### For Platform
✅ **Sustainable** - 10% total revenue  
✅ **Scalable** - Grows with volume  
✅ **Covers Costs** - Payment processing + operations  
✅ **Competitive** - Lower than most platforms  

---

## 📈 Revenue Projections

### Monthly Revenue Examples

#### Scenario 1: Early Stage (100 jobs/month)
```
Average Job Amount:            R1,000
Total Job Volume:              R100,000
Platform Revenue (10%):        R10,000
Paystack Fees (1%):            R1,050
Net Revenue:                   R8,950/month
```

#### Scenario 2: Growth Stage (500 jobs/month)
```
Average Job Amount:            R1,200
Total Job Volume:              R600,000
Platform Revenue (10%):        R60,000
Paystack Fees (1%):            R6,300
Net Revenue:                   R53,700/month
```

#### Scenario 3: Mature Stage (2,000 jobs/month)
```
Average Job Amount:            R1,500
Total Job Volume:              R3,000,000
Platform Revenue (10%):        R300,000
Paystack Fees (1%):            R31,500
Net Revenue:                   R268,500/month
```

---

## 🔄 Payment Flow

### Step-by-Step

**1. Job Posted**
- Buyer posts job: "Garden maintenance - R1,000"

**2. Worker Bids**
- Worker sees: R1,000 job
- Worker knows they'll receive: R950 (after 5% fee)

**3. Bid Accepted**
- System calculates:
  - Buyer total: R1,050 (R1,000 + R50)
  - Deposit: R315 (30% of R1,050)
  - Worker receives: R950 (R1,000 - R50)

**4. Buyer Pays Deposit**
- Buyer pays R315 via Paystack
- Funds held in escrow
- Worker notified to start

**5. Job Completed**
- Worker uploads proof
- Buyer verifies work
- Buyer pays remaining R735

**6. Payment Released**
- Worker receives R950
- Platform keeps R100 (R50 + R50)
- Transaction complete

---

## 💳 Payment Breakdown

### What Buyer Sees
```
┌─────────────────────────────────┐
│ Payment Summary                 │
├─────────────────────────────────┤
│ Job Amount:          R1,000.00  │
│ Service Fee (5%):    R   50.00  │
│ ─────────────────────────────── │
│ Total:               R1,050.00  │
│                                 │
│ Pay Now (30%):       R  315.00  │
│ On Completion (70%): R  735.00  │
└─────────────────────────────────┘
```

### What Worker Sees
```
┌─────────────────────────────────┐
│ Earnings Summary                │
├─────────────────────────────────┤
│ Job Amount:          R1,000.00  │
│ Service Fee (5%):    R   50.00  │
│ ─────────────────────────────── │
│ You Receive:         R  950.00  │
│                                 │
│ After job completion            │
└─────────────────────────────────┘
```

---

## 🆚 Comparison with Competitors

### Khaya vs Others

| Platform | Buyer Fee | Worker Fee | Total | Notes |
|----------|-----------|------------|-------|-------|
| **Khaya** | **5%** | **5%** | **10%** | **Fair to both** |
| Upwork | 0% | 20% | 20% | Worker pays all |
| Fiverr | 5.5% | 20% | 25.5% | High fees |
| TaskRabbit | 15% | 15% | 30% | Very high |
| Local Competitors | 10-15% | 10-15% | 20-30% | Higher fees |

**Khaya is the most competitive!** 🏆

---

## 🧮 Fee Calculator

### Quick Reference Table

| Job Amount | Buyer Pays | Worker Gets | Platform |
|------------|------------|-------------|----------|
| R100 | R105 | R95 | R10 |
| R500 | R525 | R475 | R50 |
| R1,000 | R1,050 | R950 | R100 |
| R2,000 | R2,100 | R1,900 | R200 |
| R5,000 | R5,250 | R4,750 | R500 |
| R10,000 | R10,500 | R9,500 | R1,000 |
| R20,000 | R21,000 | R19,000 | R2,000 |

---

## 📝 Implementation Details

### Database Schema
```typescript
interface Escrow {
  jobAmount: number;        // R1,000
  buyerFee: number;         // R50 (5%)
  buyerTotal: number;       // R1,050
  depositAmount: number;    // R315 (30% of R1,050)
  remainingAmount: number;  // R735 (70% of R1,050)
  workerFee: number;        // R50 (5%)
  workerReceives: number;   // R950
  platformRevenue: number;  // R100 (R50 + R50)
}
```

### API Response
```json
{
  "jobAmount": 100000,
  "buyerFee": 5000,
  "buyerTotal": 105000,
  "depositAmount": 31500,
  "remainingAmount": 73500,
  "workerFee": 5000,
  "workerReceives": 95000,
  "platformRevenue": 10000
}
```

---

## ✅ Benefits Summary

### Transparency
- ✅ All fees shown upfront
- ✅ No hidden charges
- ✅ Clear breakdown
- ✅ Easy to understand

### Fairness
- ✅ Both parties pay equally
- ✅ Lower than competitors
- ✅ Sustainable for platform
- ✅ Covers all costs

### Simplicity
- ✅ Easy to calculate
- ✅ Consistent rate
- ✅ No complex tiers
- ✅ Same for all jobs

---

## 🎯 Marketing Messages

### For Buyers
> "Only 5% service fee - lower than competitors!"
> "Pay R1,050 for a R1,000 job - simple and transparent"

### For Workers
> "Keep 95% of your earnings - best rates in SA!"
> "Earn R950 on a R1,000 job - fair and competitive"

### For Platform
> "10% revenue model - sustainable and scalable"
> "Lower fees = more users = more volume"

---

## 📊 Success Metrics

### Target Metrics
- **User Satisfaction:** > 90% find fees fair
- **Completion Rate:** > 95% of jobs complete
- **Revenue Growth:** 20% month-over-month
- **Cost Coverage:** Revenue > 10x costs

### Monitoring
- Track average job amount
- Monitor fee acceptance rate
- Compare with competitors
- Adjust if needed (rare)

---

## 🚀 Rollout Plan

### Phase 1: Launch (Week 1)
- Implement dual 5% model
- Update all UI/UX
- Clear communication
- Monitor feedback

### Phase 2: Optimize (Month 1)
- Gather user feedback
- Analyze completion rates
- Compare with competitors
- Fine-tune if needed

### Phase 3: Scale (Month 3+)
- Volume discounts (optional)
- Premium features (optional)
- Enterprise pricing (optional)
- Maintain core 5%/5% model

---

## ❓ FAQ

**Q: Why do both parties pay?**
A: Fair distribution of platform costs. Both benefit from escrow, support, and features.

**Q: Can fees be negotiated?**
A: No, standard 5%/5% for all users ensures fairness and simplicity.

**Q: Are there any other fees?**
A: No hidden fees. Only the 5% service fee from each party.

**Q: What if the job amount changes?**
A: Fees recalculate automatically based on final agreed amount.

**Q: Do fees apply to tips?**
A: No, tips go 100% to the worker (future feature).

---

## ✅ Summary

**Commission Structure:**
- 5% from buyer (added to job amount)
- 5% from worker (deducted from job amount)
- 10% total platform revenue

**Benefits:**
- Transparent and fair
- Lower than competitors
- Sustainable for platform
- Easy to understand

**Result:**
- Happy buyers (low fees)
- Happy workers (keep 95%)
- Sustainable platform (10% revenue)

---

**Status:** ✅ Implemented and Ready  
**Effective:** Immediately  
**Review:** Quarterly (or as needed)
