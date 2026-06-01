/**
 * Worker Grading Service
 *
 * Grade thresholds (from SysSpec):
 *   Bronze   — default on signup
 *   Silver   — 5+ completed jobs AND avg rating ≥ 4.0
 *   Gold     — 15+ completed jobs AND avg rating ≥ 4.5 AND ≥1 verified skill
 *   Platinum — 30+ completed jobs AND avg rating ≥ 4.8 AND ≥2 verified skills
 *
 * Grade affects:
 *   - Search ranking (higher grade = higher position)
 *   - Wave priority (Gold/Platinum get Wave 1 invitations first)
 *   - Materials discount (Silver 5%, Gold 10%, Platinum 15%)
 *   - Trust badge displayed on profile
 */

import { eq, and, count, avg } from "drizzle-orm";
import { getDb } from "../db";
import { workerSkills, reviews, jobs, bids, profiles } from "../../drizzle/schema";

export type Grade = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface GradeResult {
  grade: Grade;
  completedJobs: number;
  avgRating: number;
  verifiedSkills: number;
  score: number; // 0–100 composite score
  nextGrade: Grade | null;
  nextGradeRequirements: string[];
}

const GRADE_THRESHOLDS: Record<Grade, { jobs: number; rating: number; verifiedSkills: number }> = {
  Bronze:   { jobs: 0,  rating: 0,   verifiedSkills: 0 },
  Silver:   { jobs: 5,  rating: 4.0, verifiedSkills: 0 },
  Gold:     { jobs: 15, rating: 4.5, verifiedSkills: 1 },
  Platinum: { jobs: 30, rating: 4.8, verifiedSkills: 2 },
};

const GRADE_ORDER: Grade[] = ["Bronze", "Silver", "Gold", "Platinum"];

export const MATERIALS_DISCOUNT: Record<Grade, number> = {
  Bronze:   0,
  Silver:   0.05,
  Gold:     0.10,
  Platinum: 0.15,
};

/**
 * Calculate a worker's current grade from their DB records.
 */
export async function calculateGrade(workerId: number): Promise<GradeResult> {
  const db = await getDb();
  if (!db) {
    return { grade: "Bronze", completedJobs: 0, avgRating: 0, verifiedSkills: 0, score: 0, nextGrade: "Silver", nextGradeRequirements: [] };
  }

  // Count completed jobs where this worker was selected
  const completedJobsResult = await db
    .select({ count: count() })
    .from(bids)
    .where(and(eq(bids.workerId, workerId), eq(bids.status, "accepted")));
  const completedJobs = completedJobsResult[0]?.count ?? 0;

  // Average rating from reviews
  const ratingResult = await db
    .select({ avg: avg(reviews.rating) })
    .from(reviews)
    .where(eq(reviews.reviewedId, workerId));
  const avgRating = parseFloat(ratingResult[0]?.avg ?? "0") || 0;

  // Count verified skills
  const verifiedSkillsResult = await db
    .select({ count: count() })
    .from(workerSkills)
    .where(and(eq(workerSkills.workerId, workerId)));
  const verifiedSkills = verifiedSkillsResult[0]?.count ?? 0;

  // Determine grade
  let grade: Grade = "Bronze";
  for (const g of GRADE_ORDER) {
    const t = GRADE_THRESHOLDS[g];
    if (completedJobs >= t.jobs && avgRating >= t.rating && verifiedSkills >= t.verifiedSkills) {
      grade = g;
    }
  }

  // Composite score (0–100)
  const score = Math.min(100, Math.round(
    (Math.min(completedJobs, 30) / 30) * 40 +   // 40% weight on jobs
    (avgRating / 5) * 40 +                        // 40% weight on rating
    (Math.min(verifiedSkills, 5) / 5) * 20        // 20% weight on skills
  ));

  // Next grade requirements
  const gradeIdx = GRADE_ORDER.indexOf(grade);
  const nextGrade = gradeIdx < GRADE_ORDER.length - 1 ? GRADE_ORDER[gradeIdx + 1] : null;
  const nextGradeRequirements: string[] = [];
  if (nextGrade) {
    const t = GRADE_THRESHOLDS[nextGrade];
    if (completedJobs < t.jobs) nextGradeRequirements.push(`${t.jobs - completedJobs} more completed jobs`);
    if (avgRating < t.rating) nextGradeRequirements.push(`Raise rating to ${t.rating} (currently ${avgRating.toFixed(1)})`);
    if (verifiedSkills < t.verifiedSkills) nextGradeRequirements.push(`${t.verifiedSkills - verifiedSkills} more verified skill${t.verifiedSkills - verifiedSkills > 1 ? 's' : ''}`);
  }

  return { grade, completedJobs, avgRating, verifiedSkills, score, nextGrade, nextGradeRequirements };
}

/**
 * Recalculate and persist a worker's grade to their profile.
 * Call after: job completion, review submission, skill verification.
 */
export async function updateWorkerGrade(workerId: number): Promise<GradeResult> {
  const result = await calculateGrade(workerId);
  const db = await getDb();
  if (db) {
    await db
      .update(profiles)
      .set({ trustScore: result.score })
      .where(eq(profiles.userId, workerId));
  }
  return result;
}

/**
 * Add or update a skill for a worker.
 */
export async function upsertWorkerSkill(
  workerId: number,
  skill: string,
  grade: Grade = "Bronze",
  verified = false
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(workerSkills)
    .values({
      workerId,
      skill,
      grade,
      verifiedAt: verified ? new Date() : null,
    })
    .onDuplicateKeyUpdate({
      set: { grade, verifiedAt: verified ? new Date() : undefined },
    });
}

/**
 * Get all skills for a worker.
 */
export async function getWorkerSkills(workerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workerSkills).where(eq(workerSkills.workerId, workerId));
}
