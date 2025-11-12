# Khaya Platform - AI Integration Guide
**Date**: 2024-11-12  
**APIs Available**: Claude (Anthropic), ChatGPT (OpenAI)

---

## 🤖 **AI Strategy Overview**

### **Core Principle**: AI as "Whispers, Not Shouts"
- Suggestions, not mandates
- User always in control
- Opt-out available
- Transparent reasoning

### **Use Cases by API**

#### **Claude API** (Anthropic)
**Best For**: Long-form, nuanced content
- Job description enhancement
- Bid proposal writing
- Chat assistant (Manus)
- Dispute mediation
- Complex reasoning

**Why Claude**:
- Better at understanding context
- More natural language
- Excellent at following instructions
- Good at explaining reasoning

#### **ChatGPT API** (OpenAI)
**Best For**: Quick, structured tasks
- Search query parsing
- Material recommendations
- Price trend analysis
- Simple classifications
- Fast responses

**Why ChatGPT**:
- Faster response times
- Lower cost for simple tasks
- Good at structured output
- JSON formatting

---

## 🚀 **Quick Start: First AI Feature**

### **Feature**: AI Job Description Enhancement
**Timeline**: 1 day  
**API**: Claude  
**Impact**: High

### **Step 1: Set Up Claude API** (30 min)

```bash
# Install Anthropic SDK
cd backend
npm install @anthropic-ai/sdk

# Add to .env
ANTHROPIC_API_KEY=your_api_key_here
```

### **Step 2: Create AI Service** (1 hour)

```typescript
// backend/src/lib/ai-claude.ts
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/aws.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || config.anthropicApiKey,
});

export interface EnhanceJobDescriptionInput {
  title: string;
  description: string;
  budget?: number;
  location?: string;
  category?: string;
}

export async function enhanceJobDescription(
  input: EnhanceJobDescriptionInput
): Promise<string> {
  const prompt = `You are a professional job posting assistant for a construction marketplace in South Africa.

Improve this job description to be clear, professional, and actionable:

Title: ${input.title}
Description: ${input.description}
Budget: ${input.budget ? `R${input.budget}` : 'Not specified'}
Location: ${input.location || 'Not specified'}
Category: ${input.category || 'General'}

Enhance the description to include:
1. Clear scope of work
2. Timeline expectations (if mentioned)
3. Required skills/qualifications
4. Materials needed (if applicable)
5. Any safety or quality requirements

Keep it concise (2-3 paragraphs), professional, and in South African English.
Do NOT add information that wasn't in the original description.
Do NOT change the budget or location.

Return ONLY the enhanced description, no preamble.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307', // Fast & cheap
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response format from Claude');
}

