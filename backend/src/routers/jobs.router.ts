/**
 * Jobs Router
 * Job posting, browsing, searching, filtering
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, clientOnlyProcedure } from '../trpc.js';
import { putItem, getItem, updateItem, queryByGSI, queryItems, scanItems } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import { addJobToResume } from '../lib/resume.js';

export const jobsRouter = router({
  // Create job (clients only)
  create: clientOnlyProcedure
    .input(z.object({
      title: z.string().min(3).max(200),
      description: z.string().min(10),
      category: z.string(),
      location: z.string(),
      budget: z.number().positive(),
      budgetType: z.enum(['fixed', 'hourly']).optional().default('fixed'),
      duration: z.string().optional(),
      skillsRequired: z.array(z.string()).optional().default([]),
      attachments: z.array(z.string()).optional(),
      urgency: z.enum(['low', 'medium', 'high']).optional().default('medium')
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
        budgetType: input.budgetType || 'fixed',
        duration: input.duration,
        skillsRequired: input.skillsRequired || [],
        attachments: input.attachments || [],
        urgency: input.urgency || 'medium',
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

  // Get open jobs (public - for browsing)
  getOpen: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      location: z.string().optional(),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      // Get all open jobs
      const jobs = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':prefix': 'JOB#',
          ':sk': 'METADATA',
          ':status': 'open'
        }
      });

      // Apply filters
      let filtered = jobs;

      if (input.category) {
        filtered = filtered.filter(j => 
          j.category.toLowerCase() === input.category!.toLowerCase()
        );
      }

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

      // Sort by creation date (newest first)
      const sorted = filtered.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Limit results
      return sorted.slice(0, input.limit);
    }),

  // Get my posted jobs (client)
  myJobs: clientOnlyProcedure
    .query(async ({ ctx }) => {
      const jobs = await queryItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND clientId = :clientId',
        ExpressionAttributeValues: {
          ':prefix': 'JOB#',
          ':sk': 'METADATA',
          ':clientId': ctx.user!.userId
        }
      });

      return jobs.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  // Alias for dashboard compatibility
  getMyJobs: protectedProcedure
    .query(async ({ ctx }) => {
      const jobs = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND clientId = :clientId',
        ExpressionAttributeValues: {
          ':prefix': 'JOB#',
          ':sk': 'METADATA',
          ':clientId': ctx.user!.userId
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

  // Mark job as completed WITH PHOTO PROOF
  complete: clientOnlyProcedure
    .input(z.object({
      jobId: z.string(),
      proofUrl: z.string().url(), // S3 photo URL - REQUIRED
      rating: z.number().min(1).max(5).optional(),
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

      if (!job.escrowHeld) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No escrow payment found for this job'
        });
      }

      // Get payment record
      const payments = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `JOB#${input.jobId}`
        }
      });

      const payment = payments.find(p => p.status === 'completed' && !p.released);

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No unreleased payment found for this job'
        });
      }

      if (!payment.proofNeeded) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Photo proof not required for this payment'
        });
      }

      // Calculate payout: 95% to worker, 5% platform fee
      const escrowAmount = payment.escrowAmount || payment.amount;
      const platformFee = escrowAmount * 0.05;
      const workerAmount = escrowAmount * 0.95;

      // Update job with proof and completion
      await updateItem(
        { PK: `JOB#${input.jobId}`, SK: 'METADATA' },
        {
          status: 'completed',
          completedAt: new Date().toISOString(),
          proofUrl: input.proofUrl,
          proofSubmittedAt: new Date().toISOString(),
          clientRating: input.rating,
          clientReview: input.review,
          escrowReleased: true,
          GSI2PK: 'STATUS#completed'
        }
      );

      // Release payment - mark as released
      await updateItem(
        { PK: `PAYMENT#${payment.paymentId}`, SK: 'METADATA' },
        {
          released: true,
          releasedAt: new Date().toISOString(),
          platformFee,
          workerAmount,
          proofUrl: input.proofUrl,
          proofVerified: true
        }
      );

      // Update worker balance and stats
      if (job.assignedWorkerId) {
        const worker = await getItem({
          PK: `USER#${job.assignedWorkerId}`,
          SK: 'PROFILE'
        });

        if (worker) {
          const newReviewCount = input.rating ? (worker.reviewCount || 0) + 1 : (worker.reviewCount || 0);
          const newRating = input.rating 
            ? ((worker.rating || 0) * (worker.reviewCount || 0) + input.rating) / newReviewCount
            : (worker.rating || 0);
          
          await updateItem(
            { PK: `USER#${job.assignedWorkerId}`, SK: 'PROFILE' },
            {
              balance: (worker.balance || 0) + workerAmount,
              totalEarnings: (worker.totalEarnings || 0) + workerAmount,
              rating: newRating,
              reviewCount: newReviewCount,
              completedJobs: (worker.completedJobs || 0) + 1
            }
          );

          // AUTO-UPDATE RÉSUMÉ: Add completed job to worker's résumé
          try {
            await addJobToResume(job.assignedWorkerId, {
              jobId: input.jobId,
              title: job.title,
              description: job.description,
              location: job.location,
              rating: input.rating,
              proofPhotos: [input.proofUrl],
              gpsCoords: job.locationCoords
            });
          } catch (error) {
            // Log but don't fail the job completion if résumé update fails
            console.error('Failed to update worker résumé:', error);
          }
        }
      }

      return { 
        success: true,
        released: true,
        netPaid: workerAmount,
        fee: platformFee,
        proofUrl: input.proofUrl
      };
    })
});
