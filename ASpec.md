# Project Khaya — AI Estimation Prompt Specification
> For developer execution · Claude claude-sonnet / GPT-4o · Vision-enabled · June 2026
> Production specification — implement exactly as written.

---

## 1. Purpose & Context

This document specifies the exact AI prompt, input/output contract, error handling, fallback logic, and integration requirements for the Project Khaya AI Estimation Engine.

**What this prompt does:**
- Receives a homeowner job description and up to 3 photos of a home maintenance problem
- Returns a structured JSON object with confidence level, cost range, solution summary, and parts/labour breakdown
- Powers the estimate display shown to the homeowner before they select a grade (Gold/Silver/Blue)
- Runs on every job posted — estimate accuracy is the single biggest trust factor on the platform

---

## 2. System Prompt (Exact — Do Not Modify Without Testing)

> ⚠️ This system prompt must be passed verbatim as the `system` parameter in every API call. Any modification must be regression-tested against the test cases in Section 7 before deploying to production.

```
You are the AI Estimation Engine for Project Khaya, a home services marketplace
serving the KZN Midlands (Estcourt and surrounding areas) in South Africa.

Your job is to analyse a home maintenance problem and return a structured cost
estimate that will be shown to a homeowner before they hire a tradesperson.

CRITICAL RULES:
1. Return ONLY valid JSON. No preamble, no explanation, no markdown backticks.
2. Never return a single price. Always return a range (low and high).
3. Be conservative — wide ranges protect trust more than false precision.
4. Use South African pricing (Builders Warehouse, Chamberlains, local rates).
5. Labour rates: Gold R450/hr | Silver R350/hr | Blue R250/hr.
6. If confidence is LOW, make the range wide (e.g. R500–R2500).
7. Do not include travel cost — this is calculated separately.
8. The solution field must be 20 words or fewer.
9. All monetary values are integers in South African Rands (ZAR).
10. If you cannot assess the problem at all, return confidence: "low" with
    maximum ranges and solution: "On-site inspection required."
```

---

## 3. User Prompt Template

Substitute placeholders with actual job data at runtime:

```
Analyse the following home maintenance job posted on Project Khaya.

TRADE CATEGORY: {category}
PROBLEM DESCRIPTION: {description}
URGENCY: {urgency}
LOCATION: {location}

Photos are attached ({photo_count} photo(s)).

Return a JSON object with this exact structure:
{
  "confidence": "high" | "medium" | "low",
  "estimate_low": integer,
  "estimate_high": integer,
  "solution": "string (max 20 words)",
  "parts_cost_low": integer,
  "parts_cost_high": integer,
  "labour_hours_low": float,
  "labour_hours_high": float,
  "reasoning": "string (max 30 words — for internal logging only, not shown to user)"
}
```

---

## 4. Confidence Level Definitions

| Level | Trigger Conditions | Range Width | Inspection Required |
|-------|-------------------|-------------|---------------------|
| HIGH | Photo clearly shows issue. Standard fix with known parts. No hidden variables. Common job type. | Narrow (e.g. R200–R400) | No |
| MEDIUM | Some uncertainty. Possible hidden damage, unclear access, non-standard installation, or multiple possible causes. | Moderate (e.g. R400–R900) | Recommended |
| LOW | Cannot see root cause. Structural or concealed issue. Multi-trade problem. No photo or unclear photo. | Wide (e.g. R500–R2500) | REQUIRED (free 30 min) |

---

## 5. API Call Specification

### 5.1 Endpoint & Model

| Parameter | Value |
|-----------|-------|
| Model (Claude) | `claude-sonnet-4-20250514` — always use Sonnet (cost/quality balance) |
| Model (OpenAI fallback) | `gpt-4o` (vision-enabled) |
| max_tokens | 800 |
| temperature | 0.1 (low — we want consistent, not creative, responses) |
| Endpoint | `https://api.anthropic.com/v1/messages` |

### 5.2 Request Structure (Claude)

