import type { Request, Response, Express } from "express";
import express from "express";
import { verifyWebhookSignature } from "../services/paystack";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { escrows, paymentTransactions } from "../../drizzle/schema";

// ─── Event handlers ───────────────────────────────────────────────────────────

async function onChargeSuccess(data: PaystackChargeData) {
  const { reference, amount, status } = data;
  if (status !== "success") return;

  // Paystack sends amount in kobo — convert to rands
  const amountRands = (amount / 100).toFixed(2);

  const db = await getDb();
  if (!db) {
    console.warn("[paystack] charge.success: no DB connection");
    return;
  }

  const [escrow] = await db
    .select()
    .from(escrows)
    .where(eq(escrows.paystackReference, reference))
    .limit(1);

  if (!escrow) {
    console.warn(`[paystack] charge.success: no escrow for reference ${reference}`);
    return;
  }

  // Record transaction
  await db.insert(paymentTransactions).values({
    escrowId: escrow.id,
    paystackReference: reference,
    paystackTransactionId: String(data.id),
    amount: amountRands,
    currency: data.currency ?? "ZAR",
    status: "success",
  });

  // Mark escrow funded
  await db
    .update(escrows)
    .set({ status: "funded" })
    .where(eq(escrows.id, escrow.id));

  console.log(`[paystack] Escrow ${escrow.id} funded — R${amountRands} (ref: ${reference})`);
}

async function onRefundProcessed(data: PaystackRefundData) {
  const ref = data.transaction_reference;

  const db = await getDb();
  if (!db) {
    console.warn("[paystack] refund.processed: no DB connection");
    return;
  }

  const [escrow] = await db
    .select()
    .from(escrows)
    .where(eq(escrows.paystackReference, ref))
    .limit(1);

  if (!escrow) {
    console.warn(`[paystack] refund.processed: no escrow for reference ${ref}`);
    return;
  }

  await db
    .update(escrows)
    .set({ status: "refunded" })
    .where(eq(escrows.id, escrow.id));

  await db
    .update(paymentTransactions)
    .set({ status: "refunded" })
    .where(eq(paymentTransactions.paystackReference, ref));

  console.log(`[paystack] Escrow ${escrow.id} refunded (ref: ${ref})`);
}

async function onTransferSuccess(data: PaystackTransferData) {
  console.log(`[paystack] Transfer success: ${data.reference}`);
  // Future: mark escrow released, notify worker
}

async function onTransferFailed(data: PaystackTransferData) {
  console.error(`[paystack] Transfer FAILED: ${data.reference}`);
  // Future: alert admin, trigger retry
}

// ─── Webhook route handler ────────────────────────────────────────────────────

async function paystackWebhookHandler(req: Request, res: Response) {
  // Respond 200 immediately — Paystack retries on non-2xx
  res.sendStatus(200);

  const signature = req.headers["x-paystack-signature"] as string | undefined;
  const rawBody = req.body as Buffer;

  if (!signature || !verifyWebhookSignature(rawBody.toString(), signature)) {
    console.warn("[paystack] Invalid or missing webhook signature — ignoring");
    return;
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody.toString()) as PaystackEvent;
  } catch {
    console.error("[paystack] Failed to parse webhook body");
    return;
  }

  console.log(`[paystack] Event received: ${event.event}`);

  try {
    switch (event.event) {
      case "charge.success":
        await onChargeSuccess(event.data as PaystackChargeData);
        break;
      case "refund.processed":
        await onRefundProcessed(event.data as PaystackRefundData);
        break;
      case "transfer.success":
        await onTransferSuccess(event.data as PaystackTransferData);
        break;
      case "transfer.failed":
      case "transfer.reversed":
        await onTransferFailed(event.data as PaystackTransferData);
        break;
      default:
        console.log(`[paystack] Unhandled event type: ${event.event}`);
    }
  } catch (err) {
    console.error(`[paystack] Error handling event ${event.event}:`, err);
  }
}

// ─── Registration helper ──────────────────────────────────────────────────────

/**
 * Register the Paystack webhook route on the Express app.
 * Must use express.raw() so the raw body is available for HMAC verification.
 */
export function registerPaystackWebhook(app: Express) {
  app.post(
    "/api/webhooks/paystack",
    express.raw({ type: "application/json" }),
    paystackWebhookHandler
  );
  console.log("[paystack] Webhook registered at POST /api/webhooks/paystack");
}

// ─── Paystack payload types ───────────────────────────────────────────────────

interface PaystackEvent {
  event: string;
  data: unknown;
}

interface PaystackChargeData {
  id: number;
  reference: string;
  amount: number; // kobo
  currency: string;
  status: string;
  paid_at: string;
  customer: { email: string };
}

interface PaystackRefundData {
  transaction_reference: string;
  amount: number;
  currency: string;
  status: string;
}

interface PaystackTransferData {
  reference: string;
  amount: number;
  currency: string;
  status: string;
}
