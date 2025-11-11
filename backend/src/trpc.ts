/**
 * tRPC Setup
 * Base router and procedures
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import jwt from 'jsonwebtoken';
import { config } from './config/aws.js';

// Context type
export interface Context {
  user?: {
    userId: string;
    userType: string;
    email?: string;
  };
}

// Create context from Lambda event
export function createContext({
  event,
  context,
}: CreateAWSLambdaContextOptions<any>): Context {
  // Extract token from Authorization header
  const token = event.headers?.authorization?.replace('Bearer ', '');
  
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      return {
        user: {
          userId: decoded.userId,
          userType: decoded.userType,
          email: decoded.email
        }
      };
    } catch (error) {
      // Invalid token, return empty context
      return {};
    }
  }
  
  return {};
}

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Export router and procedures
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure (requires authentication)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});

// Role-based procedures
export const buyerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user!.userType !== 'buyer') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Buyer access required'
    });
  }
  return next({ ctx });
});

export const workerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user!.userType !== 'worker') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Worker access required'
    });
  }
  return next({ ctx });
});

export const workerOnlyProcedure = workerProcedure;

export const clientOnlyProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user!.userType !== 'client' && ctx.user!.userType !== 'buyer') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Client access required'
    });
  }
  return next({ ctx });
});

export const sellerProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user!.userType !== 'seller') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Seller access required'
    });
  }
  return next({ ctx });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user!.userType !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required'
    });
  }
  return next({ ctx });
});
