import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.AI_MODEL_OPENAI || 'gpt-4o-mini';

export interface ParseSearchQueryInput {
  query: string;
}

export interface ParsedSearchFilters {
  category?: string;
  location?: string;
  budgetMin?: number;
  budgetMax?: number;
  keywords: string[];
  urgency?: 'urgent' | 'normal' | 'flexible';
}

export async function parseSearchQuery(
  input: ParseSearchQueryInput
): Promise<ParsedSearchFilters> {
  const prompt = `Parse this natural language search query into structured filters for a construction job marketplace:

Query: "${input.query}"

Extract and return a JSON object with these fields:
- category: string (e.g., "Plumbing", "Electrical", "Construction", "Painting", etc.) or null
- location: string (city/area in South Africa) or null
- budgetMin: number (in Rand) or null
- budgetMax: number (in Rand) or null
- keywords: array of relevant search terms
- urgency: "urgent" | "normal" | "flexible" or null

Examples:
"need cheap plumber in durban" -> {"category": "Plumbing", "location": "Durban", "budgetMin": null, "budgetMax": 1000, "keywords": ["plumber", "cheap"], "urgency": null}
"urgent electrician estcourt under R2000" -> {"category": "Electrical", "location": "Estcourt", "budgetMin": null, "budgetMax": 2000, "keywords": ["electrician"], "urgency": "urgent"}

Return ONLY valid JSON, no explanation.`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a search query parser. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    // Ensure keywords is always an array
    if (!Array.isArray(parsed.keywords)) {
      parsed.keywords = [];
    }

    return parsed as ParsedSearchFilters;
  } catch (error) {
    console.error('[AI] Error parsing search query:', error);
    // Fallback: return basic keyword search
    return {
      keywords: input.query.toLowerCase().split(' ').filter(w => w.length > 2),
    };
  }
}

export interface MaterialRecommendationInput {
  jobTitle: string;
  jobDescription: string;
  category?: string;
}

export interface MaterialRecommendation {
  name: string;
  quantity: string;
  estimatedCost: string;
  priority: 'essential' | 'recommended' | 'optional';
}

export async function recommendMaterials(
  input: MaterialRecommendationInput
): Promise<MaterialRecommendation[]> {
  const prompt = `You are a construction materials expert in South Africa.

Based on this job, recommend materials needed:

Job Title: ${input.jobTitle}
Description: ${input.jobDescription}
Category: ${input.category || 'General'}

Provide a list of materials with:
- name: Material name
- quantity: Estimated quantity needed
- estimatedCost: Estimated cost in Rand (e.g., "R500-800")
- priority: "essential" | "recommended" | "optional"

Return a JSON array of materials. Limit to 5-8 most important items.
Return ONLY valid JSON, no explanation.

Example:
[
  {"name": "PVC Pipes (110mm)", "quantity": "3 meters", "estimatedCost": "R150-200", "priority": "essential"},
  {"name": "Pipe Fittings", "quantity": "5 pieces", "estimatedCost": "R100-150", "priority": "essential"}
]`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a construction materials expert. Return only valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('[AI] Error recommending materials:', error);
    return [];
  }
}

export interface PriceTrendInput {
  category: string;
  location?: string;
}

export interface PriceTrend {
  category: string;
  averagePrice: string;
  priceRange: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  insights: string;
}

export async function analyzePriceTrends(
  input: PriceTrendInput
): Promise<PriceTrend> {
  const prompt = `Analyze typical pricing for construction services in South Africa:

Category: ${input.category}
Location: ${input.location || 'General South Africa'}

Provide pricing insights:
- averagePrice: Typical price range (e.g., "R500-1500 per day")
- priceRange: Min to max range (e.g., "R300-3000")
- trend: "increasing" | "stable" | "decreasing"
- insights: Brief explanation (1-2 sentences)

Return ONLY valid JSON, no explanation.

Example:
{
  "category": "Plumbing",
  "averagePrice": "R500-1500 per day",
  "priceRange": "R300-3000",
  "trend": "stable",
  "insights": "Plumbing rates in South Africa are stable, with experienced plumbers charging R800-1500 per day for standard residential work."
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a construction pricing analyst. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as PriceTrend;
  } catch (error) {
    console.error('[AI] Error analyzing price trends:', error);
    return {
      category: input.category,
      averagePrice: 'Data unavailable',
      priceRange: 'Data unavailable',
      trend: 'stable',
      insights: 'Unable to analyze pricing trends at this time.',
    };
  }
}
