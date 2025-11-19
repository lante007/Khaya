/**
 * User Router
 * Profile management, verification, settings
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure } from '../trpc.js';
import { getItem, updateItem, queryByGSI } from '../lib/db.js';
import { s3Client } from '../config/aws.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const userRouter = router({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await getItem({
      PK: `USER#${ctx.user!.userId}`,
      SK: 'PROFILE'
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    return user;
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      location: z.string().optional(),
      skills: z.array(z.string()).optional(),
      hourlyRate: z.number().optional(),
      businessName: z.string().optional(),
      businessReg: z.string().optional(),
      businessAddress: z.string().optional(),
      profilePictureUrl: z.string().optional(),
      trade: z.string().optional(),
      trades: z.array(z.string()).optional(),
      yearsExperience: z.number().optional(),
      certifications: z.string().optional(),
      photoUrl: z.string().optional(),
      languages: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const updates: any = {};
      
      if (input.name) updates.name = input.name;
      if (input.bio) updates.bio = input.bio;
      if (input.location) updates.location = input.location;
      if (input.skills) updates.skills = input.skills;
      if (input.hourlyRate) updates.hourlyRate = input.hourlyRate;
      if (input.businessName) updates.businessName = input.businessName;
      if (input.businessReg) updates.businessReg = input.businessReg;
      if (input.businessAddress) updates.businessAddress = input.businessAddress;
      if (input.profilePictureUrl !== undefined) updates.profilePictureUrl = input.profilePictureUrl;
      if (input.trade) updates.trade = input.trade;
      if (input.trades) updates.trades = input.trades;
      if (input.yearsExperience !== undefined) updates.yearsExperience = input.yearsExperience;
      if (input.certifications) updates.certifications = input.certifications;
      if (input.photoUrl) updates.photoUrl = input.photoUrl;
      if (input.languages) updates.languages = input.languages;
      
      updates.updatedAt = new Date().toISOString();

      await updateItem(
        { PK: `USER#${ctx.user!.userId}`, SK: 'PROFILE' },
        updates
      );

      return { success: true };
    }),

  // Get upload URL for portfolio/ID
  getUploadUrl: protectedProcedure
    .input(z.object({
      fileType: z.enum(['portfolio', 'id', 'avatar']),
      contentType: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const key = `${input.fileType}/${ctx.user!.userId}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME || 'khaya-uploads',
        Key: key,
        ContentType: input.contentType
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

      return {
        uploadUrl,
        fileUrl: `https://${process.env.S3_BUCKET_NAME || 'khaya-uploads'}.s3.${process.env.AWS_REGION || 'af-south-1'}.amazonaws.com/${key}`
      };
    }),

  // Submit verification documents
  submitVerification: protectedProcedure
    .input(z.object({
      idNumber: z.string(),
      idDocumentUrl: z.string(),
      proofOfAddressUrl: z.string().optional(),
      businessRegUrl: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      await updateItem(
        { PK: `USER#${ctx.user!.userId}`, SK: 'PROFILE' },
        {
          idNumber: input.idNumber,
          idDocumentUrl: input.idDocumentUrl,
          proofOfAddressUrl: input.proofOfAddressUrl,
          businessRegUrl: input.businessRegUrl,
          verificationStatus: 'pending',
          verificationSubmittedAt: new Date().toISOString()
        }
      );

      return { success: true, message: 'Verification documents submitted' };
    }),

  // Admin: Verify user
  verifyUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      approved: z.boolean(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      await updateItem(
        { PK: `USER#${input.userId}`, SK: 'PROFILE' },
        {
          verified: input.approved,
          verificationStatus: input.approved ? 'approved' : 'rejected',
          verificationNotes: input.notes,
          verifiedAt: input.approved ? new Date().toISOString() : undefined
        }
      );

      return { success: true };
    }),

  // Get user by ID (public info only)
  getUserById: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await getItem({
        PK: `USER#${input.userId}`,
        SK: 'PROFILE'
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      // Return only public fields
      return {
        userId: user.userId,
        name: user.name,
        userType: user.userType,
        location: user.location,
        bio: user.bio,
        skills: user.skills,
        hourlyRate: user.hourlyRate,
        rating: user.rating,
        reviewCount: user.reviewCount,
        completedJobs: user.completedJobs,
        verified: user.verified,
        portfolioUrls: user.portfolioUrls,
        businessName: user.businessName,
        createdAt: user.createdAt
      };
    }),

  // Search workers by skills/location
  searchWorkers: protectedProcedure
    .input(z.object({
      skills: z.array(z.string()).optional(),
      location: z.string().optional(),
      minRating: z.number().optional(),
      maxHourlyRate: z.number().optional(),
      verified: z.boolean().optional()
    }))
    .query(async ({ input }) => {
      // Query workers from GSI
      const workers = await queryByGSI(
        'GSI1',
        'userType',
        'worker',
        'location',
        input.location
      );

      // Filter by criteria
      let filtered = workers;

      if (input.skills && input.skills.length > 0) {
        filtered = filtered.filter(w => 
          w.skills && input.skills!.some(s => w.skills.includes(s))
        );
      }

      if (input.minRating) {
        filtered = filtered.filter(w => w.rating >= input.minRating!);
      }

      if (input.maxHourlyRate) {
        filtered = filtered.filter(w => w.hourlyRate <= input.maxHourlyRate!);
      }

      if (input.verified) {
        filtered = filtered.filter(w => w.verified === true);
      }

      return filtered.map(w => ({
        userId: w.userId,
        name: w.name,
        location: w.location,
        bio: w.bio,
        skills: w.skills,
        hourlyRate: w.hourlyRate,
        rating: w.rating,
        reviewCount: w.reviewCount,
        completedJobs: w.completedJobs,
        verified: w.verified,
        portfolioUrls: w.portfolioUrls
      }));
    })
});
