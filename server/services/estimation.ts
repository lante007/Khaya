/**
 * AI Cost Estimation Service (ASpec.md)
 *
 * Accepts job description + optional base64 photos.
 * Returns a structured estimate with:
 *   - Low / Mid / High price range (ZAR)
 *   - Confidence level: High | Medium | Low
 *   - Line-item breakdown (labour, materials, travel)
 *   - Reasoning summary
 *   - Suggested grade tier for the job
 *
 * Uses Claude claude-sonnet with vision when photos are provided.
 * Falls back to text-only estimate if vision fails or no photos given.
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const VISION_MODEL = 'claude-sonnet-4-5';
const TEXT_MODEL = process.env.AI_MODEL_CLAUDE || 'claude-3-haiku-20240307';

export interface EstimationInput {
  title: string;
  description: string;
  category: string;
  location: string;
  /** Base64-encoded images (JPEG/PNG), max 5 */
  photos?: string[];
  /** Buyer-provided budget hint (cents) */
  budgetHint?: number;
}

export interface LineItem {
  label: string;
  low: number;   // ZAR
  mid: number;
  high: number;
}

export interface EstimationResult {
  low: number;          // ZAR total
  mid: number;
  high: number;
  confidence: 'High' | 'Medium' | 'Low';
  lineItems: LineItem[];
  reasoning: string;
  suggestedGrade: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  disclaimer: string;
  usedVision: boolean;
}

const SYSTEM_PROMPT = `You are a South African construction cost estimator with 20 years of experience across residential and commercial projects in small towns and townships.

Your job is to provide realistic cost estimates in South African Rand (ZAR) for home improvement and construction jobs.

Rules:
- Use current South African labour and material rates (2024–2025)
- Account for small-town pricing (typically 10–20% lower than Johannesburg/Cape Town)
- Always provide Low / Mid / High ranges
- Be conservative — underestimating is worse than overestimating
- Confidence: High = clear scope + photos, Medium = clear scope no photos, Low = vague description
- Suggested grade: Bronze = basic handyman, Silver = skilled tradesperson, Gold = specialist, Platinum = master craftsman

Respond ONLY with valid JSON matching this exact schema:
{
  "low": number,
  "mid": number,
  "high": number,
  "confidence": "High" | "Medium" | "Low",
  "lineItems": [
    { "label": string, "low": number, "mid": number, "high": number }
  ],
  "reasoning": string (2–3 sentences),
  "suggestedGrade": "Bronze" | "Silver" | "Gold" | "Platinum",
  "disclaimer": string (1 sentence)
}`;

function buildTextPrompt(input: EstimationInput): string {
  const budget = input.budgetHint
    ? `\nBuyer budget hint: R${(input.budgetHint / 100).toFixed(0)}`
    : '';
  return `Estimate the cost for this job:

Title: ${input.title}
Category: ${input.category}
Location: ${input.location}
Description: ${input.description}${budget}

Provide a detailed cost breakdown.`;
}

function buildVisionMessages(input: EstimationInput): Anthropic.MessageParam[] {
  const textContent: Anthropic.TextBlockParam = {
    type: 'text',
    text: buildTextPrompt(input),
  };

  const imageBlocks: Anthropic.ImageBlockParam[] = (input.photos ?? [])
    .slice(0, 5)
    .map(base64 => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: base64.replace(/^data:image\/\w+;base64,/, ''),
      },
    }));

  return [{ role: 'user', content: [textContent, ...imageBlocks] }];
}

function parseEstimateResponse(text: string): EstimationResult {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  // Validate required fields
  const required = ['low', 'mid', 'high', 'confidence', 'lineItems', 'reasoning', 'suggestedGrade'];
  for (const field of required) {
    if (!(field in parsed)) throw new Error(`Missing field: ${field}`);
  }

  return {
    low: Math.round(parsed.low),
    mid: Math.round(parsed.mid),
    high: Math.round(parsed.high),
    confidence: parsed.confidence,
    lineItems: parsed.lineItems ?? [],
    reasoning: parsed.reasoning ?? '',
    suggestedGrade: parsed.suggestedGrade ?? 'Bronze',
    disclaimer: parsed.disclaimer ?? 'This is an AI-generated estimate. Actual costs may vary.',
    usedVision: false,
  };
}

/**
 * Generate a cost estimate for a job.
 * Uses vision model when photos are provided, falls back to text-only.
 */
export async function estimateJobCost(input: EstimationInput): Promise<EstimationResult> {
  const hasPhotos = (input.photos?.length ?? 0) > 0;

  // Attempt vision-enabled estimate first
  if (hasPhotos) {
    try {
      const message = await anthropic.messages.create({
        model: VISION_MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: buildVisionMessages(input),
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const result = parseEstimateResponse(content.text);
        result.usedVision = true;
        return result;
      }
    } catch (err) {
      console.warn('[ESTIMATION] Vision model failed, falling back to text-only:', err);
    }
  }

  // Text-only fallback
  const message = await anthropic.messages.create({
    model: TEXT_MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildTextPrompt(input) }],
  });

  const content = message.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response format from AI');

  return parseEstimateResponse(content.text);
}

/**
 * Fallback estimate when AI is unavailable.
 * Uses category-based lookup table with SA market rates.
 */
export function fallbackEstimate(category: string): EstimationResult {
  const CATEGORY_RATES: Record<string, { low: number; mid: number; high: number; grade: EstimationResult['suggestedGrade'] }> = {
    plumbing:      { low: 500,   mid: 1500,  high: 5000,  grade: 'Silver' },
    electrical:    { low: 800,   mid: 2500,  high: 8000,  grade: 'Gold' },
    painting:      { low: 1500,  mid: 4000,  high: 12000, grade: 'Bronze' },
    tiling:        { low: 2000,  mid: 6000,  high: 15000, grade: 'Silver' },
    roofing:       { low: 5000,  mid: 15000, high: 40000, grade: 'Gold' },
    carpentry:     { low: 1000,  mid: 3500,  high: 10000, grade: 'Silver' },
    construction:  { low: 10000, mid: 30000, high: 80000, grade: 'Platinum' },
    cleaning:      { low: 300,   mid: 800,   high: 2000,  grade: 'Bronze' },
    landscaping:   { low: 500,   mid: 2000,  high: 8000,  grade: 'Bronze' },
    default:       { low: 500,   mid: 2000,  high: 8000,  grade: 'Bronze' },
  };

  const key = category.toLowerCase();
  const rates = CATEGORY_RATES[key] ?? CATEGORY_RATES.default;

  return {
    low: rates.low,
    mid: rates.mid,
    high: rates.high,
    suggestedGrade: rates.grade,
    confidence: 'Low',
    lineItems: [
      { label: 'Labour', low: Math.round(rates.low * 0.6), mid: Math.round(rates.mid * 0.6), high: Math.round(rates.high * 0.6) },
      { label: 'Materials', low: Math.round(rates.low * 0.3), mid: Math.round(rates.mid * 0.3), high: Math.round(rates.high * 0.3) },
      { label: 'Travel & misc', low: Math.round(rates.low * 0.1), mid: Math.round(rates.mid * 0.1), high: Math.round(rates.high * 0.1) },
    ],
    reasoning: 'Estimate based on category averages. Add a description and photos for a more accurate estimate.',
    disclaimer: 'This is a rough category-based estimate. Actual costs depend on scope, materials, and location.',
    usedVision: false,
  };
}
