/**
 * Payments Router
 * Paystack payment processing, escrow management
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, clientOnlyProcedure, publicProcedure } from '../trpc.js';
import { putItem, getItem, updateItem, queryItems } from '../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import { 
  createPaymentSession, 
  verifyPayment, 
  calculateFee,
  verifyWebhookSignature 
} from '../lib/paystack.js';
import { config } from '../config/aws.js';

export const paymentsRouter = router({
  // Initialize payment (client creates escrow) - Original version
  initializePayment: clientOnlyProcedure
    .input(z.object({
      jobId: z.union([z.string(), z.number()]).optional(),
      amount: z.number().positive(),
      description: z.string().optional(),
      email: z.string().email(),
      reference: z.string().optional(),
      metadata: z.any().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const jobId = input.jobId ? input.jobId.toString() : undefined;
      const description = input.description || 'Payment for job';
      
      // If jobId provided, verify job ownership
      if (jobId) {
        const job = await getItem({
          PK: `JOB#${jobId}`,
          SK: 'METADATA'
        });

        if (job && job.clientId !== ctx.user!.userId) {
          console.error('[Payment] Unauthorized access:', { jobClientId: job.clientId, userId: ctx.user!.userId });
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized'
          });
        }
      }

      // Get user details
      const user = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'PROFILE'
      });

      if (!user) {
        console.error('[Payment] User not found:', ctx.user!.userId);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User not found'
        });
      }

      console.log('[Payment] User details:', { email: input.email, completedJobs: user.completedJobs });

      const paymentId = uuidv4();
      const reference = input.reference || `khaya_${paymentId}_${Date.now()}`;

      // Create Paystack payment session
      try {
        console.log('[Payment] Creating Paystack session...');
        
        // Build callback URL - redirect to job page after payment
        const callbackUrl = jobId 
          ? `${config.frontendUrl}/jobs/${jobId}?payment=success`
          : `${config.frontendUrl}/dashboard?payment=success`;
        
        const session = await createPaymentSession({
          userId: ctx.user!.userId,
          email: input.email,
          amount: input.amount,
          jobId: jobId || 'no-job',
          userType: 'buyer',
          completedJobs: user.completedJobs || 0,
          reference,
          metadata: input.metadata,
          callback_url: callbackUrl
        });
        console.log('[Payment] Paystack session created:', { reference: session.reference, callbackUrl });

        // Store payment record
        const payment = {
          PK: `PAYMENT#${paymentId}`,
          SK: 'METADATA',
          paymentId,
          jobId: jobId || 'no-job',
          clientId: ctx.user!.userId,
          amount: input.amount,
          description,
          status: 'pending',
          paystackReference: session.reference,
          paystackAccessCode: session.sessionId,
          feeBreakdown: session.feeBreakdown,
          createdAt: new Date().toISOString(),
          GSI1PK: jobId ? `JOB#${jobId}` : `USER#${ctx.user!.userId}`,
          GSI1SK: new Date().toISOString(),
          metadata: input.metadata
        };

        await putItem(payment);

        return {
          success: true,
          data: {
            authorization_url: session.authorizationUrl,
            access_code: session.sessionId,
            reference: session.reference
          },
          paymentId,
          feeBreakdown: session.feeBreakdown
        };
      } catch (error: any) {
        console.error('[Payment] Paystack error:', error);
        console.error('[Payment] Error details:', { message: error.message, stack: error.stack });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to initialize payment: ${error.message || 'Unknown error'}`
        });
      }
    }),

  // Legacy initializePayment for backwards compatibility
  initializePaymentLegacy: clientOnlyProcedure
    .input(z.object({
      jobId: z.string(),
      amount: z.number().positive(),
      description: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('[Payment] Initializing payment:', { jobId: input.jobId, amount: input.amount, userId: ctx.user!.userId });
      
      // Verify job ownership
      const job = await getItem({
        PK: `JOB#${input.jobId}`,
        SK: 'METADATA'
      });

      if (!job) {
        console.error('[Payment] Job not found:', input.jobId);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      if (job.clientId !== ctx.user!.userId) {
        console.error('[Payment] Unauthorized access:', { jobClientId: job.clientId, userId: ctx.user!.userId });
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized'
        });
      }

      // Get user details
      const user = await getItem({
        PK: `USER#${ctx.user!.userId}`,
        SK: 'PROFILE'
      });

      if (!user || !user.email) {
        console.error('[Payment] User email not found:', ctx.user!.userId);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User email not found'
        });
      }

      console.log('[Payment] User details:', { email: user.email, completedJobs: user.completedJobs });

      const paymentId = uuidv4();

      // Create Paystack payment session
      try {
        console.log('[Payment] Creating Paystack session...');
        
        // Build callback URL - redirect to job page after payment
        const callbackUrl = `${config.frontendUrl}/jobs/${input.jobId}?payment=success`;
        
        const session = await createPaymentSession({
          userId: ctx.user!.userId,
          email: user.email,
          amount: input.amount,
          jobId: input.jobId,
          userType: 'buyer',
          completedJobs: user.completedJobs || 0,
          callback_url: callbackUrl
        });
        console.log('[Payment] Paystack session created:', { reference: session.reference, callbackUrl });

        // Store payment record
        const payment = {
          PK: `PAYMENT#${paymentId}`,
          SK: 'METADATA',
          paymentId,
          jobId: input.jobId,
          clientId: ctx.user!.userId,
          workerId: job.assignedWorkerId,
          amount: input.amount,
          description: input.description,
          status: 'pending',
          paystackReference: session.reference,
          paystackAccessCode: session.sessionId,
          feeBreakdown: session.feeBreakdown,
          createdAt: new Date().toISOString(),
          GSI1PK: `JOB#${input.jobId}`,
          GSI1SK: new Date().toISOString()
        };

        await putItem(payment);

        return {
          paymentId,
          authorizationUrl: session.authorizationUrl,
          reference: session.reference,
          feeBreakdown: session.feeBreakdown
        };
      } catch (error: any) {
        console.error('[Payment] Paystack error:', error);
        console.error('[Payment] Error details:', { message: error.message, stack: error.stack });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to initialize payment: ${error.message || 'Unknown error'}`
        });
      }
    }),

  // Verify payment (webhook or manual check)
  verifyPayment: protectedProcedure
    .input(z.object({ 
      paymentId: z.string().optional(),
      reference: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      let payment;
      
      if (input.paymentId) {
        payment = await getItem({
          PK: `PAYMENT#${input.paymentId}`,
          SK: 'METADATA'
        });
      } else if (input.reference) {
        // Find payment by reference
        const payments = await queryItems({
          FilterExpression: 'paystackReference = :ref',
          ExpressionAttributeValues: {
            ':ref': input.reference
          }
        });
        payment = payments[0];
      }

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found'
        });
      }

      // Check payment status with Paystack
      try {
        const verification = await verifyPayment(payment.paystackReference);

        if (verification.status === 'success') {
          await updateItem(
            { PK: `PAYMENT#${payment.paymentId}`, SK: 'METADATA' },
            {
              status: 'completed',
              completedAt: new Date().toISOString(),
              paidAt: verification.paid_at,
              verifiedAmount: verification.amount / 100 // Convert from kobo to ZAR
            }
          );

          return { 
            success: true, 
            status: 'completed',
            amount: verification.amount / 100
          };
        } else if (verification.status === 'failed') {
          await updateItem(
            { PK: `PAYMENT#${payment.paymentId}`, SK: 'METADATA' },
            { status: 'failed', failedAt: new Date().toISOString() }
          );

          return { success: false, status: 'failed' };
        }

        return { success: false, status: verification.status };
      } catch (error: any) {
        console.error('Payment verification error:', error.message);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify payment'
        });
      }
    }),

  // Release escrow to worker (client approves)
  releaseEscrow: clientOnlyProcedure
    .input(z.object({
      paymentId: z.string(),
      jobId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const payment = await getItem({
        PK: `PAYMENT#${input.paymentId}`,
        SK: 'METADATA'
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found'
        });
      }

      if (payment.clientId !== ctx.user!.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized'
        });
      }

      if (payment.status !== 'completed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment must be completed before release'
        });
      }

      if (payment.released) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment already released'
        });
      }

      // Calculate platform fee (10%)
      const platformFee = payment.amount * 0.10;
      const workerAmount = payment.amount - platformFee;

      await updateItem(
        { PK: `PAYMENT#${input.paymentId}`, SK: 'METADATA' },
        {
          released: true,
          releasedAt: new Date().toISOString(),
          platformFee,
          workerAmount
        }
      );

      // Update worker balance
      const worker = await getItem({
        PK: `USER#${payment.workerId}`,
        SK: 'PROFILE'
      });

      if (worker) {
        await updateItem(
          { PK: `USER#${payment.workerId}`, SK: 'PROFILE' },
          {
            balance: (worker.balance || 0) + workerAmount,
            totalEarnings: (worker.totalEarnings || 0) + workerAmount
          }
        );
      }

      return { success: true, workerAmount, platformFee };
    }),

  // Get payment history
  getPaymentHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const payments = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `USER#${ctx.user!.userId}`
        }
      });

      return payments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  // Get job payments
  getJobPayments: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const payments = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `JOB#${input.jobId}`
        }
      });

      return payments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  // Alias for getJobPayments (frontend compatibility)
  getByJobId: protectedProcedure
    .input(z.object({ jobId: z.union([z.string(), z.number()]) }))
    .query(async ({ input }) => {
      const jobIdStr = input.jobId.toString();
      const payments = await queryItems({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `JOB#${jobIdStr}`
        }
      });

      const sortedPayments = payments.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Return in format expected by frontend
      return {
        escrow: sortedPayments.length > 0 ? sortedPayments[0] : null
      };
    }),

  // Create escrow (frontend compatibility - wraps initializePayment)
  create: clientOnlyProcedure
    .input(z.object({
      jobId: z.union([z.string(), z.number()]),
      workerId: z.string(),
      totalAmount: z.number().positive()
    }))
    .mutation(async ({ ctx, input }) => {
      console.log('[Escrow] Creating escrow:', { jobId: input.jobId, totalAmount: input.totalAmount, userId: ctx.user!.userId });
      
      const jobIdStr = input.jobId.toString();
      
      // Verify job ownership
      const job = await getItem({
        PK: `JOB#${jobIdStr}`,
        SK: 'METADATA'
      });

      if (!job) {
        console.error('[Escrow] Job not found:', jobIdStr);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found'
        });
      }

      if (job.clientId !== ctx.user!.userId) {
        console.error('[Escrow] Unauthorized access:', { jobClientId: job.clientId, userId: ctx.user!.userId });
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized'
        });
      }

      // Calculate amounts with 5% buyer fee
      const buyerFee = Math.round(input.totalAmount * 0.05);
      const buyerTotal = input.totalAmount + buyerFee;
      const depositAmount = Math.round(buyerTotal * 0.3);
      const remainingAmount = buyerTotal - depositAmount;

      const escrowId = uuidv4();

      // Create escrow record
      const escrow = {
        PK: `ESCROW#${escrowId}`,
        SK: 'METADATA',
        id: escrowId,
        jobId: jobIdStr,
        clientId: ctx.user!.userId,
        workerId: input.workerId,
        totalAmount: buyerTotal,
        depositAmount,
        remainingAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        GSI1PK: `JOB#${jobIdStr}`,
        GSI1SK: new Date().toISOString()
      };

      await putItem(escrow);

      console.log('[Escrow] Created:', { escrowId, depositAmount, totalAmount: buyerTotal });

      return {
        escrow: {
          ...escrow,
          depositPaidAt: null,
          releasedAt: null
        }
      };
    }),

  // Request withdrawal (worker)
  requestWithdrawal: protectedProcedure
    .input(z.object({
      amount: z.number().positive(),
      bankAccount: z.string(),
      bankName: z.string(),
      accountHolder: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
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

      if ((user.balance || 0) < input.amount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Insufficient balance'
        });
      }

      const withdrawalId = uuidv4();

      const withdrawal = {
        PK: `WITHDRAWAL#${withdrawalId}`,
        SK: 'METADATA',
        withdrawalId,
        userId: ctx.user!.userId,
        amount: input.amount,
        bankAccount: input.bankAccount,
        bankName: input.bankName,
        accountHolder: input.accountHolder,
        status: 'pending',
        createdAt: new Date().toISOString(),
        GSI1PK: `USER#${ctx.user!.userId}`,
        GSI1SK: new Date().toISOString()
      };

      await putItem(withdrawal);

      // Deduct from balance
      await updateItem(
        { PK: `USER#${ctx.user!.userId}`, SK: 'PROFILE' },
        { balance: (user.balance || 0) - input.amount }
      );

      return { withdrawalId, success: true };
    }),

  // Paystack webhook handler
  paystackWebhook: publicProcedure
    .input(z.object({
      event: z.string(),
      data: z.any(),
      signature: z.string()
    }))
    .mutation(async ({ input }) => {
      // Verify webhook signature
      const payload = JSON.stringify(input.data);
      const isValid = verifyWebhookSignature(payload, input.signature);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid webhook signature'
        });
      }

      // Handle different webhook events
      switch (input.event) {
        case 'charge.success':
          // Payment successful - HOLD IN ESCROW
          const reference = input.data.reference;
          const metadata = input.data.metadata || {};
          const jobId = metadata.jobId;
          const buyerId = metadata.userId;
          const amount = input.data.amount / 100; // Convert kobo to ZAR

          if (!jobId || !buyerId) {
            console.error('Missing jobId or buyerId in webhook metadata');
            break;
          }

          // Find payment record
          const payments = await queryItems({
            FilterExpression: 'paystackReference = :ref',
            ExpressionAttributeValues: {
              ':ref': reference
            }
          });

          if (payments.length > 0) {
            const payment = payments[0];
            
            // Update payment to completed but NOT released
            await updateItem(
              { PK: `PAYMENT#${payment.paymentId}`, SK: 'METADATA' },
              {
                status: 'completed',
                completedAt: new Date().toISOString(),
                paidAt: input.data.paid_at,
                verifiedAmount: amount,
                escrowAmount: amount,
                released: false,
                proofNeeded: true
              }
            );

            // Update job status to in-progress
            await updateItem(
              { PK: `JOB#${jobId}`, SK: 'METADATA' },
              {
                status: 'in_progress',
                startedAt: new Date().toISOString(),
                escrowHeld: true,
                escrowAmount: amount,
                GSI2PK: 'STATUS#in_progress'
              }
            );

            // Get buyer details for SMS notification
            const buyer = await getItem({
              PK: `USER#${buyerId}`,
              SK: 'PROFILE'
            });

            if (buyer && buyer.phone) {
              // Send SMS notification to buyer
              const { sendSMSOTP } = await import('../lib/twilio.js');
              const message = `Job started! Payment of R${amount.toFixed(2)} is held securely. Once work is complete, submit photo proof to release payment to the worker. - Project Khaya`;
              
              try {
                await sendSMSOTP(buyer.phone, message);
                console.log(`SMS sent to buyer ${buyerId} for job ${jobId}`);
              } catch (error) {
                console.error('Failed to send SMS:', error);
              }
            }

            console.log(`Escrow held: R${amount} for job ${jobId}`);
          }
          break;

        case 'charge.failed':
          // Payment failed
          const failedRef = input.data.reference;
          const failedPayments = await queryItems({
            FilterExpression: 'paystackReference = :ref',
            ExpressionAttributeValues: {
              ':ref': failedRef
            }
          });

          if (failedPayments.length > 0) {
            const payment = failedPayments[0];
            await updateItem(
              { PK: `PAYMENT#${payment.paymentId}`, SK: 'METADATA' },
              {
                status: 'failed',
                failedAt: new Date().toISOString(),
                failureReason: input.data.gateway_response
              }
            );
          }
          break;

        case 'subscription.create':
        case 'subscription.disable':
          // Handle subscription events (will be used in subscriptions router)
          console.log('Subscription event:', input.event, input.data);
          break;

        default:
          console.log('Unhandled webhook event:', input.event);
      }

      return { success: true };
    })
});
