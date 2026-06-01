import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { eq } from "drizzle-orm";
import { escrows, paymentTransactions } from "../drizzle/schema";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import * as aiClaude from "./ai/claude";
import * as aiOpenAI from "./ai/openai";
import * as badgeService from "./services/badges";
import * as reviewPromptService from "./services/review-prompts";
import * as escrowService from "./services/escrow";
import * as paystackService from "./services/paystack";
import * as otpService from "./services/otp";
import * as waveService from "./services/waves";
import * as gradingService from "./services/grading";
import * as estimationService from "./services/estimation";

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

    // OTP-based auth — Twilio SMS/WhatsApp delivery
    requestOTP: publicProcedure
      .input(z.object({
        phone: z.string().optional(),
        email: z.string().email().optional(),
        method: z.enum(['sms', 'whatsapp', 'email']).optional(),
      }))
      .mutation(async ({ input }) => {
        const phone = input.phone;
        if (!phone) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Phone number is required for OTP.' });
        }
        try {
          const result = await otpService.sendOtp(phone, input.method === 'whatsapp' ? 'whatsapp' : 'sms');
          return {
            success: true,
            method: input.method ?? 'sms',
            // devCode only present in development — never sent in production
            ...(result.devCode ? { devCode: result.devCode } : {}),
          } as const;
        } catch (err) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: err instanceof Error ? err.message : 'Failed to send OTP.',
          });
        }
      }),

    verifyOTP: publicProcedure
      .input(z.object({
        phone: z.string().optional(),
        email: z.string().optional(),
        otp: z.string().length(6),
        userType: z.enum(['buyer', 'worker', 'seller']).optional(),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const phone = input.phone;
        if (!phone) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Phone number is required.' });
        }
        const result = await otpService.verifyOtp(phone, input.otp);
        if (!result.valid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: result.reason ?? 'Invalid OTP.' });
        }
        // Check if user already exists
        const existing = await db.getUserByPhone?.(phone).catch(() => null);
        const isNewUser = !existing;
        return { success: true, isNewUser, phone } as const;
      }),

    signIn: publicProcedure
      .input(z.object({
        identifier: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Password auth stub — real auth goes through Manus OAuth.
        throw new TRPCError({ code: 'METHOD_NOT_SUPPORTED', message: 'Use OTP login via the Manus OAuth portal.' });
      }),

    signUp: publicProcedure
      .input(z.object({
        phone: z.string(),
        password: z.string(),
        userType: z.enum(['buyer', 'worker', 'seller']),
        name: z.string(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ input }) => {
        // Sign-up stub — real auth goes through Manus OAuth.
        throw new TRPCError({ code: 'METHOD_NOT_SUPPORTED', message: 'Use OTP login via the Manus OAuth portal.' });
      }),
  }),

  // Admin panel — all routes require role === 'admin' via adminProcedure
  admin: router({
    // Login: validates against env-var credentials, then the session cookie
    // carries the user's role. Admin role is auto-assigned when openId === OWNER_OPEN_ID.
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input }) => {
        const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@projectkhaya.co.za';
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Admin credentials not configured.' });
        }
        if (input.email !== adminEmail || input.password !== adminPassword) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }
        return { success: true, admin: { name: 'Admin', email: adminEmail } };
      }),

    getStats: adminProcedure.query(async () => {
      return { totalUsers: 0, totalJobs: 0, totalPayments: 0, pendingApprovals: 0 };
    }),

    getDashboardStats: adminProcedure.query(async () => {
      return {
        totalUsers: 0, totalJobs: 0, totalPayments: 0, pendingApprovals: 0,
        users: { total: 0, verified: 0, workers: 0, clients: 0 },
        jobs: { total: 0, open: 0, inProgress: 0, completed: 0 },
        payments: { totalRevenue: 0, platformFees: 0, completed: 0 },
      };
    }),

    getProfile: adminProcedure.query(async ({ ctx }) => {
      return { name: ctx.user.name ?? 'Admin', email: ctx.user.email ?? '' };
    }),

    getUsers: adminProcedure
      .input(z.object({ page: z.number().optional(), limit: z.number().optional(), role: z.string().optional() }))
      .query(async () => ({ users: [] as any[], total: 0 })),

    getAllUsers: adminProcedure.query(async () => ([] as any[])),

    updateUser: adminProcedure
      .input(z.object({ userId: z.string(), action: z.enum(['suspend', 'reinstate', 'override_grade']), grade: z.string().optional() }))
      .mutation(async ({ input }) => {
        // TODO: implement suspend/reinstate/grade override against DB
        return { success: true, action: input.action, userId: input.userId };
      }),

    getJobs: adminProcedure
      .input(z.object({ page: z.number().optional(), status: z.string().optional() }))
      .query(async () => ({ jobs: [] as any[], total: 0 })),

    getAllJobs: adminProcedure.query(async () => ([] as any[])),

    rebroadcastJob: adminProcedure
      .input(z.object({ jobId: z.string() }))
      .mutation(async ({ input }) => {
        // TODO: re-trigger wave broadcasting for expired job
        return { success: true, jobId: input.jobId };
      }),

    getPayments: adminProcedure
      .input(z.object({ page: z.number().optional() }))
      .query(async () => ({ payments: [] as any[], total: 0 })),

    getAllPayments: adminProcedure.query(async () => ([] as any[])),

    issueRefund: adminProcedure
      .input(z.object({ paymentId: z.string(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        // TODO: call Paystack refund API
        return { success: true, paymentId: input.paymentId };
      }),

    approveSeller: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.upsertProfile({ userId: input.userId, location: '', verified: true });
        return { success: true };
      }),
  }),

  // Profile Management
  profile: router({
    get: protectedProcedure
      .input(z.object({ userId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const userId = input.userId ?? ctx.user.id;
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
        const job = await db.createJob({
          ...input,
          budget: budgetInCents,
          buyerId: ctx.user.id,
        });
        // Trigger Wave 1 broadcast immediately after job creation
        if (job?.id) {
          waveService.broadcastWave(job.id, 1).catch(err =>
            console.error('[WAVE] Wave 1 broadcast failed:', err)
          );
        }
        return job;
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getJobById(input.id);
      }),

    // Alias used by JobDetail.tsx
    getByJobId: publicProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        return await db.getJobById(parseInt(input.jobId));
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
        const result = await db.updateJobStatus(input.jobId, input.status);
        // Recalculate grade for the assigned worker when job completes
        if (input.status === 'completed' && job.selectedBidId) {
          const bid = await db.getBidById(job.selectedBidId);
          if (bid?.workerId) {
            gradingService.updateWorkerGrade(bid.workerId).catch(err =>
              console.error('[GRADING] Grade update on completion failed:', err)
            );
          }
        }
        return result;
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

    // Alias used by JobDetail.tsx
    getJobBids: publicProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        return await db.getBidsByJob(parseInt(input.jobId));
      }),

    // Alias used by JobDetail.tsx
    submit: protectedProcedure
      .input(z.object({
        jobId: z.string(),
        amount: z.number().positive(),
        timeline: z.number().positive(),
        proposal: z.string().min(20),
      }))
      .mutation(async ({ ctx, input }) => {
        const amountInCents = Math.round(input.amount * 100);
        const jobIdNum = parseInt(input.jobId);
        const job = await db.getJobById(jobIdNum);
        if (job) {
          await db.createNotification({
            userId: job.buyerId,
            title: 'New Bid Received',
            message: `You received a new bid of R${input.amount} on "${job.title}"`,
            type: 'bid',
            relatedId: jobIdNum,
          });
        }
        return await db.createBid({
          jobId: jobIdNum,
          amount: amountInCents,
          timeline: input.timeline,
          proposal: input.proposal,
          workerId: ctx.user.id,
        });
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
        
        const review = await db.createReview({
          ...input,
          reviewerId: ctx.user.id,
        });
        // Recalculate grade for the reviewed worker after each new review
        gradingService.updateWorkerGrade(input.reviewedId).catch(err =>
          console.error('[GRADING] Grade update failed:', err)
        );
        return review;
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
        await db.createNotification({
          userId: input.receiverId,
          title: 'New Message',
          message: `You have a new message from ${ctx.user.name || 'a user'}`,
          type: 'message',
        });
        return await db.createMessage({
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          jobId: input.jobId ?? null,
          content: input.content,
          read: false,
        });
      }),

    getConversation: protectedProcedure
      .input(z.object({ otherUserId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getMessages(
          [Math.min(ctx.user.id, input.otherUserId), Math.max(ctx.user.id, input.otherUserId), 0].join('_')
        );
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
        await db.upsertUser({
          openId: ctx.user.openId ?? '',
          phone: ctx.user.phone,
          role: input.role,
        });
        return { success: true };
      }),

    // Aliases used by Profile and ProfilePictureUpload components
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getProfileByUserId(ctx.user.id);
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        bio: z.string().optional(),
        trade: z.string().optional(),
        location: z.string().optional(),
        photoUrl: z.string().optional(),
        certifications: z.string().optional(),
        yearsExperience: z.number().optional(),
        availabilityStatus: z.enum(['available', 'busy', 'unavailable']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertProfile({
          userId: ctx.user.id,
          location: input.location ?? '',
          ...input,
        });
      }),

    getUploadUrl: protectedProcedure
      .input(z.object({ fileName: z.string(), fileType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const key = `profiles/${ctx.user.id}/${Date.now()}_${input.fileName}`;
        // Return a stub upload URL — real S3 presigned URL generation goes here post-launch
        const baseUrl = process.env.STORAGE_BASE_URL ?? '';
        return {
          uploadUrl: `${baseUrl}/upload/${key}`,
          fileUrl: `${baseUrl}/${key}`,
        };
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

    // Vision-enabled cost estimation (ASpec.md)
    estimateCost: publicProcedure
      .input(z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        category: z.string(),
        location: z.string(),
        /** Base64-encoded photos (JPEG/PNG), max 5 */
        photos: z.array(z.string()).max(5).optional(),
        budgetHint: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        if (!process.env.ANTHROPIC_API_KEY) {
          // No API key — return category-based fallback immediately
          return estimationService.fallbackEstimate(input.category);
        }
        try {
          return await estimationService.estimateJobCost(input);
        } catch (err) {
          console.error('[ESTIMATION] AI estimate failed, using fallback:', err);
          return estimationService.fallbackEstimate(input.category);
        }
      }),
  }),

  // Trust Badges
  badges: router({
    getUserBadges: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        try {
          // Get user profile and stats
          const profile = await db.getProfileByUserId(input.userId);
          const reviews = await db.getReviewsForUser(input.userId);
          
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
          const reviews = await db.getReviewsForUser(ctx.user.id);
          
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
        workerId: z.number(),
        totalAmount: z.number().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const amounts = escrowService.calculateEscrowAmounts(input.totalAmount);
        const reference = escrowService.generatePaystackReference(`job_${input.jobId}`);

        const [result] = await drizzleDb.insert(escrows).values({
          jobId: input.jobId,
          buyerId: ctx.user.id,
          workerId: input.workerId,
          amount: String(input.totalAmount),
          platformFee: String(amounts.buyerFee + amounts.workerFee),
          paystackFee: "0",
          buyerTotal: String(amounts.buyerTotal),
          workerPayout: String(amounts.workerReceives),
          paystackReference: reference,
          status: "pending",
        });

        const escrowId = (result as any).insertId as number;

        return {
          escrowId,
          amounts,
          paystackReference: reference,
        };
      }),

    getByJobId: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const [escrow] = await drizzleDb
          .select()
          .from(escrows)
          .where(eq(escrows.jobId, input.jobId))
          .limit(1);

        return { escrow: escrow ?? null };
      }),

    payDeposit: protectedProcedure
      .input(z.object({
        escrowId: z.number(),
        paystackReference: z.string(),
      }))
      .mutation(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const verification = await escrowService.verifyPaystackPayment(input.paystackReference);
        if (!verification.success) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Payment verification failed' });
        }

        await drizzleDb
          .update(escrows)
          .set({ status: "deposit_paid", paystackReference: input.paystackReference })
          .where(eq(escrows.id, input.escrowId));

        // Log the transaction
        await drizzleDb.insert(paymentTransactions).values({
          escrowId: input.escrowId,
          paystackReference: input.paystackReference,
          amount: String((verification.amount ?? 0) / 100),
          currency: "ZAR",
          status: "success",
        });

        return { success: true };
      }),

    releasePayment: protectedProcedure
      .input(z.object({ escrowId: z.number() }))
      .mutation(async ({ input }) => {
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const [escrow] = await drizzleDb
          .select()
          .from(escrows)
          .where(eq(escrows.id, input.escrowId))
          .limit(1);

        if (!escrow) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Escrow not found' });
        }

        if (escrow.status !== 'held' && escrow.status !== 'funded' && escrow.status !== 'deposit_paid') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot release escrow in status: ${escrow.status}`,
          });
        }

        await drizzleDb
          .update(escrows)
          .set({ status: "released", releasedAt: new Date() })
          .where(eq(escrows.id, input.escrowId));

        return { success: true };
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
          const milestone = await db.createMilestone({
            jobId: input.jobId,
            title: input.title,
            description: input.description ?? null,
            status: 'pending',
          });
          
          return { milestone, escrowId: input.escrowId };
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
          const milestones = await db.getMilestonesByJob(input.jobId);
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
        receiverId: z.number(),
        content: z.string().min(1).max(2000),
        jobId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const conversation = await db.getOrCreateConversation(ctx.user.id, input.receiverId, input.jobId);
          const message = await db.createMessage({
            senderId: ctx.user.id,
            receiverId: input.receiverId,
            jobId: input.jobId ?? null,
            content: input.content,
            read: false,
          });
          return { message, conversationId: conversation.id };
        } catch (error) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to send message' });
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
          const key = `messages/${ctx.user.id}/${Date.now()}_${input.fileName}`;
          const baseUrl = process.env.STORAGE_BASE_URL ?? '';
          return {
            uploadUrl: `${baseUrl}/upload/${key}`,
            fileUrl: `${baseUrl}/${key}`,
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
                completedAt: job.completionDate?.toISOString() ?? null,
                otherPartyId: job.buyerId === ctx.user.id ? (job.selectedBidId ?? 0) : job.buyerId,
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

  // Grading system — worker grade calculation and skill management
  grading: router({
    // Get grade for any worker (public — shown on profile)
    getGrade: publicProcedure
      .input(z.object({ workerId: z.number() }))
      .query(async ({ input }) => {
        return await gradingService.calculateGrade(input.workerId);
      }),

    // Get the logged-in worker's own grade
    getMyGrade: protectedProcedure.query(async ({ ctx }) => {
      return await gradingService.calculateGrade(ctx.user.id);
    }),

    // Get skills for a worker
    getSkills: publicProcedure
      .input(z.object({ workerId: z.number() }))
      .query(async ({ input }) => {
        return await gradingService.getWorkerSkills(input.workerId);
      }),

    // Add/update a skill for the logged-in worker
    upsertSkill: protectedProcedure
      .input(z.object({
        skill: z.string().min(2).max(100),
        grade: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum']).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await gradingService.upsertWorkerSkill(ctx.user.id, input.skill, input.grade ?? 'Bronze');
        return { success: true };
      }),

    // Admin: verify a skill (elevates trust)
    verifySkill: adminProcedure
      .input(z.object({ workerId: z.number(), skill: z.string(), grade: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum']) }))
      .mutation(async ({ input }) => {
        await gradingService.upsertWorkerSkill(input.workerId, input.skill, input.grade, true);
        await gradingService.updateWorkerGrade(input.workerId);
        return { success: true };
      }),
  }),

  // Wave system — geographic job broadcasting
  wave: router({
    // Get pending wave invitations for the logged-in worker
    getMyInvitations: protectedProcedure.query(async ({ ctx }) => {
      return await waveService.getPendingWavesForWorker(ctx.user.id);
    }),

    // Accept a wave invitation (atomic — first acceptance wins)
    accept: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await waveService.acceptWave(input.jobId, ctx.user.id);
        } catch (err) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: err instanceof Error ? err.message : 'Could not accept job',
          });
        }
      }),

    // Decline a wave invitation
    decline: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await waveService.declineWave(input.jobId, ctx.user.id);
        return { success: true };
      }),

    // Get wave status for a job (buyer/admin view)
    getForJob: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input }) => {
        return await waveService.getWavesForJob(input.jobId);
      }),

    // Manually trigger next wave (admin use / scheduler fallback)
    broadcast: adminProcedure
      .input(z.object({ jobId: z.number(), waveNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]) }))
      .mutation(async ({ input }) => {
        const count = await waveService.broadcastWave(input.jobId, input.waveNumber);
        return { success: true, notified: count };
      }),
  }),

  // Worker resume (public profile + work history)
  resume: router({
    getWorkerResume: publicProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        const userIdNum = parseInt(input.userId);
        const [profile, user, reviews] = await Promise.all([
          db.getProfileByUserId(userIdNum),
          db.getUserById(userIdNum),
          db.getReviewsForUser(userIdNum),
        ]);
        const avgRating = reviews.length
          ? reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / reviews.length
          : 0;
        return {
          profile: profile ? { ...profile, name: user?.name ?? null } : null,
          reviews,
          completedJobs: profile?.completedJobs ?? 0,
          totalJobs: 0,
          avgRating,
          strength: profile?.trustScore ?? 0,
          tier: 'Bronze' as const,
          badges: [] as any[],
          skills: profile?.trade ? [profile.trade] : [],
          projects: [] as any[],
          updatedAt: new Date().toISOString(),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
