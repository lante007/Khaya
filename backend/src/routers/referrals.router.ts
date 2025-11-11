/**
 * Referrals Router
 * Referral code generation, tracking, rewards
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc.js';
import { putItem, getItem, updateItem, queryItems, DbItem } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';

const REFERRAL_BONUS = 50; // R50 for both referrer and referee
const MIN_WITHDRAWAL = 100; // Minimum R100 to withdraw

function generateReferralCode(userId: string): string {
  return `KHAYA${userId.substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export const referralsRouter = router({
  // Get or create referral code
  getMyReferralCode: protectedProcedure
    .query(async ({ ctx }) => {
      let referral = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'REFERRAL'
      });

      if (!referral) {
        const code = generateReferralCode(ctx.user!.userId);
        
        const newReferral: DbItem = {
          PK: `USER#${ctx.user!.userId}`,
          SK: 'REFERRAL',
          userId: ctx.user!.userId,
          code,
          totalReferrals: 0,
          successfulReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          createdAt: new Date().toISOString(),
          GSI1PK: `REFERRAL#${code}`,
          GSI1SK: 'CODE'
        };

        await putItem(newReferral);
        referral = newReferral;
      }

      return referral;
    }),

  // Apply referral code (during signup)
  applyReferralCode: protectedProcedure
    .input(z.object({
      code: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user already used a referral code
      const existingReferral = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'REFERRED_BY'
      });

      if (existingReferral) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You have already used a referral code'
        });
      }

      // Find referrer by code
      const referrals = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `REFERRAL#${input.code}`
        }
      });

      if (referrals.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid referral code'
        });
      }

      const referrerData = referrals[0];
      const referrerId = referrerData.userId;

      // Can't refer yourself
      if (referrerId === ctx.user!.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot use your own referral code'
        });
      }

      const referralId = uuidv4();
      const now = new Date().toISOString();

      // Create referral record
      const referralRecord = {
        PK: `REFERRAL#${referralId}`,
        SK: 'METADATA',
        referralId,
        referrerId,
        refereeId: ctx.user!.userId,
        code: input.code,
        status: 'pending',
        bonusAmount: REFERRAL_BONUS,
        createdAt: now,
        GSI1PK: `USER#${referrerId}`,
        GSI1SK: now
      };

      await putItem(referralRecord);

      // Mark user as referred
      await putItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'REFERRED_BY',
        referrerId,
        referralId,
        code: input.code,
        appliedAt: now
      });

      // Update referrer stats
      await updateItem(
        { PK: `USER#${referrerId}`, SK: 'REFERRAL' },
        {
          totalReferrals: (referrerData.totalReferrals || 0) + 1,
          pendingEarnings: (referrerData.pendingEarnings || 0) + REFERRAL_BONUS
        }
      );

      return {
        success: true,
        message: `You'll receive R${REFERRAL_BONUS} bonus after your first completed job!`
      };
    }),

  // Complete referral (triggered when referee completes first job)
  completeReferral: protectedProcedure
    .input(z.object({
      refereeId: z.string()
    }))
    .mutation(async ({ input }) => {
      // Find referral record
      const referredBy = await getItem({
        PK: `USER#${input.refereeId}`,
        SK: 'REFERRED_BY'
      });

      if (!referredBy) {
        return { success: false, message: 'No referral found' };
      }

      const referralRecord = await getItem({
        PK: `REFERRAL#${referredBy.referralId}`,
        SK: 'METADATA'
      });

      if (!referralRecord || referralRecord.status !== 'pending') {
        return { success: false, message: 'Referral already completed or invalid' };
      }

      // Mark referral as completed
      await updateItem(
        { PK: `REFERRAL#${referredBy.referralId}`, SK: 'METADATA' },
        {
          status: 'completed',
          completedAt: new Date().toISOString()
        }
      );

      // Credit both users
      const referrer = await getItem({
        PK: `USER#${referredBy.referrerId}`,
        SK: 'PROFILE'
      });

      const referee = await getItem({
        PK: `USER#${input.refereeId}`,
        SK: 'PROFILE'
      });

      if (referrer) {
        await updateItem(
          { PK: `USER#${referredBy.referrerId}`, SK: 'PROFILE' },
          {
            balance: (referrer.balance || 0) + REFERRAL_BONUS
          }
        );

        await updateItem(
          { PK: `USER#${referredBy.referrerId}`, SK: 'REFERRAL' },
          {
            successfulReferrals: (referrer.successfulReferrals || 0) + 1,
            totalEarnings: (referrer.totalEarnings || 0) + REFERRAL_BONUS,
            pendingEarnings: Math.max(0, (referrer.pendingEarnings || 0) - REFERRAL_BONUS)
          }
        );
      }

      if (referee) {
        await updateItem(
          { PK: `USER#${input.refereeId}`, SK: 'PROFILE' },
          {
            balance: (referee.balance || 0) + REFERRAL_BONUS
          }
        );
      }

      return { success: true, bonusAmount: REFERRAL_BONUS };
    }),

  // Get my referrals
  getMyReferrals: protectedProcedure
    .query(async ({ ctx }) => {
      const referrals = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${ctx.user!.userId}`
        }
      });

      // Fetch referee details
      const referralsWithDetails = await Promise.all(
        referrals.map(async (ref: any) => {
          const referee = await getItem({
            PK: `USER#${ref.refereeId}`,
            SK: 'PROFILE'
          });

          return {
            ...ref,
            refereeName: referee?.name || 'Unknown',
            refereeEmail: referee?.email
          };
        })
      );

      return referralsWithDetails.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  // Get referral stats
  getReferralStats: protectedProcedure
    .query(async ({ ctx }) => {
      const referralData = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'REFERRAL'
      });

      if (!referralData) {
        return {
          code: '',
          totalReferrals: 0,
          successfulReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0
        };
      }

      return {
        code: referralData.code,
        totalReferrals: referralData.totalReferrals || 0,
        successfulReferrals: referralData.successfulReferrals || 0,
        totalEarnings: referralData.totalEarnings || 0,
        pendingEarnings: referralData.pendingEarnings || 0
      };
    }),

  // Get leaderboard
  getLeaderboard: protectedProcedure
    .input(z.object({
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      // This would need a GSI on totalEarnings for efficient querying
      // For now, we'll scan (not ideal for production)
      const allReferrals = await queryItems({
        FilterExpression: 'attribute_exists(totalEarnings) AND totalEarnings > :zero',
        ExpressionAttributeValues: {
          ':zero': 0
        }
      });

      // Sort by total earnings
      const sorted = allReferrals
        .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
        .slice(0, input.limit);

      // Fetch user details
      const leaderboard = await Promise.all(
        sorted.map(async (ref, index) => {
          const user = await getItem({
            PK: `USER#${ref.userId}`,
            SK: 'PROFILE'
          });

          return {
            rank: index + 1,
            userId: ref.userId,
            name: user?.name || 'Anonymous',
            totalReferrals: ref.successfulReferrals || 0,
            totalEarnings: ref.totalEarnings || 0
          };
        })
      );

      return leaderboard;
    })
});