```javascript
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 800,
  "temperature": 0.1,
  "system": "<SYSTEM PROMPT FROM SECTION 2>",
  "messages": [
    {
      "role": "user",
      "content": [
        // For each photo (up to 3):
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/jpeg",  // or image/png
            "data": "<BASE64_ENCODED_IMAGE>"
          }
        },
        // Then the text prompt:
        {
          "type": "text",
          "text": "<USER PROMPT FROM SECTION 3 WITH SUBSTITUTIONS>"
        }
      ]
    }
  ]
}
```

### 5.3 Response Parsing

```javascript
const raw = response.content[0].text;

// Strip any accidental markdown fences (defensive)
const cleaned = raw.replace(/```json|```/g, '').trim();

let estimate;
try {
  estimate = JSON.parse(cleaned);
} catch (err) {
  // See Section 6: Fallback Logic
  estimate = getFallbackEstimate(jobCategory);
}

// Validate required fields before saving
const required = ['confidence', 'estimate_low', 'estimate_high', 'solution',
                  'parts_cost_low', 'parts_cost_high', 'labour_hours_low', 'labour_hours_high'];
const isValid = required.every(f => estimate[f] !== undefined && estimate[f] !== null);

if (!isValid) {
  estimate = getFallbackEstimate(jobCategory);
}

// Sanity checks
if (estimate.estimate_low > estimate.estimate_high) {
  [estimate.estimate_low, estimate.estimate_high] = [estimate.estimate_high, estimate.estimate_low];
}
if (estimate.estimate_high - estimate.estimate_low < 50) {
  // Range too narrow — widen by 20% each side
  const mid = (estimate.estimate_low + estimate.estimate_high) / 2;
  estimate.estimate_low = Math.floor(mid * 0.8);
  estimate.estimate_high = Math.ceil(mid * 1.2);
}
```

---

## 6. Fallback Logic

If the AI call fails, times out, or returns invalid JSON, use these category-level defaults. **Never block the homeowner from posting — always return an estimate.**

| Trade Category | Fallback Low | Fallback High | Fallback Confidence |
|----------------|-------------|---------------|---------------------|
| Plumbing | R300 | R1,800 | low |
| Electrical | R400 | R2,500 | low |
| Building / Structural | R500 | R5,000 | low |
| Gardening | R200 | R800 | low |
| Handyman | R250 | R1,200 | low |
| Unknown / Other | R300 | R3,000 | low |

```javascript
function getFallbackEstimate(category) {
  const defaults = {
    plumbing:   { low: 300,  high: 1800 },
    electrical: { low: 400,  high: 2500 },
    building:   { low: 500,  high: 5000 },
    gardening:  { low: 200,  high: 800  },
    handyman:   { low: 250,  high: 1200 },
  };
  const d = defaults[category?.toLowerCase()] || { low: 300, high: 3000 };
  return {
    confidence: "low",
    estimate_low: d.low,
    estimate_high: d.high,
    solution: "On-site inspection required — we could not auto-estimate this job.",
    parts_cost_low: 0,
    parts_cost_high: 0,
    labour_hours_low: 0,
    labour_hours_high: 0,
    reasoning: "Fallback — AI call failed or returned invalid response.",
    is_fallback: true
  };
}
```

---

## 7. Test Cases (Must Pass Before Production Deploy)

Run all test cases against the live API before deploying. Log AI responses for the first 30 jobs in production and manually verify estimate vs final price.

| ID | Description | Photos | Expected Confidence | Expected Range |
|----|-------------|--------|---------------------|----------------|
| T1 | Dripping tap — washer needs replacing. Clear photo of tap. | 1 photo | HIGH | R180–R420 |
| T2 | Burst pipe under kitchen sink. Photo shows wet cabinet. | 1 photo | HIGH/MEDIUM | R400–R900 |
| T3 | Geyser not heating. No photo, text description only. | 0 photos | LOW | R500–R3,000 |
| T4 | Cracked wall — homeowner unsure if structural. Blurry photo. | 1 blurry photo | LOW | R500–R5,000 |
| T5 | Garden overgrown. Clear photo of full garden. | 2 photos | HIGH/MEDIUM | R300–R800 |
| T6 | No power in one room. Breaker keeps tripping. | 0 photos | LOW | R400–R2,000 |
| T7 | Toilet running constantly. Clear photo of cistern internals. | 1 photo | HIGH | R200–R450 |
| T8 | Empty description, no photo submitted. | 0 photos | LOW (fallback) | Category default |

