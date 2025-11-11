/**
 * Auth Router
 * Authentication and user management
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';
import { putItem, getItem, queryByGSI, generateId, timestamp } from '../lib/db.js';
import { sendOTP, generateOTP, formatPhoneNumber, validatePhoneNumber } from '../lib/twilio.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/aws.js';

// In-memory OTP store (in production, use Redis or DynamoDB with TTL)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().refine(validatePhoneNumber, 'Invalid South African phone number'),
  password: z.string().min(8),
  userType: z.enum(['buyer', 'worker', 'seller']),
  name: z.string().min(2)
});

const verifyOTPSchema = z.object({
  userId: z.string(),
  otp: z.string().length(6)
});

const signInSchema = z.object({
  identifier: z.string(), // email or phone
  password: z.string()
});

/**
 * Generate JWT token
 */
function generateToken(payload: {
  userId: string;
  userType: string;
  email?: string;
}): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

/**
 * Hash password
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const authRouter = router({
  /**
   * Sign Up
   */
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input }) => {
      const userId = generateId('user');
      const formattedPhone = formatPhoneNumber(input.phone);
      
      // Check if user already exists
      const existingUsers = await queryByGSI('GSI1', 'GSI1PK', `PHONE#${formattedPhone}`);
      if (existingUsers.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Phone number already registered'
        });
      }
      
      // Hash password
      const passwordHash = await hashPassword(input.password);
      
      // Generate OTP
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set(userId, { otp, expiresAt });
      
      // Send OTP
      const otpResult = await sendOTP(formattedPhone, otp);
      
      if (!otpResult.success && config.environment === 'production') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send OTP. Please try again.'
        });
      }
      
      // Create user profile (unverified)
      await putItem({
        PK: `USER#${userId}`,
        SK: 'PROFILE',
        entityType: 'USER',
        userId,
        name: input.name,
        email: input.email,
        phone: formattedPhone,
        passwordHash,
        userType: input.userType,
        verified: false,
        phoneVerified: false,
        trustScore: 0,
        completedJobs: 0,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        GSI1PK: `PHONE#${formattedPhone}`,
        GSI1SK: `USER#${userId}`
      });
      
      return {
        userId,
        otpSent: otpResult.success,
        method: otpResult.method,
        // Return OTP in development for testing
        ...(config.environment === 'development' && { otp })
      };
    }),

  /**
   * Verify OTP
   */
  verifyOTP: publicProcedure
    .input(verifyOTPSchema)
    .mutation(async ({ input }) => {
      // Check OTP
      const stored = otpStore.get(input.userId);
      if (!stored) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No OTP found. Please request a new one.'
        });
      }
      
      if (Date.now() > stored.expiresAt) {
        otpStore.delete(input.userId);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'OTP expired. Please request a new one.'
        });
      }
      
      if (stored.otp !== input.otp) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid OTP'
        });
      }
      
      // OTP verified, clear it
      otpStore.delete(input.userId);
      
      // Get user profile
      const user = await getItem(`USER#${input.userId}`, 'PROFILE');
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
      
      // Update user as verified
      await putItem({
        ...user,
        verified: true,
        phoneVerified: true,
        updatedAt: timestamp()
      });
      
      // Generate token
      const token = generateToken({
        userId: input.userId,
        userType: user.userType,
        email: user.email
      });
      
      return {
        verified: true,
        token,
        profileId: input.userId,
        userType: user.userType
      };
    }),

  /**
   * Sign In
   */
  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input }) => {
      // Find user by email or phone
      const isEmail = input.identifier.includes('@');
      let user;
      
      if (isEmail) {
        const users = await queryByGSI('GSI1', 'GSI1PK', `EMAIL#${input.identifier}`);
        user = users[0];
      } else {
        const formattedPhone = formatPhoneNumber(input.identifier);
        const users = await queryByGSI('GSI1', 'GSI1PK', `PHONE#${formattedPhone}`);
        user = users[0];
      }
      
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
      
      // Verify password
      const isValid = await verifyPassword(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid password'
        });
      }
      
      // Check if verified
      if (!user.verified) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Please verify your phone number first'
        });
      }
      
      // Generate token
      const token = generateToken({
        userId: user.userId,
        userType: user.userType,
        email: user.email
      });
      
      return {
        token,
        userType: user.userType,
        userId: user.userId
      };
    }),

  /**
   * Refresh Token
   */
  refreshToken: protectedProcedure
    .input(z.object({
      refreshToken: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const decoded = jwt.verify(input.refreshToken, config.jwtSecret) as any;
        
        const token = generateToken({
          userId: decoded.userId,
          userType: decoded.userType,
          email: decoded.email
        });
        
        return {
          token,
          expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
        };
      } catch (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token'
        });
      }
    }),

  /**
   * Resend OTP
   */
  resendOTP: publicProcedure
    .input(z.object({
      userId: z.string()
    }))
    .mutation(async ({ input }) => {
      // Get user
      const user = await getItem(`USER#${input.userId}`, 'PROFILE');
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }
      
      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      otpStore.set(input.userId, { otp, expiresAt });
      
      // Send OTP
      const otpResult = await sendOTP(user.phone, otp);
      
      return {
        success: otpResult.success,
        method: otpResult.method,
        ...(config.environment === 'development' && { otp })
      };
    })
});
