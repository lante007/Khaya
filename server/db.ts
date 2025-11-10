import { eq, and, desc, asc, sql, or, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, profiles, InsertProfile, jobs, InsertJob, 
  bids, InsertBid, listings, InsertListing, reviews, InsertReview,
  milestones, InsertMilestone, messages, InsertMessage,
  notifications, InsertNotification, credits, InsertCredit,
  referrals, InsertReferral, stories, InsertStory
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== User Management =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== Profile Management =====

export async function upsertProfile(profile: InsertProfile) {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(profiles).where(eq(profiles.userId, profile.userId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(profiles).set(profile).where(eq(profiles.userId, profile.userId));
    return (await db.select().from(profiles).where(eq(profiles.userId, profile.userId)).limit(1))[0];
  } else {
    await db.insert(profiles).values(profile);
    return (await db.select().from(profiles).where(eq(profiles.userId, profile.userId)).limit(1))[0];
  }
}

export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getWorkerProfiles(location?: string, trade?: string) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select({
    profile: profiles,
    user: users
  }).from(profiles)
    .leftJoin(users, eq(profiles.userId, users.id))
    .where(eq(users.role, 'worker'));

  const results = await query.orderBy(desc(profiles.trustScore));
  
  // Filter in memory for optional params
  let filtered = results;
  if (location) {
    filtered = filtered.filter(r => r.profile.location.toLowerCase().includes(location.toLowerCase()));
  }
  if (trade) {
    filtered = filtered.filter(r => r.profile.trade?.toLowerCase().includes(trade.toLowerCase()));
  }
  
  return filtered;
}

// ===== Job Management =====

export async function createJob(job: InsertJob) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(jobs).values(job);
  const result = await db.select().from(jobs).where(eq(jobs.buyerId, job.buyerId)).orderBy(desc(jobs.createdAt)).limit(1);
  return result[0];
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getOpenJobs(category?: string, location?: string) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select().from(jobs).where(eq(jobs.status, 'open')).orderBy(desc(jobs.createdAt));
  
  let filtered = results;
  if (category) {
    filtered = filtered.filter(j => j.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (location) {
    filtered = filtered.filter(j => j.location.toLowerCase().includes(location.toLowerCase()));
  }
  
  return filtered;
}

export async function getJobsByBuyer(buyerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(jobs).where(eq(jobs.buyerId, buyerId)).orderBy(desc(jobs.createdAt));
}

export async function updateJobStatus(jobId: number, status: 'open' | 'in_progress' | 'completed' | 'cancelled') {
  const db = await getDb();
  if (!db) return null;

  await db.update(jobs).set({ status }).where(eq(jobs.id, jobId));
  return await getJobById(jobId);
}

// ===== Bid Management =====

export async function createBid(bid: InsertBid) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(bids).values(bid);
  const result = await db.select().from(bids)
    .where(and(eq(bids.jobId, bid.jobId), eq(bids.workerId, bid.workerId)))
    .orderBy(desc(bids.createdAt)).limit(1);
  return result[0];
}

export async function getBidsByJob(jobId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    bid: bids,
    worker: users,
    profile: profiles
  }).from(bids)
    .leftJoin(users, eq(bids.workerId, users.id))
    .leftJoin(profiles, eq(bids.workerId, profiles.userId))
    .where(eq(bids.jobId, jobId))
    .orderBy(asc(bids.amount));
}

export async function getBidsByWorker(workerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    bid: bids,
    job: jobs
  }).from(bids)
    .leftJoin(jobs, eq(bids.jobId, jobs.id))
    .where(eq(bids.workerId, workerId))
    .orderBy(desc(bids.createdAt));
}

export async function acceptBid(bidId: number, jobId: number) {
  const db = await getDb();
  if (!db) return null;

  // Accept the bid
  await db.update(bids).set({ status: 'accepted' }).where(eq(bids.id, bidId));
  
  // Reject other bids
  await db.update(bids).set({ status: 'rejected' })
    .where(and(eq(bids.jobId, jobId), sql`${bids.id} != ${bidId}`));
  
  // Update job status
  await db.update(jobs).set({ status: 'in_progress', selectedBidId: bidId }).where(eq(jobs.id, jobId));
  
  return await db.select().from(bids).where(eq(bids.id, bidId)).limit(1).then(r => r[0]);
}

// ===== Listing Management =====

export async function createListing(listing: InsertListing) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(listings).values(listing);
  const result = await db.select().from(listings)
    .where(eq(listings.supplierId, listing.supplierId))
    .orderBy(desc(listings.createdAt)).limit(1);
  return result[0];
}

export async function getListingById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAvailableListings(category?: string, location?: string) {
  const db = await getDb();
  if (!db) return [];

  const results = await db.select({
    listing: listings,
    supplier: users
  }).from(listings)
    .leftJoin(users, eq(listings.supplierId, users.id))
    .where(eq(listings.available, true))
    .orderBy(desc(listings.createdAt));
  
  let filtered = results;
  if (category) {
    filtered = filtered.filter(l => l.listing.category.toLowerCase().includes(category.toLowerCase()));
  }
  if (location) {
    filtered = filtered.filter(l => l.listing.location.toLowerCase().includes(location.toLowerCase()));
  }
  
  return filtered;
}