export async function generateBidProposal(input: {
  jobTitle: string;
  jobDescription: string;
  workerSkills: string[];
  bidAmount: number;
  timeline: string;
}): Promise<string> {
  const prompt = `You are a professional bid proposal writer for construction workers in South Africa.

Write a compelling bid proposal for this job:

Job: ${input.jobTitle}
Description: ${input.jobDescription}
Worker Skills: ${input.workerSkills.join(', ')}
Bid Amount: R${input.bidAmount}
Timeline: ${input.timeline}

Write a professional proposal that:
1. Shows understanding of the job requirements
2. Highlights relevant experience/skills
3. Explains the approach
4. Justifies the price
5. Emphasizes reliability and quality

Keep it concise (3-4 paragraphs), professional, and persuasive.
Use South African English and construction terminology.

Return ONLY the proposal text, no preamble.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 600,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text;
  }

  throw new Error('Unexpected response format from Claude');
}
```

### **Step 3: Add tRPC Endpoint** (30 min)

```typescript
// backend/src/routers/ai.router.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { enhanceJobDescription, generateBidProposal } from '../lib/ai-claude.js';

export const aiRouter = router({
  enhanceJobDescription: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        budget: z.number().optional(),
        location: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const enhanced = await enhanceJobDescription(input);
      return { enhanced };
    }),

  generateBidProposal: protectedProcedure
    .input(
      z.object({
        jobTitle: z.string(),
        jobDescription: z.string(),
        workerSkills: z.array(z.string()),
        bidAmount: z.number(),
        timeline: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const proposal = await generateBidProposal(input);
      return { proposal };
    }),
});
```

### **Step 4: Add to Main Router** (5 min)

```typescript
// backend/src/router.ts
import { aiRouter } from './routers/ai.router.js';

export const appRouter = router({
  // ... existing routers
  ai: aiRouter,
});
```

### **Step 5: Frontend Integration** (2 hours)

```typescript
// client/src/pages/PostJob.tsx
import { Sparkles, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function PostJob() {
  const [description, setDescription] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const enhanceMutation = trpc.ai.enhanceJobDescription.useMutation();

  const handleEnhance = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description first');
      return;
    }

    setIsEnhancing(true);
    try {
      const result = await enhanceMutation.mutateAsync({
        title,
        description,
        budget: budget ? parseFloat(budget) : undefined,
        location,
        category,
      });

      setDescription(result.enhanced);
      toast.success('Description enhanced! Review and edit as needed.');
    } catch (error) {
      toast.error('Failed to enhance description. Please try again.');
      console.error('Enhancement error:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ... other fields ... */}
      
      <div>
        <Label>Job Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the job in detail..."
          rows={6}
        />
        
        {/* AI Enhancement Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleEnhance}
          disabled={isEnhancing || !description.trim()}
          className="mt-2 gap-2"
        >
          {isEnhancing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Enhance with AI
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-1">
          AI will improve clarity and add helpful details
        </p>
      </div>
      
      {/* ... rest of form ... */}
    </div>
  );
}
```

### **Step 6: Test & Deploy** (1 hour)

```bash
# Test locally
npm run dev

# Test the feature
# 1. Go to /post-job
# 2. Enter a rough description
# 3. Click "Enhance with AI"
# 4. Verify enhanced description

# Deploy
git add .
git commit -m "feat: Add AI job description enhancement"
git push
```

---

## 📊 **AI Feature Catalog**

### **1. Content Enhancement**

#### **Job Description Enhancement** ⭐⭐⭐⭐⭐
```typescript
Input: Rough job description
Output: Professional, detailed description
API: Claude Haiku
Cost: ~$0.001 per enhancement
```

#### **Bid Proposal Generation** ⭐⭐⭐⭐⭐
```typescript
Input: Job details + worker profile
Output: Compelling proposal
API: Claude Haiku
Cost: ~$0.001 per proposal
```

#### **Material Recommendations** ⭐⭐⭐⭐
```typescript
Input: Job description
Output: List of materials needed
API: ChatGPT 3.5
Cost: ~$0.0005 per request
```

---

### **2. Search & Discovery**

#### **Natural Language Search** ⭐⭐⭐⭐
```typescript
Input: "cheap plumber in Estcourt"
Output: { category: 'plumber', location: 'Estcourt', maxBudget: 1000 }
API: ChatGPT 3.5
Cost: ~$0.0003 per search
```

**Implementation**:
```typescript
export async function parseSearchQuery(query: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `Parse search queries for a construction marketplace.
Extract: category, location, budget range, urgency.
Return JSON only.`,
      },
      {
        role: 'user',
        content: query,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

### **3. Intelligent Assistance**

#### **Chat Assistant (Manus)** ⭐⭐⭐⭐⭐
```typescript
Input: User question
Output: Helpful answer
API: Claude Sonnet
Cost: ~$0.003 per message
```

**Implementation**:
```typescript
export async function chatWithManus(
  message: string,
  context: {
    userType: string;
    currentPage: string;
    conversationHistory: Array<{ role: string; content: string }>;
  }
) {
  const systemPrompt = `You are Manus, a helpful assistant for Khaya, a construction marketplace in South Africa.

User Context:
- Type: ${context.userType}
- Page: ${context.currentPage}

You can help with:
- Platform navigation
- Job posting guidance
- Bidding advice
- Material recommendations
- Pricing information
- Trust & safety

Be friendly, concise, and use South African English.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      ...context.conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ],
  });

  return message.content[0].text;
}
```

---

### **4. Smart Ranking**

#### **Bid Value Ranking** ⭐⭐⭐⭐
```typescript
Input: Array of bids
Output: Ranked by value (not just price)
API: Claude Haiku
Cost: ~$0.002 per ranking
```

**Factors**:
- Price competitiveness
- Worker rating
- Completion rate
- Response time
- Proposal quality
- Timeline feasibility

---

### **5. Predictive Features**

#### **Delay Prediction** ⭐⭐⭐
```typescript
Input: Job details + worker history
Output: Risk score + recommendations
API: Claude Sonnet
Cost: ~$0.003 per prediction
```

#### **Price Trend Analysis** ⭐⭐⭐
```typescript
Input: Material price history
Output: Trend analysis + forecast
API: ChatGPT 4
Cost: ~$0.01 per analysis
```

---

## 💰 **Cost Optimization**

### **Caching Strategy**
```typescript
// Cache common enhancements
const enhancementCache = new Map<string, { result: string; timestamp: number }>();

export async function enhanceJobDescriptionCached(input: EnhanceJobDescriptionInput) {
  const cacheKey = JSON.stringify(input);
  const cached = enhancementCache.get(cacheKey);
  
  // Cache for 1 hour
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.result;
  }
  
  const result = await enhanceJobDescription(input);
  enhancementCache.set(cacheKey, { result, timestamp: Date.now() });
  
  return result;
}
```

### **Model Selection**
```typescript
// Use cheaper models for simple tasks
const MODEL_SELECTION = {
  jobEnhancement: 'claude-3-haiku-20240307',    // Fast & cheap
  bidProposal: 'claude-3-haiku-20240307',       // Fast & cheap
  chatAssistant: 'claude-3-sonnet-20240229',    // Better reasoning
  complexAnalysis: 'claude-3-opus-20240229',    // Best quality
};
```

### **Rate Limiting**
```typescript
// Limit AI requests per user
const AI_RATE_LIMITS = {
  jobEnhancement: 10, // per day
  bidProposal: 20,    // per day
  chatMessages: 50,   // per day
};
```

---

## 🧪 **Testing AI Features**

### **Unit Tests**
```typescript
describe('AI Job Enhancement', () => {
  it('should enhance job description', async () => {
    const input = {
      title: 'Fix fence',
      description: 'Need fence fixed',
      budget: 500,
    };
    
    const result = await enhanceJobDescription(input);
    
    expect(result).toContain('fence');
    expect(result.length).toBeGreaterThan(input.description.length);
  });
  
  it('should handle errors gracefully', async () => {
    const input = { title: '', description: '' };
    
    await expect(enhanceJobDescription(input)).rejects.toThrow();
  });
});
```

### **Integration Tests**
```typescript
describe('AI tRPC Endpoints', () => {
  it('should enhance via API', async () => {
    const caller = appRouter.createCaller({ user: mockUser });
    
    const result = await caller.ai.enhanceJobDescription({
      title: 'Fix fence',
      description: 'Need fence fixed',
    });
    
    expect(result.enhanced).toBeDefined();
  });
});
```

---

## 📈 **Monitoring & Analytics**

### **Track AI Usage**
```typescript
// Log AI requests
await putItem({
  PK: `AI_LOG#${userId}`,
  SK: `REQUEST#${timestamp()}`,
  feature: 'jobEnhancement',
  inputLength: description.length,
  outputLength: enhanced.length,
  model: 'claude-3-haiku',
  cost: 0.001,
  latency: responseTime,
});
```

### **Metrics to Track**
- Requests per feature
- Success/error rates
- Average latency
- Cost per request
- User satisfaction
- Adoption rate

---

## 🔒 **Security & Privacy**

### **Data Handling**
```typescript
// Sanitize input before sending to AI
function sanitizeInput(text: string): string {
  // Remove PII
  text = text.replace(/\b\d{13}\b/g, '[ID_NUMBER]');
  text = text.replace(/\b\d{10}\b/g, '[PHONE]');
  text = text.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL]');
  
  return text;
}
```

### **Rate Limiting**
```typescript
// Prevent abuse
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string, feature: string): boolean {
  const key = `${userId}:${feature}`;
  const requests = rateLimiter.get(key) || [];
  
  // Remove old requests (>24h)
  const recent = requests.filter(t => Date.now() - t < 86400000);
  
  if (recent.length >= AI_RATE_LIMITS[feature]) {
    return false;
  }
  
  recent.push(Date.now());
  rateLimiter.set(key, recent);
  
  return true;
}
```

---

## 🚀 **Deployment Checklist**

### **Before Launch**
- [ ] API keys configured
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Caching enabled
- [ ] Monitoring set up
- [ ] Cost alerts configured
- [ ] User feedback mechanism
- [ ] Opt-out option available

### **After Launch**
- [ ] Monitor usage patterns
- [ ] Track cost vs budget
- [ ] Collect user feedback
- [ ] Optimize prompts
- [ ] A/B test variations
- [ ] Document learnings

---

## 📚 **Resources**

### **Documentation**
- [Anthropic Claude API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

### **Best Practices**
- Keep prompts concise
- Provide clear examples
- Use system messages
- Handle errors gracefully
- Cache when possible
- Monitor costs

---

**Guide Created**: 2024-11-12  
**Next Update**: After first AI feature launch  
**Maintainer**: Development Team
