import "dotenv/config";
import serverlessExpress from "@vendia/serverless-express";
import { createApp } from "./app";

const { app } = createApp();

// Cached handler — reused across warm Lambda invocations
export const handler = serverlessExpress({ app });
