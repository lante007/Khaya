/**
 * Auth Router
 * Authentication and user management
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../trpc.js';
import { putItem, getItem, updateItem, queryByGSI, generateId, timestamp } from '../lib/db.js';
import { sendOTP, generateOTP, formatPhoneNumber, validatePhoneNumber } from '../lib/twilio.js';
import { sendOTPEmail } from '../lib/email.js';
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
   * Request OTP (for email/phone login)
   */
  requestOTP: publicProcedure
    .input(z.object({
      email: z.string().email().optional(),
      phone: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      // Validate at least one identifier provided
      if (!input.email && !input.phone) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email or phone number required'
        });
      }

      let user;
      let identifier: string = '';

      // Find user by email or phone
      if (input.email) {
        const users = await queryByGSI('GSI1', 'GSI1PK', `EMAIL#${input.email.toLowerCase()}`);
        user = users[0];
        identifier = input.email;
      } else if (input.phone) {
        const formattedPhone = formatPhoneNumber(input.phone);
        const users = await queryByGSI('GSI1', 'GSI1PK', `PHONE#${formattedPhone}`);
        user = users[0];
        identifier = formattedPhone;
      }

      // Generate OTP (whether user exists or not - don't leak user existence)
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000;
      
      // Log OTP for debugging (will show in CloudWatch)
      console.log(`[OTP] Generated for ${identifier}: ${otp} (expires in 10 min)`);
      
      if (user) {
        // Store OTP for existing user
        otpStore.set(user.userId, { otp, expiresAt });
        
        // Send OTP via phone (prefer phone over email)
        if (user.phone) {
          const otpResult = await sendOTP(user.phone, otp);
          console.log(`[OTP] Sent via ${otpResult.method} to ${user.phone}: ${otpResult.success ? 'SUCCESS' : 'FAILED'}`);
          return {
            success: otpResult.success,
            method: otpResult.method,
            isNewUser: false,
            ...(config.environment === 'development' && { devOtp: otp })
          };
        }
      } else {
        // New user - store OTP with identifier
        otpStore.set(identifier, { otp, expiresAt });
      }

      // Send OTP via email
      if (input.email) {
        const emailResult = await sendOTPEmail(input.email, otp);
        console.log(`[OTP] Email sent to ${input.email}: ${emailResult.success ? 'SUCCESS' : 'FAILED'}`);
        
        return {
          success: emailResult.success,
          method: 'email' as const,
          isNewUser: !user,
          message: emailResult.success 
            ? 'OTP sent to your email. Please check your inbox.' 
            : 'Failed to send email. Please try again or contact support.',
          ...(config.environment === 'development' && { devOtp: otp })
        };
      }

      // Fallback (shouldn't reach here)
      return {
        success: true,
        method: 'email' as const,
        isNewUser: !user,
        message: 'OTP generated. Check your email.',
        ...(config.environment === 'development' && { devOtp: otp })
      };
    }),

  /**
   * Verify OTP
   */
  verifyOTP: publicProcedure
    .input(z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      otp: z.string().length(6)
    }))
    .mutation(async ({ input }) => {
      // Validate at least one identifier provided
      if (!input.email && !input.phone) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email or phone number required'
        });
      }

      let user;
      let identifier: string = '';

      // Find user by email or phone
      if (input.email) {
        const users = await queryByGSI('GSI1', 'GSI1PK', `EMAIL#${input.email.toLowerCase()}`);
        user = users[0];
        identifier = input.email;
      } else if (input.phone) {
        const formattedPhone = formatPhoneNumber(input.phone);
        const users = await queryByGSI('GSI1', 'GSI1PK', `PHONE#${formattedPhone}`);
        user = users[0];
        identifier = formattedPhone;
      }

      // Check OTP
      const storedOTP = user ? otpStore.get(user.userId) : otpStore.get(identifier);
      
      if (!storedOTP) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'OTP expired or not found. Please request a new one.'
        });
      }

      if (storedOTP.expiresAt < Date.now()) {
        otpStore.delete(user ? user.userId : identifier);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'OTP expired. Please request a new one.'
        });
      }

      if (storedOTP.otp !== input.otp) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid OTP. Please try again.'
        });
      }

      // OTP is valid - clear it
      otpStore.delete(user ? user.userId : identifier);

      if (user) {
        // Existing user - mark as verified and return token
        await updateItem(
          { PK: `USER#${user.userId}`, SK: 'PROFILE' },
          { phoneVerified: true, verified: true }
        );

        const token = generateToken({
          userId: user.userId,
          userType: user.userType,
          email: user.email
        });

        return {
          success: true,
          isNewUser: false,
          token,
          user: {
            userId: user.userId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            userType: user.userType
          }
        };
      } else {
        // New user - return success and let them complete signup
        return {
          success: true,
          isNewUser: true,
          identifier: identifier
        };
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
      const user = await getItem({ PK: `USER#${input.userId}`, SK: 'PROFILE' });
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
