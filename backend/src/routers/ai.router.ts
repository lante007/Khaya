/**
 * AI Router
 * AI-powered features: job enhancement, price suggestions, chat summaries
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { enhanceJobDescription, suggestJobPricing } from '../lib/ai.js';

export const aiRouter = router({
  // Enhance job description with AI
  enhanceJobDescription: publicProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      budget: z.number().optional(),
      location: z.string().optional(),
      category: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      return await enhanceJobDescription(input);
    }),

  // Get AI price suggestions
  suggestPricing: publicProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      location: z.string()
    }))
    .query(async ({ input }) => {
      return await suggestJobPricing(input);
    })
});
