/**
 * Subscriptions Router
 * Premium subscription management
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { putItem, getItem, updateItem, queryItems } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import { createSubscription, cancelSubscription } from '../lib/paystack.js';

const SUBSCRIPTION_PLANS = {
  basic: { 
    price: 0, 
    name: 'Basic', 
    features: ['5 job posts/month', 'Basic support', 'Standard visibility'] 
  },
  pro: { 
    price: 149, 
    name: 'Pro', 
    features: ['20 job posts/month', 'Priority support', 'Featured listings', 'Basic analytics', '5% platform fee'] 
  },
  elite: { 
    price: 299, 
    name: 'Elite', 
    features: ['Unlimited jobs', 'Premium support', 'Top featured listings', 'Advanced analytics', '3% platform fee', 'Dedicated account manager'] 
  }
};

export const subscriptionsRouter = router({
  // Get available plans
  getPlans: protectedProcedure
    .query(() => {
      return Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
        id: key,
        ...plan
      }));
    }),

  // Get current subscription
  getCurrentSubscription: protectedProcedure
    .query(async ({ ctx }) => {
      const subscription = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'SUBSCRIPTION'
      });

      if (!subscription) {
        return {
          plan: 'basic',
          status: 'active',
          features: SUBSCRIPTION_PLANS.basic.features
        };
      }

      return subscription;
    }),

  // Create subscription
  subscribe: protectedProcedure
    .input(z.object({
      plan: z.enum(['pro', 'elite'])
    }))
    .mutation(async ({ ctx, input }) => {
      const planDetails = SUBSCRIPTION_PLANS[input.plan];

      // Get user email
      const user = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'PROFILE'
      });

      if (!user || !user.email) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User email not found'
        });
      }

      const subscriptionId = uuidv4();

      // Create Paystack subscription
      try {
        const paystackSub = await createSubscription({
          email: user.email,
          plan: input.plan,
          userId: ctx.user!.userId
        });

        // Store subscription record
        const subscription = {
          PK: `USER#${ctx.user!.userId}`,
          SK: 'SUBSCRIPTION',
          subscriptionId,
          userId: ctx.user!.userId,
          plan: input.plan,
          amount: planDetails.price,
          status: 'pending',
          paystackSubscriptionCode: paystackSub.subscriptionCode,
          paystackEmailToken: paystackSub.emailToken,
          createdAt: new Date().toISOString(),
          features: planDetails.features
        };

        await putItem(subscription);

        return {
          subscriptionId,
          subscriptionCode: paystackSub.subscriptionCode,
          emailToken: paystackSub.emailToken,
          message: 'Check your email to complete subscription setup'
        };
      } catch (error: any) {
        console.error('Subscription creation error:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create subscription'
        });
      }
    }),

  // Activate subscription (called by webhook)
  activateSubscription: protectedProcedure
    .input(z.object({ 
      subscriptionCode: z.string() 
    }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'SUBSCRIPTION'
      });

      if (!subscription || subscription.paystackSubscriptionCode !== input.subscriptionCode) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Subscription not found'
        });
      }

      const now = new Date();
      const nextBillingDate = new Date(now);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      await updateItem(
        { PK: `USER#${ctx.user!.userId}`, SK: 'SUBSCRIPTION' },
        {
          status: 'active',
          activatedAt: now.toISOString(),
          nextBillingDate: nextBillingDate.toISOString()
        }
      );

      return { success: true, status: 'active' };
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(z.object({
      reason: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const subscription = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'SUBSCRIPTION'
      });

      if (!subscription) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No active subscription found'
        });
      }

      if (subscription.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Subscription is not active'
        });
      }

      // Cancel on Paystack
      try {
        await cancelSubscription(subscription.paystackSubscriptionCode);

        await updateItem(
          { PK: `USER#${ctx.user!.userId}`, SK: 'SUBSCRIPTION' },
          {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancellationReason: input.reason
          }
        );

        return { success: true, message: 'Subscription cancelled successfully' };
      } catch (error: any) {
        console.error('Subscription cancellation error:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel subscription'
        });
      }
    }),

  // Change subscription plan
  changePlan: protectedProcedure
    .input(z.object({
      newPlan: z.enum(['pro', 'elite'])
    }))
    .mutation(async ({ ctx, input }) => {
      const currentSub = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'SUBSCRIPTION'
      });

      if (!currentSub || currentSub.status !== 'active') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active subscription to change'
        });
      }

      if (currentSub.plan === input.newPlan) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Already on this plan'
        });
      }

      // Cancel current subscription
      try {
        await cancelSubscription(currentSub.paystackSubscriptionCode);

        // Get user email
        const user = await getItem({
          PK: `USER#${ctx.user!.userId}`,
          SK: 'PROFILE'
        });

        if (!user || !user.email) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User email not found'
          });
        }

        // Create new subscription
        const paystackSub = await createSubscription({
          email: user.email,
          plan: input.newPlan,
          userId: ctx.user!.userId
        });

        const newPlanDetails = SUBSCRIPTION_PLANS[input.newPlan];

        await updateItem(
          { PK: `USER#${ctx.user!.userId}`, SK: 'SUBSCRIPTION' },
          {
            plan: input.newPlan,
            amount: newPlanDetails.price,
            features: newPlanDetails.features,
            paystackSubscriptionCode: paystackSub.subscriptionCode,
            paystackEmailToken: paystackSub.emailToken,
            updatedAt: new Date().toISOString()
          }
        );

        return {
          success: true,
          message: 'Plan changed successfully. Check your email to confirm.',
          subscriptionCode: paystackSub.subscriptionCode
        };
      } catch (error: any) {
        console.error('Plan change error:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change plan'
        });
      }
    }),

  // Get subscription history
  getSubscriptionHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const history = await queryItems({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${ctx.user!.userId}`,
          ':sk': 'SUBSCRIPTION#'
        }
      });

      return history.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    })
});