---

## 8. Error Handling & Monitoring

| Error Scenario | Handling | Log Level |
|----------------|---------|-----------|
| AI API timeout (>15 sec) | Return fallback estimate. Log job_id + error. Do not block homeowner. | WARN |
| API rate limit (429) | Retry after 2 sec (max 2 retries). If still failing, use fallback. | WARN |
| Invalid JSON returned | Log raw response. Use fallback. | ERROR |
| estimate_low > estimate_high | Swap values. Log anomaly. | WARN |
| Range < R50 | Widen by 20% each side. Log anomaly. | WARN |
| Confidence field missing or invalid | Default to "low". Log anomaly. | ERROR |
| Image too large (>5MB) | Compress to 1MB max before sending. Reject if compression fails. | INFO |
| API key missing/invalid (401) | Alert Super Admin immediately. Platform cannot accept jobs. | CRITICAL |

### Monitoring Requirements

Log every AI estimation call to AWS CloudWatch with:
`job_id, category, photo_count, confidence_returned, estimate_low, estimate_high, latency_ms, is_fallback`

Set CloudWatch alarm: alert if >5% of estimates in a 1-hour window are fallbacks.

Weekly review: compare `estimate_high` vs `final_price` for all completed jobs. Target: within 20%.

---

## 9. Public Price Guide Reference (`/price-guide` page)

These ranges are static content managed by admin — not AI-generated. They are displayed publicly (no login required) to anchor homeowner expectations before posting. Update quarterly.

| Job Type | Category | Blue Range | Silver Range | Gold Range |
|----------|----------|------------|-------------|------------|
| Leaking tap (washer/valve) | Plumbing | R150–R300 | R200–R400 | R300–R550 |
| Burst pipe (accessible) | Plumbing | R350–R650 | R450–R850 | R650–R1,200 |
| Toilet cistern repair | Plumbing | R180–R350 | R240–R450 | R350–R620 |
| Geyser replacement | Plumbing | R2,000–R3,200 | R2,600–R4,000 | R3,200–R5,200 |
| Light fitting replacement | Electrical | R200–R400 | R260–R520 | R380–R700 |
| DB board fault / trip | Electrical | R350–R800 | R450–R1,050 | R650–R1,400 |
| Ceiling crack repair | Building | R300–R700 | R400–R900 | R580–R1,200 |
| Roof leak (minor) | Building | R500–R1,200 | R650–R1,600 | R950–R2,200 |
| Garden tidy / cut | Gardening | R250–R600 | R320–R800 | R500–R1,100 |
| Painting (1 room interior) | Handyman | R600–R1,400 | R800–R1,800 | R1,200–R2,500 |

> ⚠️ These are static ranges — NOT generated by AI. They exist to build trust before the homeowner posts a job. The AI generates a job-specific range after the photo is uploaded. The two should be broadly consistent — if not, check the AI prompt calibration.

---

## 10. Developer Quick Reference

| Item | Value |
|------|-------|
| AI Model (primary) | `claude-sonnet-4-20250514` via `api.anthropic.com/v1/messages` |
| AI Model (fallback) | `gpt-4o` via `api.openai.com/v1/chat/completions` |
| Temperature | 0.1 |
| Max tokens | 800 |
| Timeout | 15 seconds |
| Max retries | 2 (with 2-sec delay) |
| Max image size | 1MB per image (compress before sending) |
| Max photos per job | 3 |
| Image storage | AWS S3 — store originals, send compressed to AI |
| Log destination | AWS CloudWatch — `project-khaya/ai-estimates` log group |
| Fallback trigger | Parse failure OR API error OR timeout |
| Estimate accuracy target | Final price within 20% of estimate_high |

---

*Project Khaya · AI Estimation Prompt Specification · Production · projectkhaya.co.za · June 2026 · CONFIDENTIAL*