export async function getListingsBySupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(listings).where(eq(listings.supplierId, supplierId)).orderBy(desc(listings.createdAt));
}

// ===== Review Management =====

export async function createReview(review: InsertReview) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(reviews).values(review);
  
  // Update trust score
  await updateTrustScore(review.reviewedId);
  
  const result = await db.select().from(reviews)
    .where(eq(reviews.reviewerId, review.reviewerId))
    .orderBy(desc(reviews.createdAt)).limit(1);
  return result[0];
}

export async function getReviewsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    review: reviews,
    reviewer: users
  }).from(reviews)
    .leftJoin(users, eq(reviews.reviewerId, users.id))
    .where(eq(reviews.reviewedId, userId))
    .orderBy(desc(reviews.createdAt));
}

async function updateTrustScore(userId: number) {
  const db = await getDb();
  if (!db) return;

  const userReviews = await db.select().from(reviews).where(eq(reviews.reviewedId, userId));
  
  if (userReviews.length === 0) return;
  
  const avgRating = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
  const trustScore = Math.round((avgRating / 5) * 100);
  
  await db.update(profiles).set({ trustScore }).where(eq(profiles.userId, userId));
}

// ===== Milestone Management =====

export async function createMilestone(milestone: InsertMilestone) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(milestones).values(milestone);
  const result = await db.select().from(milestones)
    .where(eq(milestones.jobId, milestone.jobId))
    .orderBy(desc(milestones.createdAt)).limit(1);
  return result[0];
}

export async function getMilestonesByJob(jobId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(milestones).where(eq(milestones.jobId, jobId)).orderBy(asc(milestones.createdAt));
}

// ===== Messaging =====

export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(messages).values(message);
  const result = await db.select().from(messages)
    .where(eq(messages.senderId, message.senderId))
    .orderBy(desc(messages.createdAt)).limit(1);
  return result[0];
}

export async function getConversation(user1Id: number, user2Id: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(messages)
    .where(
      or(
        and(eq(messages.senderId, user1Id), eq(messages.receiverId, user2Id)),
        and(eq(messages.senderId, user2Id), eq(messages.receiverId, user1Id))
      )
    )
    .orderBy(asc(messages.createdAt));
}

// ===== Notifications =====

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return null;

  await db.insert(notifications).values(notification);
  const result = await db.select().from(notifications)
    .where(eq(notifications.userId, notification.userId))
    .orderBy(desc(notifications.createdAt)).limit(1);
  return result[0];
}

export async function getNotificationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return null;

  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
  return await db.select().from(notifications).where(eq(notifications.id, notificationId)).limit(1).then(r => r[0]);
}


// ===== Credits & Referrals =====

export async function getUserCredits(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(credits).where(eq(credits.userId, userId)).orderBy(desc(credits.createdAt));
}

export async function getUserCreditBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ total: sql<number>`SUM(${credits.amount})` })
    .from(credits)
    .where(eq(credits.userId, userId));
  return result[0]?.total || 0;
}

export async function addCredit(credit: InsertCredit) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(credits).values(credit);
  return result;
}

export async function createReferral(referral: InsertReferral) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(referrals).values(referral);
  return result;
}

export async function getReferralByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(referrals).where(eq(referrals.referralCode, code)).limit(1);
  return result[0];
}

export async function getUserReferrals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(referrals).where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt));
}

export async function updateReferralStatus(id: number, status: "pending" | "completed" | "rewarded", referredId?: number) {
  const db = await getDb();
  if (!db) return null;
  const updateData: any = { status };
  if (status === "completed" && referredId) {
    updateData.referredId = referredId;
    updateData.completedAt = new Date();
  }
  return await db.update(referrals).set(updateData).where(eq(referrals.id, id));
}

// ===== Community Stories =====

export async function createStory(story: InsertStory) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(stories).values(story);
  return result;
}

export async function getApprovedStories(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stories)
    .where(eq(stories.approved, true))
    .orderBy(desc(stories.createdAt))
    .limit(limit);
}

export async function getFeaturedStories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stories)
    .where(and(eq(stories.approved, true), eq(stories.featured, true)))
    .orderBy(desc(stories.createdAt))
    .limit(6);
}

export async function getUserStories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stories)
    .where(eq(stories.userId, userId))
    .orderBy(desc(stories.createdAt));
}

export async function approveStory(id: number, approved: boolean = true) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(stories).set({ approved }).where(eq(stories.id, id));
}

export async function toggleStoryFeatured(id: number, featured: boolean) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(stories).set({ featured }).where(eq(stories.id, id));
}

export async function likeStory(id: number) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(stories).set({ likes: sql`${stories.likes} + 1` }).where(eq(stories.id, id));
}
