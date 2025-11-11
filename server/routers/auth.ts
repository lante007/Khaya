/**
 * Authentication Router
 * Handles sign-up, sign-in, OTP verification
 */

import { z } from 'zod';
import { router, publicProcedure } from '../_core/trpc';
import { generateToken, generateOTP, hashPassword, verifyPassword, UserRole } from '../auth/jwt';
import { TRPCError } from '@trpc/server';

// Validation schemas
const emailSchema = z.string().email('Invalid email address');

const signUpSchema = z.object({
  email: emailSchema,
  name: z.string().min(2),
  role: z.enum(['buyer', 'worker', 'supplier', 'admin']),
  password: z.string().min(6).optional()
});

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().optional(),
  otp: z.string().length(6).optional()
});

const verifyOTPSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6)
});

// In-memory OTP storage (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export const authRouter = router({
  /**
   * Request OTP for email verification
   */
  requestOTP: publicProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ input }) => {
      const otp = generateOTP();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store OTP
      otpStore.set(input.email, { otp, expiresAt });

      // Send OTP via email
      const { sendOTPEmail } = await import('../services/email');
      const success = await sendOTPEmail(input.email, otp);

      if (!success && process.env.NODE_ENV !== 'development') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send OTP. Please try again.'
        });
      }

      console.log(`OTP sent to ${input.email}: ${otp}`);

      return {
        success: true,
        message: 'OTP sent to your email',
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      };
    }),

  /**
   * Verify OTP
   */
  verifyOTP: publicProcedure
    .input(verifyOTPSchema)
    .mutation(async ({ input, ctx }) => {
      const stored = otpStore.get(input.email);

      if (!stored) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No OTP found. Please request a new one.'
        });
      }

      if (Date.now() > stored.expiresAt) {
        otpStore.delete(input.email);
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
      otpStore.delete(input.email);

      // Check if user exists
      const db = await ctx.db();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, input.email)
      });

      if (existingUser) {
        // User exists, sign them in
        const token = await generateToken({
          id: existingUser.id,
          email: existingUser.email || undefined,
          phone: existingUser.phone,
          role: existingUser.role as UserRole
        });

        return {
          success: true,
          token,
          user: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            phone: existingUser.phone,
            role: existingUser.role
          },
          isNewUser: false
        };
      }

      // New user, return verified status
      return {
        success: true,
        verified: true,
        isNewUser: true,
        message: 'Email verified. Please complete registration.'
      };
    }),

  /**
   * Sign up new user
   */
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await ctx.db();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, input.email)
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists'
        });
      }

      // Hash password if provided
      let passwordHash: string | undefined;
      if (input.password) {
        passwordHash = await hashPassword(input.password);
      }

      // Create user
      const [newUser] = await db.insert(users).values({
        phone: input.phone || null,
        email: input.email,
        name: input.name,
        role: input.role,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Create profile
      await db.insert(profiles).values({
        userId: newUser.id,
        bio: '',
        location: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Generate token
      const token = await generateToken({
        id: newUser.id,
        email: newUser.email || undefined,
        phone: newUser.phone,
        role: newUser.role as UserRole
      });

      return {
        success: true,
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role
        }
      };
    }),

  /**
   * Sign in existing user
   */
  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await ctx.db();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Find user
      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, input.email)
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found'
        });
      }

      // Verify password if provided
      if (input.password) {
        if (!user.passwordHash) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Password not set. Please use OTP login.'
          });
        }

        const isValid = await verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid password'
          });
        }
      } else if (input.otp) {
        // Verify OTP
        const stored = otpStore.get(input.email);
        if (!stored || stored.otp !== input.otp || Date.now() > stored.expiresAt) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired OTP'
          });
        }
        otpStore.delete(input.email);
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Password or OTP required'
        });
      }

      // Generate token
      const token = await generateToken({
        id: user.id,
        email: user.email || undefined,
        phone: user.phone,
        role: user.role as UserRole
      });

      return {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      };
    }),

  /**
   * Get current user
   */
  me: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        return null;
      }

      const db = await ctx.db();
      if (!db) return null;

      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, ctx.user!.userId),
        with: {
          profile: true
        }
      });

      return user;
    })
});

// Import users and profiles from schema
import { users, profiles } from '../../drizzle/schema';
