/**
 * Main tRPC App Router
 * Combines all feature routers
 */

import { router } from './trpc.js';
import { userRouter } from './routers/user.router.js';
import { jobsRouter } from './routers/jobs.router.js';
import { bidsRouter } from './routers/bids.router.js';
import { paymentsRouter } from './routers/payments.router.js';
import { subscriptionsRouter } from './routers/subscriptions.router.js';
import { referralsRouter } from './routers/referrals.router.js';
import { messagesRouter } from './routers/messages.router.js';
import { adminRouter } from './routers/admin.router.js';

export const appRouter = router({
  user: userRouter,
  jobs: jobsRouter,
  bids: bidsRouter,
  payments: paymentsRouter,
  subscriptions: subscriptionsRouter,
  referrals: referralsRouter,
  messages: messagesRouter,
  admin: adminRouter
});

export type AppRouter = typeof appRouter;
