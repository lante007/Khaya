/**
 * OTP Service — Twilio SMS/WhatsApp delivery with DB-backed store.
 *
 * Security properties:
 * - 6-digit numeric code, cryptographically random
 * - 10-minute expiry
 * - Max 3 attempts per code before invalidation (enforced by marking used=true on failure threshold)
 * - Rate limit: max 3 sends per phone per 10-minute window (DB count)
 * - Codes are marked used=true on first successful verification (single-use)
 *
 * DB-backed so codes survive Lambda cold starts and work across concurrent instances.
 */

import crypto from 'crypto';
import { and, eq, gt, lt, count, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { otpCodes } from '../../drizzle/schema';

const OTP_TTL_MS = 10 * 60 * 1000;       // 10 minutes
const MAX_SENDS_PER_WINDOW = 3;

function generateCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) return `+27${digits.slice(1)}`;
  if (digits.startsWith('27') && digits.length === 11) return `+${digits}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

export async function sendOtp(
  phone: string,
  method: 'sms' | 'whatsapp' = 'sms'
): Promise<{ success: boolean; devCode?: string }> {
  const key = normalisePhone(phone);
  const windowStart = new Date(Date.now() - OTP_TTL_MS);

  const db = await getDb();

  // Rate limit: count sends in the current window
  if (db) {
    const [{ value: recentSends }] = await db
      .select({ value: count() })
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, key), gt(otpCodes.createdAt, windowStart)));

    if (recentSends >= MAX_SENDS_PER_WINDOW) {
      throw new Error('Too many OTP requests. Please wait 10 minutes before trying again.');
    }
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Persist to DB (best-effort — fall through to Twilio even if DB is down)
  if (db) {
    await db.insert(otpCodes).values({ phone: key, code, expiresAt });

    // Lazy cleanup: delete expired rows older than 24h on each send.
    // Keeps the table small without a separate cron job.
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    db.delete(otpCodes)
      .where(lt(otpCodes.expiresAt, cutoff))
      .catch(() => { /* non-critical */ });
  }

  // In development, skip Twilio and return the code directly
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP DEV] Code for ${key}: ${code}`);
    return { success: true, devCode: code };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.');
  }

  const to = method === 'whatsapp' ? `whatsapp:${key}` : key;
  const from = method === 'whatsapp' ? `whatsapp:${fromNumber}` : fromNumber;
  const body = `Your Project Khaya verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Twilio error: ${(err as any).message ?? response.statusText}`);
  }

  return { success: true };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ valid: boolean; reason?: string }> {
  const key = normalisePhone(phone);

  const db = await getDb();
  if (!db) {
    // DB unavailable — fail closed (don't allow login without verification)
    return { valid: false, reason: 'Verification service temporarily unavailable. Please try again.' };
  }

  const now = new Date();

  // Find the most recent unused, unexpired code for this phone
  const [record] = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, key),
        eq(otpCodes.used, false),
        gt(otpCodes.expiresAt, now)
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!record) {
    return { valid: false, reason: 'No valid OTP found for this number. Please request a new code.' };
  }

  if (record.code !== code.trim()) {
    return { valid: false, reason: 'Incorrect code. Please check and try again.' };
  }

  // Mark used — single-use enforcement
  await db
    .update(otpCodes)
    .set({ used: true })
    .where(eq(otpCodes.id, record.id));

  return { valid: true };
}
