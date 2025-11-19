/**
 * Admin Router
 * Admin-only operations for platform management
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure, publicProcedure } from '../trpc.js';
import { putItem, getItem, updateItem, queryItems, queryByGSI, scanItems } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/aws.js';

export const adminRouter = router({
  // Admin login (separate from regular users)
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string()
    }))
    .mutation(async ({ input }) => {
      // Get admin by email
      const admins = await queryByGSI(
        'GSI1',
        'GSI1PK',
        'ADMIN',
        'GSI1SK',
        input.email
      );

      if (admins.length === 0) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        });
      }

      const admin = admins[0];

      // Verify password
      const isValid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        });
      }

      // Check if admin is active
      if (admin.status !== 'active') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admin account is not active'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: admin.adminId,
          userType: 'admin',
          email: admin.email,
          role: admin.role
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      // Update last login
      await updateItem(
        { PK: `ADMIN#${admin.adminId}`, SK: 'PROFILE' },
        { lastLoginAt: new Date().toISOString() }
      );

      return {
        token,
        admin: {
          adminId: admin.adminId,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      };
    }),

  // Get current admin profile
  getProfile: adminProcedure
    .query(async ({ ctx }) => {
      const admin = await getItem({
        PK: `ADMIN#${ctx.user!.userId}`,
        SK: 'PROFILE'
      });

      if (!admin) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Admin not found'
        });
      }

      return {
        adminId: admin.adminId,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt
      };
    }),

  // Dashboard statistics
  getDashboardStats: adminProcedure
    .query(async () => {
      // Get all users
      const users = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'USER#',
          ':sk': 'PROFILE'
        }
      });

      // Get all jobs
      const jobs = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'JOB#',
          ':sk': 'METADATA'
        }
      });

      // Get all payments
      const payments = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'PAYMENT#',
          ':sk': 'METADATA'
        }
      });

      // Calculate stats
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status === 'active').length;
      const verifiedUsers = users.filter(u => u.verified === true).length;
      const workers = users.filter(u => u.userType === 'worker').length;
      const clients = users.filter(u => u.userType === 'client' || u.userType === 'buyer').length;

      const totalJobs = jobs.length;
      const openJobs = jobs.filter(j => j.status === 'open').length;
      const inProgressJobs = jobs.filter(j => j.status === 'in_progress').length;
      const completedJobs = jobs.filter(j => j.status === 'completed').length;

      const totalPayments = payments.length;
      const completedPayments = payments.filter(p => p.status === 'completed').length;
      const totalRevenue = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const platformFees = payments
        .filter(p => p.status === 'completed' && p.feeBreakdown)
        .reduce((sum, p) => sum + (p.feeBreakdown.platformFee || 0), 0);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          verified: verifiedUsers,
          workers,
          clients
        },
        jobs: {
          total: totalJobs,
          open: openJobs,
          inProgress: inProgressJobs,
          completed: completedJobs
        },
        payments: {
          total: totalPayments,
          completed: completedPayments,
          totalRevenue,
          platformFees
        }
      };
    }),

  // Get all users (simple version for admin pages)
  getAllUsers: adminProcedure
    .query(async () => {
      const users = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'USER#',
          ':sk': 'PROFILE'
        }
      });

      return users.map((u: any) => ({
        userId: u.userId,
        email: u.email,
        phone: u.phone,
        name: u.name,
        userType: u.userType,
        status: u.status,
        verified: u.verified,
        createdAt: u.createdAt,
        completedJobs: u.completedJobs || 0,
        rating: u.rating || 0
      }));
    }),

  // Get all jobs (simple version for admin pages)
  getAllJobs: adminProcedure
    .query(async () => {
      const jobs = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'JOB#',
          ':sk': 'METADATA'
        }
      });

      return jobs.map((j: any) => ({
        jobId: j.jobId,
        title: j.title,
        description: j.description,
        location: j.location,
        budget: j.budget,
        status: j.status,
        createdAt: j.createdAt,
        bidsCount: j.bidsCount || 0
      }));
    }),

  // Get all payments (simple version for admin pages)
  getAllPayments: adminProcedure
    .query(async () => {
      const payments = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'PAYMENT#',
          ':sk': 'METADATA'
        }
      });

      return payments.map((p: any) => ({
        paymentId: p.paymentId,
        reference: p.reference,
        amount: p.amount,
        status: p.status,
        jobTitle: p.jobTitle,
        platformFee: p.feeBreakdown?.platformFee || 0,
        createdAt: p.createdAt
      }));
    }),

  // List all users with filters
  listUsers: adminProcedure
    .input(z.object({
      userType: z.enum(['all', 'client', 'worker', 'buyer']).optional(),
      status: z.enum(['all', 'active', 'suspended', 'pending']).optional(),
      verified: z.boolean().optional(),
      limit: z.number().default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ input }) => {
      let users = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'USER#',
          ':sk': 'PROFILE'
        }
      });

      // Apply filters
      if (input.userType && input.userType !== 'all') {
        users = users.filter(u => u.userType === input.userType);
      }

      if (input.status && input.status !== 'all') {
        users = users.filter(u => u.status === input.status);
      }

      if (input.verified !== undefined) {
        users = users.filter(u => u.verified === input.verified);
      }

      // Sort by creation date (newest first)
      users.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Pagination
      const startIndex = input.cursor ? parseInt(input.cursor) : 0;
      const endIndex = startIndex + input.limit;
      const paginatedUsers = users.slice(startIndex, endIndex);
      const nextCursor = endIndex < users.length ? endIndex.toString() : undefined;

      return {
        users: paginatedUsers.map(u => ({
          userId: u.userId,
          email: u.email,
          name: u.name,
          userType: u.userType,
          status: u.status,
          verified: u.verified,
          createdAt: u.createdAt,
          completedJobs: u.completedJobs || 0,
          rating: u.rating || 0
        })),
        nextCursor
      };
    }),

  // Verify/reject user
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

  // Suspend/unsuspend user
  suspendUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      suspend: z.boolean(),
      reason: z.string()
    }))
    .mutation(async ({ input }) => {
      await updateItem(
        { PK: `USER#${input.userId}`, SK: 'PROFILE' },
        {
          status: input.suspend ? 'suspended' : 'active',
          suspendedAt: input.suspend ? new Date().toISOString() : undefined,
          suspensionReason: input.suspend ? input.reason : undefined,
          unsuspendedAt: !input.suspend ? new Date().toISOString() : undefined
        }
      );

      return { success: true };
    }),

  // List all jobs with filters
  listJobs: adminProcedure
    .input(z.object({
      status: z.enum(['all', 'open', 'in_progress', 'completed', 'cancelled']).optional(),
      limit: z.number().default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ input }) => {
      let jobs = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'JOB#',
          ':sk': 'METADATA'
        }
      });

      if (input.status && input.status !== 'all') {
        jobs = jobs.filter(j => j.status === input.status);
      }

      jobs.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const startIndex = input.cursor ? parseInt(input.cursor) : 0;
      const endIndex = startIndex + input.limit;
      const paginatedJobs = jobs.slice(startIndex, endIndex);
      const nextCursor = endIndex < jobs.length ? endIndex.toString() : undefined;

      return {
        jobs: paginatedJobs,
        nextCursor
      };
    }),

  // List all payments
  listPayments: adminProcedure
    .input(z.object({
      status: z.enum(['all', 'pending', 'completed', 'failed']).optional(),
      limit: z.number().default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ input }) => {
      let payments = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk',
        ExpressionAttributeValues: {
          ':prefix': 'PAYMENT#',
          ':sk': 'METADATA'
        }
      });

      if (input.status && input.status !== 'all') {
        payments = payments.filter(p => p.status === input.status);
      }

      payments.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const startIndex = input.cursor ? parseInt(input.cursor) : 0;
      const endIndex = startIndex + input.limit;
      const paginatedPayments = payments.slice(startIndex, endIndex);
      const nextCursor = endIndex < payments.length ? endIndex.toString() : undefined;

      return {
        payments: paginatedPayments,
        nextCursor
      };
    }),

  // Get platform analytics
  getAnalytics: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string()
    }))
    .query(async ({ input }) => {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      // Get all relevant data
      const users = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND createdAt BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':prefix': 'USER#',
          ':sk': 'PROFILE',
          ':start': start.toISOString(),
          ':end': end.toISOString()
        }
      });

      const jobs = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND createdAt BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':prefix': 'JOB#',
          ':sk': 'METADATA',
          ':start': start.toISOString(),
          ':end': end.toISOString()
        }
      });

      const payments = await scanItems({
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND createdAt BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':prefix': 'PAYMENT#',
          ':sk': 'METADATA',
          ':start': start.toISOString(),
          ':end': end.toISOString()
        }
      });

      return {
        newUsers: users.length,
        newJobs: jobs.length,
        totalTransactions: payments.length,
        revenue: payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        platformFees: payments
          .filter(p => p.status === 'completed' && p.feeBreakdown)
          .reduce((sum, p) => sum + (p.feeBreakdown.platformFee || 0), 0)
      };
    }),

  // Create new admin (super admin only)
  createAdmin: adminProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string(),
      role: z.enum(['admin', 'super_admin'])
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if current user is super admin
      const currentAdmin = await getItem({
        PK: `ADMIN#${ctx.user!.userId}`,
        SK: 'PROFILE'
      });

      if (!currentAdmin) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Admin not found'
        });
      }

      if (currentAdmin.role !== 'super_admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only super admins can create new admins'
        });
      }

      // Check if email already exists
      const existing = await queryByGSI(
        'GSI1',
        'GSI1PK',
        'ADMIN',
        'GSI1SK',
        input.email
      );

      if (existing.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Admin with this email already exists'
        });
      }

      const adminId = uuidv4();
      const passwordHash = await bcrypt.hash(input.password, 10);

      const admin = {
        PK: `ADMIN#${adminId}`,
        SK: 'PROFILE',
        adminId,
        email: input.email,
        name: input.name,
        role: input.role,
        passwordHash,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: ctx.user!.userId,
        GSI1PK: 'ADMIN',
        GSI1SK: input.email
      };

      await putItem(admin);

      return {
        adminId,
        email: input.email,
        name: input.name,
        role: input.role
      };
    })
});
