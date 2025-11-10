/**
 * AWS Lambda handler for tRPC
 * Adapts API Gateway events to tRPC
 */

import { awsLambdaRequestHandler } from "@trpc/server/adapters/aws-lambda";
import { appRouter } from "../server/routers";
import { APIGatewayProxyEventV2 } from "aws-lambda";

// Create context from Lambda event
function createContext({ event }: { event: APIGatewayProxyEventV2 }) {
  // Extract user from Cognito authorizer
  const user = event.requestContext.authorizer?.jwt?.claims 
    ? {
        id: event.requestContext.authorizer.jwt.claims.sub as string,
        openId: event.requestContext.authorizer.jwt.claims.sub as string,
        name: event.requestContext.authorizer.jwt.claims.name as string || null,
        email: event.requestContext.authorizer.jwt.claims.email as string || null,
        role: event.requestContext.authorizer.jwt.claims["custom:role"] as string || "buyer",
      }
    : null;

  return {
    user,
    req: {
      headers: event.headers,
      cookies: event.cookies || [],
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
}

// Export Lambda handler
export const handler = awsLambdaRequestHandler({
  router: appRouter,
  createContext,
});
