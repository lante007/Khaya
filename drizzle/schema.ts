import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["buyer", "worker", "supplier", "admin"]).default("buyer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profiles with additional information
 */
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  bio: text("bio"),
  trade: varchar("trade", { length: 100 }), // For workers: plumber, electrician, builder, etc.
  location: varchar("location", { length: 200 }).notNull(),
  photoUrl: text("photoUrl"),
  certifications: text("certifications"), // JSON array of certification URLs
  trustScore: int("trustScore").default(0).notNull(), // 0-100 score
  verified: boolean("verified").default(false).notNull(),
  availabilityStatus: mysqlEnum("availabilityStatus", ["available", "busy", "unavailable"]).default("available"),
  yearsExperience: int("yearsExperience"),
  completedJobs: int("completedJobs").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Job postings from buyers
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // plumbing, electrical, construction, etc.
  budget: int("budget").notNull(), // in cents to avoid decimal issues
  location: varchar("location", { length: 200 }).notNull(),
  buyerId: int("buyerId").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "cancelled"]).default("open").notNull(),
  selectedBidId: int("selectedBidId"),
  startDate: timestamp("startDate"),
  completionDate: timestamp("completionDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Bids from workers on jobs
 */
export const bids = mysqlTable("bids", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  workerId: int("workerId").notNull(),
  amount: int("amount").notNull(), // in cents
  timeline: int("timeline").notNull(), // days to complete
  proposal: text("proposal").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "withdrawn"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

/**
 * Material/supply listings from suppliers
 */
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // bricks, cement, tools, timber, etc.
  price: int("price").notNull(), // in cents
  unit: varchar("unit", { length: 50 }).notNull(), // per bag, per m², per piece, etc.
  stock: int("stock").notNull(),
  photoUrl: text("photoUrl"),
  supplierId: int("supplierId").notNull(),
  location: varchar("location", { length: 200 }).notNull(),
  available: boolean("available").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

/**
 * Reviews and ratings
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  reviewerId: int("reviewerId").notNull(), // User who wrote the review
  reviewedId: int("reviewedId").notNull(), // User being reviewed
  jobId: int("jobId"), // Optional: link to specific job
  type: mysqlEnum("type", ["worker", "buyer", "supplier"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Job milestones for progress tracking
 */
export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  proofUrl: text("proofUrl"), // Photo/document URL as proof
  status: mysqlEnum("status", ["pending", "submitted", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

/**
 * Messages between users
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  receiverId: int("receiverId").notNull(),
  jobId: int("jobId"), // Optional: context for job-related messages
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["bid", "job", "review", "message", "system"]).notNull(),
  read: boolean("read").default(false).notNull(),
  relatedId: int("relatedId"), // ID of related job, bid, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * User credits for referrals and rewards
 */
export const credits = mysqlTable("credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // Amount in cents (R50 = 5000)
  type: mysqlEnum("type", ["referral", "reward", "bonus", "deduction"]).notNull(),
  description: text("description"),
  relatedReferralId: int("relatedReferralId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Credit = typeof credits.$inferSelect;
export type InsertCredit = typeof credits.$inferInsert;

/**
 * Referral tracking system
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(), // User who sent the referral
  referredId: int("referredId"), // User who signed up (null until they register)
  referredEmail: varchar("referredEmail", { length: 320 }), // Email or phone of referred person
  referredPhone: varchar("referredPhone", { length: 20 }),
  status: mysqlEnum("status", ["pending", "completed", "rewarded"]).default("pending").notNull(),
  referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
  rewardAmount: int("rewardAmount").default(5000).notNull(), // R50 in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Community stories and testimonials
 */
export const stories = mysqlTable("stories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["success", "testimonial", "tip", "experience"]).default("testimonial").notNull(),
  featured: boolean("featured").default(false).notNull(),
  likes: int("likes").default(0).notNull(),
  relatedJobId: int("relatedJobId"),
  relatedWorkerId: int("relatedWorkerId"),
  mediaUrl: text("mediaUrl"), // Photo or voice note URL
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;

/**
 * Wave broadcasts — expanding geographic notification rings per job.
 * Wave 1: 5km, Wave 2: 15km, Wave 3: 30km.
 * Workers receive a notification when a wave reaches their location.
 */
export const waves = mysqlTable("waves", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  workerId: int("workerId").notNull(),
  waveNumber: int("waveNumber").notNull(), // 1, 2, or 3
  status: mysqlEnum("status", ["sent", "seen", "accepted", "declined", "expired"]).default("sent").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type Wave = typeof waves.$inferSelect;
export type InsertWave = typeof waves.$inferInsert;

/**
 * Worker skills — normalised trade + skill tags per worker.
 * Replaces the single `profiles.trade` string for multi-skill workers.
 */
export const workerSkills = mysqlTable("worker_skills", {
  id: int("id").autoincrement().primaryKey(),
  workerId: int("workerId").notNull(),
  skill: varchar("skill", { length: 100 }).notNull(),   // e.g. "Plumbing", "Tiling"
  grade: mysqlEnum("grade", ["Bronze", "Silver", "Gold", "Platinum"]).default("Bronze").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkerSkill = typeof workerSkills.$inferSelect;
export type InsertWorkerSkill = typeof workerSkills.$inferInsert;

/**
 * OTP codes — DB-backed to survive Lambda cold starts and multi-instance deployments.
 * Codes are single-use: marked used=true on first successful verification.
 * Rate limiting is enforced by counting recent rows per phone number.
 */
export const otpCodes = mysqlTable("otp_codes", {
  id: int("id").autoincrement().primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert;

/**
 * Escrow records — funds held between buyer payment and worker release.
 * Status flow: pending → funded → released | refunded | disputed
 */
export const escrows = mysqlTable("escrows", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  buyerId: int("buyerId").notNull(),
  workerId: int("workerId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platformFee", { precision: 10, scale: 2 }).notNull().default("0"),
  paystackFee: decimal("paystackFee", { precision: 10, scale: 2 }).notNull().default("0"),
  buyerTotal: decimal("buyerTotal", { precision: 10, scale: 2 }).notNull(),
  workerPayout: decimal("workerPayout", { precision: 10, scale: 2 }).notNull(),
  paystackReference: varchar("paystackReference", { length: 200 }).notNull(),
  status: mysqlEnum("status", ["pending", "deposit_paid", "held", "funded", "released", "refunded", "disputed"]).default("pending").notNull(),
  releasedAt: timestamp("releasedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Escrow = typeof escrows.$inferSelect;
export type InsertEscrow = typeof escrows.$inferInsert;

/**
 * Payment transaction log — one row per Paystack event affecting an escrow.
 */
export const paymentTransactions = mysqlTable("payment_transactions", {
  id: int("id").autoincrement().primaryKey(),
  escrowId: int("escrowId").notNull(),
  paystackReference: varchar("paystackReference", { length: 200 }).notNull(),
  paystackTransactionId: varchar("paystackTransactionId", { length: 200 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("ZAR").notNull(),
  status: mysqlEnum("status", ["pending", "success", "failed", "refunded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;
