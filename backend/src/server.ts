/**
 * tRPC Lambda Handler
 * AWS Lambda adapter for tRPC
 */

import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { appRouter } from './router.js';
import { createContext } from './trpc.js';

export const handler = awsLambdaRequestHandler({
  router: appRouter,
  createContext,
});
