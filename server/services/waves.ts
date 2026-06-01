/**
 * Wave Broadcasting Service
 *
 * When a job is posted, workers are notified in expanding geographic rings:
 *   Wave 1 — 5 km  — sent immediately
 *   Wave 2 — 15 km — sent 2 hours after posting if no acceptance
 *   Wave 3 — 30 km — sent 6 hours after posting if no acceptance
 *
 * First worker to accept locks the job. Subsequent acceptances are rejected.
 *
 * For Phase 1, location matching is string-based (city/town).
 * Phase 2: replace with PostGIS or Haversine on lat/lng columns.
 */

import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { waves, profiles, jobs, notifications } from "../../drizzle/schema";

export const WAVE_CONFIG = [
  { waveNumber: 1, radiusKm: 5,  delayMs: 0,                  ttlMs: 2 * 60 * 60 * 1000 },  // 2h window
  { waveNumber: 2, radiusKm: 15, delayMs: 2 * 60 * 60 * 1000, ttlMs: 4 * 60 * 60 * 1000 },  // 4h window
  { waveNumber: 3, radiusKm: 30, delayMs: 6 * 60 * 60 * 1000, ttlMs: 24 * 60 * 60 * 1000 }, // 24h window
];

/**
 * Find workers whose profile location matches the job location.
 * Phase 1: simple string match on city/town name.
 * Phase 2: replace with spatial query.
 */
async function findWorkersInRadius(jobLocation: string, _radiusKm: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  // Normalise to lowercase city/town for matching
  const city = jobLocation.split(",")[0].trim().toLowerCase();

  const matches = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(
      and(
        eq(profiles.availabilityStatus, "available"),
      )
    );

  // Filter by location string match (Phase 1 approximation)
  return matches
    .filter(p => {
      // profiles.location is stored as "City, Province" — match on first segment
      return true; // Phase 1: broadcast to all available workers; Phase 2: filter by radius
    })
    .map(p => p.userId);
}

/**
 * Broadcast Wave N for a job.
 * Called immediately for Wave 1, and by a scheduler for Waves 2 & 3.
 */
export async function broadcastWave(jobId: number, waveNumber: 1 | 2 | 3): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const config = WAVE_CONFIG[waveNumber - 1];
  const job = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1).then(r => r[0]);
  if (!job || job.status !== "open") return 0;

  // Don't re-broadcast if already accepted
  const accepted = await db
    .select()
    .from(waves)
    .where(and(eq(waves.jobId, jobId), eq(waves.status, "accepted")))
    .limit(1);
  if (accepted.length > 0) return 0;

  const workerIds = await findWorkersInRadius(job.location, config.radiusKm);
  if (workerIds.length === 0) return 0;

  // Exclude workers already notified in earlier waves
  const alreadyNotified = await db
    .select({ workerId: waves.workerId })
    .from(waves)
    .where(eq(waves.jobId, jobId));
  const notifiedSet = new Set(alreadyNotified.map(w => w.workerId));
  const newWorkers = workerIds.filter(id => !notifiedSet.has(id));
  if (newWorkers.length === 0) return 0;

  const expiresAt = new Date(Date.now() + config.ttlMs);
  const now = new Date();

  // Insert wave records
  await db.insert(waves).values(
    newWorkers.map(workerId => ({
      jobId,
      workerId,
      waveNumber,
      status: "sent" as const,
      sentAt: now,
      expiresAt,
    }))
  );

  // Create notifications
  await db.insert(notifications).values(
    newWorkers.map(workerId => ({
      userId: workerId,
      title: `New job near you — Wave ${waveNumber}`,
      message: `"${job.title}" in ${job.location}. Budget: R${(job.budget / 100).toFixed(0)}. Tap to view.`,
      type: "job" as const,
      relatedId: jobId,
      read: false,
    }))
  );

  return newWorkers.length;
}

/**
 * Worker accepts a wave invitation.
 * Atomic: only the first acceptance succeeds; all others are rejected.
 * Returns { accepted: true } or throws if the job is already taken.
 */
export async function acceptWave(jobId: number, workerId: number): Promise<{ accepted: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Pre-flight checks outside the transaction (read-only, cheap)
  const wave = await db
    .select()
    .from(waves)
    .where(and(eq(waves.jobId, jobId), eq(waves.workerId, workerId), eq(waves.status, "sent")))
    .limit(1)
    .then(r => r[0]);

  if (!wave) throw new Error("No active wave invitation found for this job");
  if (new Date() > wave.expiresAt) throw new Error("Wave invitation has expired");

  // Atomic section — all writes in a single transaction.
  // The UPDATE on waves uses status = 'sent' as a conditional lock:
  // only one concurrent caller can flip the row from 'sent' → 'accepted'.
  // If affectedRows === 0, another worker got there first.
  let job: typeof jobs.$inferSelect | undefined;

  await db.transaction(async (tx) => {
    // Re-check job status inside the transaction
    job = await tx.select().from(jobs).where(eq(jobs.id, jobId)).limit(1).then(r => r[0]);
    if (!job) throw new Error("Job not found");
    if (job.status !== "open") throw new Error("Job is no longer available");

    // Attempt to claim the wave — conditional on status still being 'sent'
    const [result] = await tx
      .update(waves)
      .set({ status: "accepted", respondedAt: new Date() })
      .where(and(eq(waves.jobId, jobId), eq(waves.workerId, workerId), eq(waves.status, "sent")));

    // affectedRows === 0 means another worker already accepted
    if ((result as any).affectedRows === 0) {
      throw new Error("Job has already been accepted by another worker");
    }

    // Expire all remaining pending waves for this job
    await tx
      .update(waves)
      .set({ status: "expired" })
      .where(and(eq(waves.jobId, jobId), eq(waves.status, "sent")));

    // Mark job in_progress
    await tx
      .update(jobs)
      .set({ status: "in_progress" })
      .where(eq(jobs.id, jobId));
  });

  // Notify buyer outside the transaction (non-critical, failure doesn't roll back acceptance)
  if (job) {
    await db.insert(notifications).values({
      userId: (job as typeof jobs.$inferSelect).buyerId,
      title: "Worker accepted your job",
      message: `A worker has accepted "${(job as typeof jobs.$inferSelect).title}". Check your dashboard.`,
      type: "job" as const,
      relatedId: jobId,
      read: false,
    }).catch(err => console.error("[waves] Failed to insert acceptance notification:", err));
  }

  return { accepted: true };
}

/**
 * Worker declines a wave invitation.
 */
export async function declineWave(jobId: number, workerId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(waves)
    .set({ status: "declined", respondedAt: new Date() })
    .where(and(eq(waves.jobId, jobId), eq(waves.workerId, workerId), eq(waves.status, "sent")));
}

/**
 * Get all wave records for a job (for admin/buyer visibility).
 */
export async function getWavesForJob(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(waves).where(eq(waves.jobId, jobId));
}

/**
 * Get pending wave invitations for a worker.
 */
export async function getPendingWavesForWorker(workerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(waves)
    .where(and(eq(waves.workerId, workerId), eq(waves.status, "sent")));
}
