import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerPaystackWebhook } from "../webhooks/paystack";
import { appRouter } from "../routers";
import { createContext } from "./context";

/**
 * Build and return the Express app.
 * Used by both the local dev server (index.ts) and the Lambda handler (lambda.ts).
 */
export function createApp() {
  const app = express();
  const server = createServer(app);

  // Paystack webhook must be registered BEFORE express.json() so raw body is preserved
  registerPaystackWebhook(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    });
  });

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  return { app, server };
}
