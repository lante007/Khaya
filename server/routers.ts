import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
// Use DynamoDB for serverless deployment
import * as db from "./db-dynamodb";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import * as aiClaude from "./ai/claude";
import * as aiOpenAI from "./ai/openai";
import * as badgeService from "./services/badges";
import * as reviewPromptService from "./services/review-prompts";
import * as escrowService from "./services/escrow";
import * as paystackService from "./services/paystack";

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
        return await db.getJobsByBuyer(String(ctx.user.id));
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
        return await db.getBidsByWorker(String(ctx.user.id));
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
        return await db.getListingsBySupplier(String(ctx.user.id));
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
        return await db.getNotificationsByUser(String(ctx.user.id));
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

  // AI Features
  ai: router({
    enhanceJobDescription: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        budget: z.number().optional(),
        location: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const enhanced = await aiClaude.enhanceJobDescription(input);
          return { enhanced };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to enhance job description',
          });
        }
      }),

    generateBidProposal: protectedProcedure
      .input(z.object({
        jobTitle: z.string(),
        jobDescription: z.string(),
        bidAmount: z.number(),
        timeline: z.string().optional(),
        workerSkills: z.array(z.string()).optional(),
        workerExperience: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const proposal = await aiClaude.generateBidProposal(input);
          return { proposal };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate bid proposal',
          });
        }
      }),

    chat: publicProcedure
      .input(z.object({
        message: z.string(),
        context: z.object({
          userType: z.enum(['buyer', 'worker']).optional(),
          currentPage: z.string().optional(),
        }).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const response = await aiClaude.chatAssistant({
            userMessage: input.message,
            context: input.context,
          });
          return { response };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get AI response',
          });
        }
      }),

    parseSearch: publicProcedure
      .input(z.object({
        query: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const filters = await aiOpenAI.parseSearchQuery(input);
          return filters;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to parse search query',
          });
        }
      }),

    recommendMaterials: publicProcedure
      .input(z.object({
        jobTitle: z.string(),
        jobDescription: z.string(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const materials = await aiOpenAI.recommendMaterials(input);
          return { materials };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to recommend materials',
          });
        }
      }),

    analyzePricing: publicProcedure
      .input(z.object({
        category: z.string(),
        location: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const trend = await aiOpenAI.analyzePriceTrends(input);
          return trend;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to analyze pricing',
          });
        }
      }),
  }),

  // Trust Badges
  badges: router({
    getUserBadges: publicProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        try {
          // Get user profile and stats
          const profile = await db.getProfileByUserId(input.userId);
          const reviews = await db.getReviewsForWorker(input.userId);
          
          if (!profile) {
            return { badges: [], trustScore: 0 };
          }

          // Calculate stats
          const totalReviews = reviews?.length || 0;
          const averageRating = totalReviews > 0
            ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
            : undefined;

          // Calculate account age in days
          const createdAt = new Date(profile.createdAt || Date.now());
          const accountAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

          const stats: badgeService.UserStats = {
            completedJobs: profile.completedJobs || 0,
            averageRating,
            totalReviews,
            accountAge,
            verified: profile.verified || false,
            trustScore: profile.trustScore || 0,
          };

          // Calculate badges
          const badgeIds = badgeService.calculateBadges(stats);
          const badges = badgeService.getBadgeDetails(badgeIds);
          const trustScore = badgeService.calculateTrustScore(stats);

          return { badges, trustScore, stats };
        } catch (error) {
          console.error('[BADGES] Error getting user badges:', error);
          return { badges: [], trustScore: 0 };
        }
      }),

    getBadgeProgress: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          // Get user profile and stats
          const profile = await db.getProfileByUserId(ctx.user.id);
          const reviews = await db.getReviewsForWorker(ctx.user.id);
          
          if (!profile) {
            return { progress: [] };
          }

          // Calculate stats
          const totalReviews = reviews?.length || 0;
          const averageRating = totalReviews > 0
            ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
            : undefined;

          const createdAt = new Date(profile.createdAt || Date.now());
          const accountAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

          const stats: badgeService.UserStats = {
            completedJobs: profile.completedJobs || 0,
            averageRating,
            totalReviews,
            accountAge,
            verified: profile.verified || false,
            trustScore: profile.trustScore || 0,
          };

          const progress = badgeService.getBadgeProgress(stats);

          return { progress };
        } catch (error) {
          console.error('[BADGES] Error getting badge progress:', error);
          return { progress: [] };
        }
      }),

    getAllBadges: publicProcedure
      .query(() => {
        return Object.values(badgeService.AVAILABLE_BADGES);
      }),
  }),

  // Escrow & Payments
  escrow: router({
    create: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        workerId: z.string(),
        totalAmount: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Calculate escrow amounts
          const amounts = escrowService.calculateEscrowAmounts(input.totalAmount);
          
          // Create escrow payment
          const escrowData = escrowService.createEscrowPayment({
            jobId: input.jobId.toString(),
            buyerId: ctx.user.id,
            workerId: input.workerId,
            totalAmount: input.totalAmount,
          });
          
          // Save to database
          const escrow = await db.createEscrow(escrowData);
          
          return { 
            escrow,
            amounts,
            paystackReference: escrowService.generatePaystackReference(escrow.id),
          };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create escrow payment',
          });
        }
      }),

    getByJobId: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        try {
          const escrow = await db.getEscrowByJobId(input.jobId.toString());
          return { escrow };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get escrow',
          });
        }
      }),

    payDeposit: protectedProcedure
      .input(z.object({
        escrowId: z.string(),
        paystackReference: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify payment with Paystack
          const verification = await escrowService.verifyPaystackPayment(input.paystackReference);
          
          if (!verification.success) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Payment verification failed',
            });
          }
          
          // Update escrow status
          await db.updateEscrowStatus(input.escrowId, 'deposit_paid', {
            paystackReference: input.paystackReference,
            depositPaidAt: new Date().toISOString(),
          });
          
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to process deposit payment',
          });
        }
      }),

    releasePayment: protectedProcedure
      .input(z.object({ escrowId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          const escrow = await db.getEscrowById(input.escrowId);
          
          if (!escrow) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Escrow not found',
            });
          }
          
          // Validate release
          const validation = escrowService.canReleasePayment(escrow);
          if (!validation.canRelease) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: validation.reason || 'Cannot release payment',
            });
          }
          
          // Release payment
          await db.updateEscrowStatus(input.escrowId, 'released', {
            releasedAt: new Date().toISOString(),
          });
          
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to release payment',
          });
        }
      }),

    createMilestone: protectedProcedure
      .input(z.object({
        escrowId: z.string(),
        jobId: z.number(),
        title: z.string(),
        description: z.string(),
        amount: z.number().positive(),
      }))
      .mutation(async ({ input }) => {
        try {
          const milestone = escrowService.createMilestone({
            escrowId: input.escrowId,
            jobId: input.jobId.toString(),
            title: input.title,
            description: input.description,
            amount: input.amount,
          });
          
          await db.createMilestone(milestone);
          
          return { milestone };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create milestone',
          });
        }
      }),

    getMilestones: publicProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        try {
          const milestones = await db.getMilestonesByJob(input.jobId.toString());
          return { milestones };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get milestones',
          });
        }
      }),
  }),

  // Paystack Integration
  paystack: router({
    initializePayment: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        email: z.string().email(),
        reference: z.string(),
        metadata: z.any().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await paystackService.initializePayment({
            email: input.email,
            amount: input.amount,
            reference: input.reference,
            metadata: input.metadata,
            callback_url: `${process.env.VITE_API_URL || 'https://d3q4wvlwbm3s1h.cloudfront.net'}/payment/callback`,
          });
          
          return result;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to initialize payment',
          });
        }
      }),

    verifyPayment: protectedProcedure
      .input(z.object({ reference: z.string() }))
      .query(async ({ input }) => {
        try {
          const result = await paystackService.verifyPayment(input.reference);
          return result;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to verify payment',
          });
        }
      }),

    listBanks: publicProcedure
      .query(async () => {
        try {
          const result = await paystackService.listBanks('south africa');
          return result;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch banks',
          });
        }
      }),

    verifyAccount: protectedProcedure
      .input(z.object({
        account_number: z.string(),
        bank_code: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const result = await paystackService.verifyAccountNumber(input);
          return result;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to verify account',
          });
        }
      }),
  }),

  // Messaging
  messages: router({
    send: protectedProcedure
      .input(z.object({
        receiverId: z.string(),
        content: z.string().min(1).max(2000),
        type: z.enum(['text', 'image', 'file']).optional(),
        fileUrl: z.string().optional(),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
        jobId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Get or create conversation
          const conversation = await db.getOrCreateConversation(
            ctx.user.id,
            input.receiverId,
            input.jobId
          );
          
          // Create message
          const message = await db.createMessage({
            conversationId: conversation.id,
            senderId: ctx.user.id,
            receiverId: input.receiverId,
            content: input.content,
            type: input.type,
            fileUrl: input.fileUrl,
            fileName: input.fileName,
            fileSize: input.fileSize,
          });
          
          return { message, conversationId: conversation.id };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send message',
          });
        }
      }),

    list: protectedProcedure
      .input(z.object({
        conversationId: z.string(),
        limit: z.number().optional(),
        since: z.string().optional(),
      }))
      .query(async ({ input }) => {
        try {
          const messages = await db.getMessages(
            input.conversationId,
            input.limit || 50,
            input.since
          );
          
          return { messages, hasMore: messages.length === (input.limit || 50) };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch messages',
          });
        }
      }),

    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const conversations = await db.getUserConversations(ctx.user.id);
          return { conversations };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch conversations',
          });
        }
      }),

    markAsRead: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await db.markMessagesAsRead(input.conversationId, ctx.user.id);
          return { success: true };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to mark messages as read',
          });
        }
      }),

    getUploadUrl: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Generate S3 presigned URL for file upload
          const key = `messages/${ctx.user.id}/${Date.now()}_${input.fileName}`;
          const uploadUrl = await storagePut(key, input.fileType);
          
          return {
            uploadUrl,
            fileUrl: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`,
          };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate upload URL',
          });
        }
      }),
  }),

  // Review Prompts
  reviewPrompts: router({
    getPendingReviews: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          // Get completed jobs where user is buyer or worker
          const jobs = await db.getJobsByUser(ctx.user.id);
          const completedJobs = jobs.filter((j: any) => j.status === 'completed');

          // Check which jobs need reviews
          const pendingReviews = [];
          for (const job of completedJobs) {
            const existingReview = await db.getReviewForJob(job.id, ctx.user.id);
            if (!existingReview) {
              pendingReviews.push({
                jobId: job.id,
                jobTitle: job.title,
                completedAt: job.completedAt,
                otherPartyId: job.buyerId === ctx.user.id ? job.workerId : job.buyerId,
              });
            }
          }

          return { pendingReviews };
        } catch (error) {
          console.error('[REVIEW_PROMPTS] Error getting pending reviews:', error);
          return { pendingReviews: [] };
        }
      }),

    getReviewTemplates: publicProcedure
      .query(() => {
        return reviewPromptService.REVIEW_PROMPT_TEMPLATES;
      }),

    shouldPromptReview: publicProcedure
      .input(z.object({
        jobId: z.number(),
        completedAt: z.string(),
        promptSentAt: z.string().optional(),
        reviewSubmitted: z.boolean(),
      }))
      .query(({ input }) => {
        const shouldPrompt = reviewPromptService.shouldSendReviewPrompt(
          new Date(input.completedAt),
          input.promptSentAt ? new Date(input.promptSentAt) : null,
          input.reviewSubmitted
        );
        return { shouldPrompt };
      }),
  }),
});

export type AppRouter = typeof appRouter;
