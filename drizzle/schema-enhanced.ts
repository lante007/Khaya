import { mysqlTable, int, varchar, decimal, timestamp, json, boolean, text } from "drizzle-orm/mysql-core";

// Enhanced Milestones for Project Pulse
export const milestonesEnhanced = mysqlTable("milestones_enhanced", {
  id: int("id").primaryKey().autoincrement(),
  jobId: int("job_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  proofPhotoUrl: varchar("proof_photo_url", { length: 500 }),
  gpsCoordinates: varchar("gps_coordinates", { length: 100 }),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  autoReleaseAt: timestamp("auto_release_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Trust Graph System
export const trustScores = mysqlTable("trust_scores", {
  userId: int("user_id").primaryKey(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull().default("0"),
  vouchesReceived: int("vouches_received").notNull().default(0),
  vouchesGiven: int("vouches_given").notNull().default(0),
  badges: json("badges").$type<string[]>(),
  scoutVerified: boolean("scout_verified").default(false),
  lastCalculated: timestamp("last_calculated").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Material Bundles for Material Run
export const materialBundles = mysqlTable("material_bundles", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  items: json("items").$type<Array<{materialId: number, quantity: number}>>(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  deliveryRoute: json("delivery_route").$type<{stops: string[], distance: number}>(),
  savings: decimal("savings", { precision: 10, scale: 2 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Price Alerts for Price Watch
export const priceAlerts = mysqlTable("price_alerts", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  materialId: int("material_id").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }).notNull(),
  active: boolean("active").default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow()
});

// Enhanced Referrals for Referral Vortex
export const referralsEnhanced = mysqlTable("referrals_enhanced", {
  id: int("id").primaryKey().autoincrement(),
  referrerId: int("referrer_id").notNull(),
  refereeId: int("referee_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).notNull(),
  tier: varchar("tier", { length: 50 }).default("bronze"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// AI Predictions Log
export const aiPredictions = mysqlTable("ai_predictions", {
  id: int("id").primaryKey().autoincrement(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: int("entity_id").notNull(),
  predictionType: varchar("prediction_type", { length: 100 }).notNull(),
  prediction: json("prediction"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Behavioral Nudges Log
export const nudgesLog = mysqlTable("nudges_log", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  nudgeType: varchar("nudge_type", { length: 100 }).notNull(),
  message: text("message").notNull(),
  shown: boolean("shown").default(false),
  clicked: boolean("clicked").default(false),
  dismissed: boolean("dismissed").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Vouches for Trust Graph
export const vouches = mysqlTable("vouches", {
  id: int("id").primaryKey().autoincrement(),
  voucherId: int("voucher_id").notNull(),
  voucheeId: int("vouchee_id").notNull(),
  message: text("message"),
  weight: decimal("weight", { precision: 3, scale: 2 }).default("1.0"),
  createdAt: timestamp("created_at").defaultNow()
});

export type MilestoneEnhanced = typeof milestonesEnhanced.$inferSelect;
export type InsertMilestoneEnhanced = typeof milestonesEnhanced.$inferInsert;
export type TrustScore = typeof trustScores.$inferSelect;
export type MaterialBundle = typeof materialBundles.$inferSelect;
export type PriceAlert = typeof priceAlerts.$inferSelect;
export type ReferralEnhanced = typeof referralsEnhanced.$inferSelect;
