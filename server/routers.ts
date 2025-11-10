import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
// Use DynamoDB for serverless deployment
import * as db from "./db-dynamodb";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

// Helper to generate random suffix for file keys
function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Profile Management
  profile: router({
    get: protectedProcedure
      .input(z.object({ userId: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const userId = input.userId || ctx.user.id;
        return await db.getProfileByUserId(userId);
      }),

    upsert: protectedProcedure
      .input(z.object({
        bio: z.string().optional(),
        trade: z.string().optional(),
        location: z.string(),
        photoUrl: z.string().optional(),
        certifications: z.string().optional(),
        yearsExperience: z.number().optional(),
        availabilityStatus: z.enum(['available', 'busy', 'unavailable']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertProfile({
          userId: ctx.user.id,
          ...input,
        });
      }),

    uploadPhoto: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `profiles/${ctx.user.id}/photo-${randomSuffix()}.jpg`;
        const { url } = await storagePut(fileKey, buffer, 'image/jpeg');
        return { url };
      }),

    getWorkers: publicProcedure
      .input(z.object({
        location: z.string().optional(),
        trade: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getWorkerProfiles(input.location, input.trade);
      }),
  }),

  // Job Management
  job: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(5),
        description: z.string().min(20),
        category: z.string(),
        budget: z.number().positive(),
        location: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert budget to cents
        const budgetInCents = Math.round(input.budget * 100);
        return await db.createJob({
          ...input,
          budget: budgetInCents,
          buyerId: ctx.user.id,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getJobById(input.id);
      }),

    getOpen: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        location: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getOpenJobs(input.category, input.location);
      }),

    getMyJobs: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getJobsByBuyer(ctx.user.id);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        status: z.enum(['open', 'in_progress', 'completed', 'cancelled']),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const job = await db.getJobById(input.jobId);
        if (!job || job.buyerId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.updateJobStatus(input.jobId, input.status);
      }),
  }),

  // Bid Management
  bid: router({
    create: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        amount: z.number().positive(),
        timeline: z.number().positive(),
        proposal: z.string().min(20),
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert amount to cents
        const amountInCents = Math.round(input.amount * 100);
        
        // Create notification for job owner
        const job = await db.getJobById(input.jobId);
        if (job) {
          await db.createNotification({
            userId: job.buyerId,
            title: 'New Bid Received',
            message: `You received a new bid of R${input.amount} on "${job.title}"`,
            type: 'bid',
            relatedId: input.jobId,
          });
        }
        
        return await db.createBid({
          ...input,
          amount: amountInCents,
          workerId: ctx.user.id,
        });
      }),

    getByJob: publicProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBidsByJob(input.jobId);
      }),

    getMyBids: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getBidsByWorker(ctx.user.id);
      }),

    accept: protectedProcedure
      .input(z.object({
        bidId: z.number(),
        jobId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const job = await db.getJobById(input.jobId);
        if (!job || job.buyerId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        const result = await db.acceptBid(input.bidId, input.jobId);
        
        // Create notification for worker
        if (result) {
          await db.createNotification({
            userId: result.workerId,
            title: 'Bid Accepted!',
            message: `Your bid has been accepted for "${job.title}"`,
            type: 'bid',
            relatedId: input.jobId,
          });
        }
        
        return result;
      }),
  }),

  // Listing Management
  listing: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(5),
        description: z.string().min(20),
        category: z.string(),
        price: z.number().positive(),
        unit: z.string(),
        stock: z.number().nonnegative(),
        photoUrl: z.string().optional(),
        location: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Convert price to cents
        const priceInCents = Math.round(input.price * 100);
        return await db.createListing({
          ...input,
          price: priceInCents,
          supplierId: ctx.user.id,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getListingById(input.id);
      }),

    getAvailable: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        location: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getAvailableListings(input.category, input.location);
      }),

    getMyListings: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getListingsBySupplier(ctx.user.id);
      }),

    uploadPhoto: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `listings/${ctx.user.id}/photo-${randomSuffix()}.jpg`;
        const { url } = await storagePut(fileKey, buffer, 'image/jpeg');
        return { url };
      }),
  }),

  // Review Management
  review: router({
    create: protectedProcedure
      .input(z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        reviewedId: z.number(),
        jobId: z.number().optional(),
        type: z.enum(['worker', 'buyer', 'supplier']),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create notification for reviewed user
        await db.createNotification({
          userId: input.reviewedId,
          title: 'New Review',
          message: `You received a ${input.rating}-star review`,
          type: 'review',
          relatedId: input.jobId,
        });
        
        return await db.createReview({
          ...input,
          reviewerId: ctx.user.id,
        });
      }),

    getForUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return await db.getReviewsForUser(input.userId);
      }),
  }),

  // Milestone Management
  milestone: router({
    create: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        proofUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createMilestone(input);
      }),

    getByJob: publicProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        return await db.getMilestonesByJob(input.jobId);
      }),

    uploadProof: protectedProcedure
      .input(z.object({
        fileData: z.string(), // base64 encoded
        fileName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileData, 'base64');
        const fileKey = `milestones/${ctx.user.id}/proof-${randomSuffix()}.jpg`;
        const { url } = await storagePut(fileKey, buffer, 'image/jpeg');
        return { url };
      }),
  }),

  // Messaging
  message: router({
    send: protectedProcedure
      .input(z.object({
        receiverId: z.number(),
        content: z.string().min(1),
        jobId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Create notification for receiver
        await db.createNotification({
          userId: input.receiverId,
          title: 'New Message',
          message: `You have a new message from ${ctx.user.name || 'a user'}`,
          type: 'message',
        });
        
        return await db.createMessage({
          ...input,
          senderId: ctx.user.id,
        });
      }),

    getConversation: protectedProcedure
      .input(z.object({ otherUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getConversation(ctx.user.id, input.otherUserId);
      }),
  }),

  // Notifications
  notification: router({
    getMyNotifications: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getNotificationsByUser(ctx.user.id);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.markNotificationAsRead(input.notificationId);
      }),
  }),

  // User role update
  user: router({
    updateRole: protectedProcedure
      .input(z.object({
        role: z.enum(['buyer', 'worker', 'supplier']),
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        await dbInstance.update(users).set({ role: input.role }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
  }),
  // Credits & Referrals
  credits: router({
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserCreditBalance(ctx.user.id);
    }),
    
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserCredits(ctx.user.id);
    }),
  }),

  referral: router({
    create: protectedProcedure
      .input(z.object({
        referredEmail: z.string().email().optional(),
        referredPhone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const code = `${ctx.user.name?.substring(0, 3).toUpperCase() || 'REF'}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        return await db.createReferral({
          referrerId: ctx.user.id,
          referredEmail: input.referredEmail,
          referredPhone: input.referredPhone,
          referralCode: code,
          status: 'pending',
        });
      }),

    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserReferrals(ctx.user.id);
    }),

    applyCode: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const referral = await db.getReferralByCode(input.code);
        if (!referral) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid referral code' });
        if (referral.referrerId === ctx.user.id) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot use your own referral code' });
        
        await db.updateReferralStatus(referral.id, 'completed', ctx.user.id);
        await db.addCredit({ userId: referral.referrerId, amount: referral.rewardAmount, type: 'referral', description: `Referral reward for ${ctx.user.name}`, relatedReferralId: referral.id });
        await db.addCredit({ userId: ctx.user.id, amount: referral.rewardAmount, type: 'bonus', description: 'Welcome bonus from referral' });
        await db.updateReferralStatus(referral.id, 'rewarded');
        
        return { success: true, reward: referral.rewardAmount };
      }),
  }),

  // Community Stories
  story: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(5).max(200),
        content: z.string().min(20),
        type: z.enum(['success', 'testimonial', 'tip', 'experience']),
        relatedJobId: z.number().optional(),
        relatedWorkerId: z.number().optional(),
        mediaUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createStory({
          userId: ctx.user.id,
          ...input,
          approved: false,
        });
      }),

    getApproved: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getApprovedStories(input.limit);
      }),

    getFeatured: publicProcedure.query(async () => {
      return await db.getFeaturedStories();
    }),

    getMy: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStories(ctx.user.id);
    }),

    like: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.likeStory(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
