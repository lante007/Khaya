/**
 * Jobs Router
 * Job posting, browsing, searching, filtering
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, clientOnlyProcedure } from '../trpc.js';
import { putItem, getItem, updateItem, queryByGSI, queryItems } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';

export const jobsRouter = router({
  // Create job (clients only)
  create: clientOnlyProcedure
    .input(z.object({
      title: z.string().min(5).max(200),
      description: z.string().min(20),
      category: z.string(),
      location: z.string(),
      budget: z.number().positive(),
      budgetType: z.enum(['fixed', 'hourly']),
      duration: z.string().optional(),
      skillsRequired: z.array(z.string()),
      attachments: z.array(z.string()).optional(),
      urgency: z.enum(['low', 'medium', 'high']).default('medium')
    }))
    .mutation(async ({ ctx, input }) => {
      const jobId = uuidv4();
      const now = new Date().toISOString();

      const job = {
        PK: `JOB#${jobId}`,
        SK: 'METADATA',
        jobId,
        clientId: ctx.user!.userId,
        title: input.title,
        description: input.description,
        category: input.category,
        location: input.location,
        budget: input.budget,
        budgetType: input.budgetType,
        duration: input.duration,
        skillsRequired: input.skillsRequired,
        attachments: input.attachments || [],
        urgency: input.urgency,
        status: 'open',
        bidCount: 0,
        createdAt: now,
        updatedAt: now,
        GSI1PK: `CATEGORY#${input.category}`,
        GSI1SK: now,
        GSI2PK: `STATUS#open`,
        GSI2SK: now
      };

      await putItem(job);

      return { jobId, success: true };
    }),

  // Get job by ID
  getById: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const job = await getItem({
        PK: `JOB#${input.jobId}`,
        SK: 'METADATA'
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      return job;
    }),

  // List jobs with filters
  list: protectedProcedure
    .input(z.object({
      category: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      skills: z.array(z.string()).optional(),
      limit: z.number().default(20),
      cursor: z.string().optional()
    }))
    .query(async ({ input }) => {
      let jobs;

      if (input.category) {
        jobs = await queryByGSI(
          'GSI1',
          'GSI1PK',
          `CATEGORY#${input.category}`,
          'GSI1SK'
        );
      } else if (input.status) {
        jobs = await queryByGSI(
          'GSI2',
          'GSI2PK',
          `STATUS#${input.status}`,
          'GSI2SK'
        );
      } else {
        jobs = await queryByGSI(
          'GSI2',
          'GSI2PK',
          'STATUS#open',
          'GSI2SK'
        );
      }

      // Apply filters
      let filtered = jobs;

      if (input.location) {
        filtered = filtered.filter(j => 
          j.location.toLowerCase().includes(input.location!.toLowerCase())
        );
      }

      if (input.budgetMin) {
        filtered = filtered.filter(j => j.budget >= input.budgetMin!);
      }

      if (input.budgetMax) {
        filtered = filtered.filter(j => j.budget <= input.budgetMax!);
      }

      if (input.skills && input.skills.length > 0) {
        filtered = filtered.filter(j =>
          j.skillsRequired && input.skills!.some(s => j.skillsRequired.includes(s))
        );
      }

      // Sort by date (newest first)
      filtered.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Pagination
      const startIndex = input.cursor ? parseInt(input.cursor) : 0;
      const endIndex = startIndex + input.limit;
      const paginatedJobs = filtered.slice(startIndex, endIndex);
      const nextCursor = endIndex < filtered.length ? endIndex.toString() : undefined;

      return {
        jobs: paginatedJobs,
        nextCursor
      };
    }),

  // Get my posted jobs (client)
  myJobs: clientOnlyProcedure
    .query(async ({ ctx }) => {
      const jobs = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `CLIENT#${ctx.user!.userId}`
        }
      });

      return jobs.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  // Update job
  update: clientOnlyProcedure
    .input(z.object({
      jobId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      budget: z.number().optional(),
      duration: z.string().optional(),
      skillsRequired: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const job = await getItem({
        PK: `JOB#${input.jobId}`,
        SK: 'METADATA'
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      if (job.clientId !== ctx.user!.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to update this job'
        });
      }

      if (job.status !== 'open') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot update job that is not open'
        });
      }

      const updates: any = { updatedAt: new Date().toISOString() };
      if (input.title) updates.title = input.title;
      if (input.description) updates.description = input.description;
      if (input.budget) updates.budget = input.budget;
      if (input.duration) updates.duration = input.duration;
      if (input.skillsRequired) updates.skillsRequired = input.skillsRequired;

      await updateItem(
        { PK: `JOB#${input.jobId}`, SK: 'METADATA' },
        updates
      );

      return { success: true };
    }),

  // Cancel job
  cancel: clientOnlyProcedure
    .input(z.object({
      jobId: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const job = await getItem({
        PK: `JOB#${input.jobId}`,
        SK: 'METADATA'
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      if (job.clientId !== ctx.user!.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to cancel this job'
        });
      }

      if (job.status === 'completed' || job.status === 'cancelled') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job already completed or cancelled'
        });
      }

      await updateItem(
        { PK: `JOB#${input.jobId}`, SK: 'METADATA' },
        {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancellationReason: input.reason,
          GSI2PK: 'STATUS#cancelled'
        }
      );

      return { success: true };
    }),

  // Mark job as completed
  complete: clientOnlyProcedure
    .input(z.object({
      jobId: z.string(),
      rating: z.number().min(1).max(5),
      review: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const job = await getItem({
        PK: `JOB#${input.jobId}`,
        SK: 'METADATA'
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      if (job.clientId !== ctx.user!.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized'
        });
      }

      if (job.status !== 'in_progress') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job must be in progress to complete'
        });
      }

      await updateItem(
        { PK: `JOB#${input.jobId}`, SK: 'METADATA' },
        {
          status: 'completed',
          completedAt: new Date().toISOString(),
          clientRating: input.rating,
          clientReview: input.review,
          GSI2PK: 'STATUS#completed'
        }
      );

      // Update worker stats
      if (job.assignedWorkerId) {
        const worker = await getItem({
          PK: `USER#${job.assignedWorkerId}`,
          SK: 'PROFILE'
        });

        if (worker) {
          const newReviewCount = (worker.reviewCount || 0) + 1;
          const newRating = ((worker.rating || 0) * (worker.reviewCount || 0) + input.rating) / newReviewCount;
          
          await updateItem(
            { PK: `USER#${job.assignedWorkerId}`, SK: 'PROFILE' },
            {
              rating: newRating,
              reviewCount: newReviewCount,
              completedJobs: (worker.completedJobs || 0) + 1
            }
          );
        }
      }

      return { success: true };
    })
});
