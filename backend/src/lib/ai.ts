/**
 * AI Integration with AWS Bedrock
 * Price suggestions, chat summaries, semantic search
 */

import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockClient } from '../config/aws.js';

const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

/**
 * Invoke Claude model
 */
async function invokeClaude(prompt: string): Promise<string> {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };
  
  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    body: JSON.stringify(payload),
    contentType: 'application/json',
    accept: 'application/json'
  });
  
  try {
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content[0].text;
  } catch (error) {
    console.error('Bedrock error:', error);
    throw new Error('AI service unavailable');
  }
}

/**
 * Generate job price and timeline suggestions
 */
export async function suggestJobPricing(params: {
  title: string;
  description: string;
  category: string;
  location: string;
}): Promise<{
  priceRange: { min: number; max: number };
  timelineDays: number;
  confidence: number;
  reasoning: string;
}> {
  const prompt = `You are an expert in South African construction and home services pricing in KwaZulu-Natal.

Job Details:
- Title: ${params.title}
- Description: ${params.description}
- Category: ${params.category}
- Location: ${params.location}

Based on typical market rates in KZN, provide:
1. Realistic price range in ZAR (min and max)
2. Estimated timeline in days
3. Confidence level (0-1)
4. Brief reasoning

Respond in JSON format:
{
  "priceMin": number,
  "priceMax": number,
  "timelineDays": number,
  "confidence": number,
  "reasoning": "string"
}`;

  const response = await invokeClaude(prompt);
  
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    return {
      priceRange: {
        min: data.priceMin,
        max: data.priceMax
      },
      timelineDays: data.timelineDays,
      confidence: data.confidence,
      reasoning: data.reasoning
    };
  } catch (error) {
    console.error('AI parsing error:', error);
    // Return fallback values
    return {
      priceRange: { min: 1000, max: 5000 },
      timelineDays: 7,
      confidence: 0.5,
      reasoning: 'Unable to generate accurate estimate. Please consult with workers for quotes.'
    };
  }
}

/**
 * Summarize chat conversation
 */
export async function summarizeConversation(messages: Array<{
  sender: string;
  message: string;
  timestamp: string;
}>): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: Array<{ description: string; assignedTo?: string }>;
  sentiment: 'positive' | 'neutral' | 'negative';
}> {
  const conversationText = messages
    .map(m => `${m.sender} (${m.timestamp}): ${m.message}`)
    .join('\n');
  
  const prompt = `Summarize this conversation between a homeowner and a worker on Project Khaya:

${conversationText}

Provide:
1. Brief summary (2-3 sentences)
2. Key points discussed (bullet points)
3. Action items with who should do them
4. Overall sentiment (positive/neutral/negative)

Respond in JSON format:
{
  "summary": "string",
  "keyPoints": ["string"],
  "actionItems": [{"description": "string", "assignedTo": "string"}],
  "sentiment": "positive|neutral|negative"
}`;

  const response = await invokeClaude(prompt);
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('AI parsing error:', error);
    return {
      summary: 'Conversation summary unavailable',
      keyPoints: [],
      actionItems: [],
      sentiment: 'neutral'
    };
  }
}

/**
 * Generate semantic search embeddings
 * (Simplified version - in production, use proper embedding models)
 */
export async function generateSearchEmbedding(text: string): Promise<number[]> {
  // In production, use a proper embedding model
  // For now, return a simple hash-based embedding
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  // Generate a 128-dimensional embedding
  const embedding: number[] = [];
  for (let i = 0; i < 128; i++) {
    embedding.push(Math.sin(hash + i) * 0.5 + 0.5);
  }
  
  return embedding;
}

/**
 * Calculate similarity between two embeddings
 */
export function calculateSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have same dimensions');
  }
  
  // Cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
