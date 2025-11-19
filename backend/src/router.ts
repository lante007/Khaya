/**
 * Main tRPC App Router
 * Combines all feature routers
 */

import { router } from './trpc.js';
import { authRouter } from './routers/auth.router.js';
import { userRouter } from './routers/user.router.js';
import { jobsRouter } from './routers/jobs.router.js';
import { bidsRouter } from './routers/bids.router.js';
import { paymentsRouter } from './routers/payments.router.js';
import { subscriptionsRouter } from './routers/subscriptions.router.js';
import { referralsRouter } from './routers/referrals.router.js';
import { messagesRouter } from './routers/messages.router.js';
import { adminRouter } from './routers/admin.router.js';
import { listingsRouter } from './routers/listings.router.js';
import { notificationsRouter } from './routers/notifications.router.js';
import { aiRouter } from './routers/ai.router.js';
import { resumeRouter } from './routers/resume.router.js';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  jobs: jobsRouter,
  job: jobsRouter, // Alias for compatibility
  bids: bidsRouter,
  bid: bidsRouter, // Alias for compatibility
  payments: paymentsRouter,
  paystack: paymentsRouter, // Alias for backwards compatibility
  escrow: paymentsRouter, // Alias for backwards compatibility
  subscriptions: subscriptionsRouter,
  referrals: referralsRouter,
  messages: messagesRouter,
  admin: adminRouter,
  listing: listingsRouter,
  notification: notificationsRouter,
  ai: aiRouter,
  resume: resumeRouter
});

export type AppRouter = typeof appRouter;
