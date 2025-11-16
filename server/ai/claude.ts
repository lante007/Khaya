import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.AI_MODEL_CLAUDE || 'claude-3-haiku-20240307';
const MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '2000');
const TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || '0.7');

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
2. Timeline expectations (if mentioned or reasonable to infer)
3. Required skills/qualifications
4. Materials needed (if applicable)
5. Any safety or quality requirements

Keep it concise (2-3 paragraphs max) and professional. Use South African English and currency (Rand).
Return ONLY the enhanced description, no preamble or explanation.`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
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

    throw new Error('Unexpected response format from Claude API');
  } catch (error) {
    console.error('[AI] Error enhancing job description:', error);
    throw new Error('Failed to enhance job description with AI');
  }
}

export interface GenerateBidProposalInput {
  jobTitle: string;
  jobDescription: string;
  bidAmount: number;
  timeline?: string;
  workerSkills?: string[];
  workerExperience?: string;
}

export async function generateBidProposal(
  input: GenerateBidProposalInput
): Promise<string> {
  const prompt = `You are a professional bid proposal writer for construction workers in South Africa.

Write a compelling bid proposal for this job:

Job Title: ${input.jobTitle}
Job Description: ${input.jobDescription}
Bid Amount: R${input.bidAmount}
Timeline: ${input.timeline || 'To be discussed'}
Worker Skills: ${input.workerSkills?.join(', ') || 'General construction'}
Worker Experience: ${input.workerExperience || 'Experienced professional'}

Write a professional proposal that:
1. Shows understanding of the job requirements
2. Highlights relevant experience and skills
3. Explains the approach to completing the work
4. Justifies the bid amount
5. Demonstrates professionalism and reliability

Keep it concise (2-3 paragraphs) and persuasive. Use South African English.
Return ONLY the proposal text, no preamble or explanation.`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
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

    throw new Error('Unexpected response format from Claude API');
  } catch (error) {
    console.error('[AI] Error generating bid proposal:', error);
    throw new Error('Failed to generate bid proposal with AI');
  }
}

export interface ChatAssistantInput {
  userMessage: string;
  context?: {
    userType?: 'buyer' | 'worker';
    currentPage?: string;
    userProfile?: any;
  };
}

export async function chatAssistant(
  input: ChatAssistantInput
): Promise<string> {
  const contextInfo = input.context
    ? `
User Type: ${input.context.userType || 'Unknown'}
Current Page: ${input.context.currentPage || 'Unknown'}
`
    : '';

  const prompt = `You are Manus, a helpful AI assistant for Khaya, a construction marketplace platform in South Africa.

${contextInfo}

User Question: ${input.userMessage}

Provide a helpful, concise answer. If the question is about:
- How to post a job: Explain the job posting process
- How to bid on jobs: Explain the bidding process
- Payments: Explain the escrow and payment system
- Profile: Explain profile features and verification
- General help: Provide relevant guidance

Keep responses friendly, professional, and under 150 words. Use South African English.`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.7,
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

    throw new Error('Unexpected response format from Claude API');
  } catch (error) {
    console.error('[AI] Error in chat assistant:', error);
    throw new Error('Failed to get response from AI assistant');
  }
}
