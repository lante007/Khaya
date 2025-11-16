/**
 * tRPC Lambda Handler
 * AWS Lambda adapter for tRPC
 */

import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';
import { appRouter } from './router.js';
import { createContext } from './trpc.js';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const trpcHandler = awsLambdaRequestHandler({
  router: appRouter,
  createContext,
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Determine allowed origin
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const allowedOrigins = [
    'https://projectkhaya.co.za',
    'https://www.projectkhaya.co.za',
    'http://localhost:5173', // For local development
  ];
  const allowOrigin = allowedOrigins.includes(origin) ? origin : 'https://projectkhaya.co.za';

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    };
  }

  // Call tRPC handler
  const response = await trpcHandler(event, {} as any);

  // Add CORS headers to response
  return {
    statusCode: response.statusCode || 200,
    headers: {
      ...(response.headers || {}),
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Credentials': 'true',
    },
    body: response.body || '',
  };
};
