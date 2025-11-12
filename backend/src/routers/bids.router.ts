/**
 * Bids Router
 * Submit, list, accept, reject bids
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, workerOnlyProcedure, clientOnlyProcedure } from '../trpc.js';
import { putItem, getItem, updateItem, queryItems } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';

export const bidsRouter = router({
  // Submit bid (workers only)
  submit: workerOnlyProcedure
    .input(z.object({
      jobId: z.string(),
      amount: z.number().positive(),
      proposedDuration: z.string(),
      coverLetter: z.string().min(50),
      milestones: z.array(z.object({
        description: z.string(),
        amount: z.number(),
        duration: z.string()
      })).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if job exists and is open
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

      if (job.status !== 'open') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job is not accepting bids'
        });
      }

      // Check if worker already bid
      const existingBid = await getItem({
        PK: `JOB#${input.jobId}`,
        SK: `BID#${ctx.user!.userId}`
      });

      if (existingBid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already submitted a bid for this job'
        });
      }

      const bidId = uuidv4();
      const now = new Date().toISOString();

      const bid = {
        PK: `JOB#${input.jobId}`,
        SK: `BID#${ctx.user!.userId}`,
        bidId,
        jobId: input.jobId,
        workerId: ctx.user!.userId,
        amount: input.amount,
        proposedDuration: input.proposedDuration,
        coverLetter: input.coverLetter,
        milestones: input.milestones,
        status: 'pending',
        createdAt: now,
        GSI1PK: `WORKER#${ctx.user!.userId}`,
        GSI1SK: now
      };

      await putItem(bid);

      // Increment bid count on job
      await updateItem(
        { PK: `JOB#${input.jobId}`, SK: 'METADATA' },
        { bidCount: (job.bidCount || 0) + 1 }
      );

      return { bidId, success: true };
    }),

  // Get bids for a job (client view)
  getJobBids: clientOnlyProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify client owns the job
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
          message: 'Not authorized to view bids for this job'
        });
      }

      const bids = await queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `JOB#${input.jobId}`,
          ':sk': 'BID#'
        }
      });

      // Fetch worker details for each bid
      const bidsWithWorkers = await Promise.all(
        bids.map(async (bid: any) => {
          const worker = await getItem({
            PK: `USER#${bid.workerId}`,
            SK: 'PROFILE'
          });

          return {
            ...bid,
            worker: worker ? {
              userId: worker.userId,
              name: worker.name,
              rating: worker.rating,
              reviewCount: worker.reviewCount,
              completedJobs: worker.completedJobs,
              verified: worker.verified,
              skills: worker.skills,
              location: worker.location
            } : null
          };
        })
      );

      return bidsWithWorkers.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  // Get my bids (worker view)
  myBids: workerOnlyProcedure
    .query(async ({ ctx }) => {
      const bids = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `WORKER#${ctx.user!.userId}`
        }
      });

      // Fetch job details for each bid
      const bidsWithJobs = await Promise.all(
        bids.map(async (bid: any) => {
          const job = await getItem({
            PK: `JOB#${bid.jobId}`,
            SK: 'METADATA'
          });

          return {
            ...bid,
            job: job ? {
              jobId: job.jobId,
              title: job.title,
              budget: job.budget,
              budgetType: job.budgetType,
              category: job.category,
              location: job.location,
              status: job.status
            } : null
          };
        })
      );

      return bidsWithJobs.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  // Accept bid (client)
  accept: clientOnlyProcedure
    .input(z.object({
      jobId: z.string(),
      workerId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify job ownership
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

      if (job.status !== 'open') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job is not open'
        });
      }

      // Get the bid
      const bid = await getItem({
        PK: `JOB#${input.jobId}`,
        SK: `BID#${input.workerId}`
      });

      if (!bid) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bid not found'
        });
      }

      // Update bid status
      await updateItem(
        { PK: `JOB#${input.jobId}`, SK: `BID#${input.workerId}` },
        {
          status: 'accepted',
          acceptedAt: new Date().toISOString()
        }
      );

      // Update job
      await updateItem(
        { PK: `JOB#${input.jobId}`, SK: 'METADATA' },
        {
          status: 'in_progress',
          assignedWorkerId: input.workerId,
          assignedBidId: bid.bidId,
          assignedAt: new Date().toISOString(),
          GSI2PK: 'STATUS#in_progress'
        }
      );

      // Reject all other bids
      const allBids = await queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `JOB#${input.jobId}`,
          ':sk': 'BID#'
        }
      });

      await Promise.all(
        allBids
          .filter(b => b.workerId !== input.workerId)
          .map(b => 
            updateItem(
              { PK: `JOB#${input.jobId}`, SK: `BID#${b.workerId}` },
              { status: 'rejected', rejectedAt: new Date().toISOString() }
            )
          )
      );

      return { success: true };
    }),

  // Reject bid (client)
  reject: clientOnlyProcedure
    .input(z.object({
      jobId: z.string(),
      workerId: z.string(),
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify job ownership
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

      await updateItem(
        { PK: `JOB#${input.jobId}`, SK: `BID#${input.workerId}` },
        {
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectionReason: input.reason
        }
      );

      return { success: true };
    }),

  // Withdraw bid (worker)
  withdraw: workerOnlyProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const bid = await getItem({
        PK: `JOB#${input.jobId}`,
        SK: `BID#${ctx.user!.userId}`
      });

      if (!bid) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bid not found'
        });
      }

      if (bid.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only withdraw pending bids'
        });
      }

      await updateItem(
        { PK: `JOB#${input.jobId}`, SK: `BID#${ctx.user!.userId}` },
        {
          status: 'withdrawn',
          withdrawnAt: new Date().toISOString()
        }
      );

      // Decrement bid count
      const job = await getItem({
        PK: `JOB#${input.jobId}`,
        SK: 'METADATA'
      });

      if (job) {
        await updateItem(
          { PK: `JOB#${input.jobId}`, SK: 'METADATA' },
          { bidCount: Math.max(0, (job.bidCount || 1) - 1) }
        );
      }

      return { success: true };
    }),

  // Get my bids (worker)
  getMyBids: protectedProcedure
    .query(async ({ ctx }) => {
      // Get all bids by this worker
      const allBids = await queryItems({
        FilterExpression: 'begins_with(SK, :prefix) AND workerId = :workerId',
        ExpressionAttributeValues: {
          ':prefix': 'BID#',
          ':workerId': ctx.user!.userId
        }
      });

      // Get job details for each bid
      const bidsWithJobs = await Promise.all(
        allBids.map(async (bid) => {
          const jobId = bid.PK.replace('JOB#', '');
          const job = await getItem({
            PK: `JOB#${jobId}`,
            SK: 'METADATA'
          });
          return {
            bid,
            job
          };
        })
      );

      return bidsWithJobs.sort((a, b) => 
        new Date(b.bid.createdAt).getTime() - new Date(a.bid.createdAt).getTime()
      );
    })
});
