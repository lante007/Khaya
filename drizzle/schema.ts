import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  phone: varchar("phone", { length: 20 }),
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
