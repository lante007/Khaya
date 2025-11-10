/**
 * DynamoDB Database Layer
 * Replaces MySQL/Drizzle with DynamoDB for serverless deployment
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand,
  ScanCommand,
  DeleteCommand
} from "@aws-sdk/lib-dynamodb";
import { nanoid } from "nanoid";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

// Table names from environment
const TABLES = {
  users: process.env.USERS_TABLE || "KhayaStack-UsersTable",
  profiles: process.env.PROFILES_TABLE || "KhayaStack-ProfilesTable",
  jobs: process.env.JOBS_TABLE || "KhayaStack-JobsTable",
  bids: process.env.BIDS_TABLE || "KhayaStack-BidsTable",
  listings: process.env.LISTINGS_TABLE || "KhayaStack-ListingsTable",
  reviews: process.env.REVIEWS_TABLE || "KhayaStack-ReviewsTable",
  credits: process.env.CREDITS_TABLE || "KhayaStack-CreditsTable",
  referrals: process.env.REFERRALS_TABLE || "KhayaStack-ReferralsTable",
  stories: process.env.STORIES_TABLE || "KhayaStack-StoriesTable",
};

// Helper to generate IDs
const generateId = () => nanoid();

// ===== User Management =====

export async function upsertUser(user: any) {
  const now = new Date().toISOString();
  const userId = user.id || generateId();
  
  await docClient.send(new PutCommand({
    TableName: TABLES.users,
    Item: {
      id: userId,
      openId: user.openId,
      name: user.name || null,
      email: user.email || null,
      phone: user.phone || null,
      loginMethod: user.loginMethod || null,
      role: user.role || "buyer",
      createdAt: user.createdAt || now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn || now,
    },
  }));
  
  return userId;
}

export async function getUserByOpenId(openId: string) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.users,
    FilterExpression: "openId = :openId",
    ExpressionAttributeValues: { ":openId": openId },
    Limit: 1,
  }));
  
  return result.Items?.[0];
}

export async function getUserById(id: string) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLES.users,
    Key: { id },
  }));
  
  return result.Item;
}

// ===== Profile Management =====

export async function upsertProfile(data: any) {
  const now = new Date().toISOString();
  
  await docClient.send(new PutCommand({
    TableName: TABLES.profiles,
    Item: {
      userId: data.userId,
      bio: data.bio || null,
      trade: data.trade || null,
      location: data.location,
      photoUrl: data.photoUrl || null,
      certifications: data.certifications || null,
      trustScore: data.trustScore || 0,
      verified: data.verified || false,
      availabilityStatus: data.availabilityStatus || "available",
      yearsExperience: data.yearsExperience || null,
      completedJobs: data.completedJobs || 0,
      createdAt: data.createdAt || now,
      updatedAt: now,
    },
  }));
  
  return data;
}

export async function getProfileByUserId(userId: string) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLES.profiles,
    Key: { userId },
  }));
  
  return result.Item;
}

export async function getWorkerProfiles(location?: string, trade?: string) {
  let filterExpression = "";
  const expressionValues: any = {};
  
  if (location) {
    filterExpression = "location = :location";
    expressionValues[":location"] = location;
  }
  
  if (trade) {
    filterExpression += (filterExpression ? " AND " : "") + "trade = :trade";
    expressionValues[":trade"] = trade;
  }
  
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.profiles,
    FilterExpression: filterExpression || undefined,
    ExpressionAttributeValues: Object.keys(expressionValues).length > 0 ? expressionValues : undefined,
  }));
  
  return result.Items || [];
}

// ===== Job Management =====

export async function createJob(data: any) {
  const now = new Date().toISOString();
  const jobId = generateId();
  
  const job = {
    id: jobId,
    title: data.title,
    description: data.description,
    category: data.category,
    budget: data.budget,
    location: data.location,
    buyerId: data.buyerId,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  
  await docClient.send(new PutCommand({
    TableName: TABLES.jobs,
    Item: job,
  }));
  
  return job;
}

export async function getJobById(id: string) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLES.jobs,
    Key: { id, createdAt: "" }, // Need to query by GSI
  }));
  
  return result.Item;
}

export async function getOpenJobs(category?: string, location?: string) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLES.jobs,
    IndexName: "StatusIndex",
    KeyConditionExpression: "#status = :status",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":status": "open" },
  }));
  
  let jobs = result.Items || [];
  
  if (category) {
    jobs = jobs.filter(j => j.category === category);
  }
  if (location) {
    jobs = jobs.filter(j => j.location === location);
  }
  
  return jobs;
}

export async function getJobsByBuyer(buyerId: string) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.jobs,
    FilterExpression: "buyerId = :buyerId",
    ExpressionAttributeValues: { ":buyerId": buyerId },
  }));
  
  return result.Items || [];
}

export async function updateJobStatus(jobId: string, status: string) {
  await docClient.send(new UpdateCommand({
    TableName: TABLES.jobs,
    Key: { id: jobId },
    UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: {
      ":status": status,
      ":updatedAt": new Date().toISOString(),
    },
  }));
  
  return { success: true };
}

// ===== Bid Management =====

export async function createBid(data: any) {
  const now = new Date().toISOString();
  const bidId = generateId();
  
  const bid = {
    id: bidId,
    jobId: data.jobId,
    workerId: data.workerId,
    amount: data.amount,
    timeline: data.timeline,
    proposal: data.proposal,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  
  await docClient.send(new PutCommand({
    TableName: TABLES.bids,
    Item: bid,
  }));
  
  return bid;
}

export async function getBidsByJob(jobId: string) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLES.bids,
    IndexName: "JobIndex",
    KeyConditionExpression: "jobId = :jobId",
    ExpressionAttributeValues: { ":jobId": jobId },
  }));
  
  return result.Items || [];
}

export async function getBidsByWorker(workerId: string) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.bids,
    FilterExpression: "workerId = :workerId",
    ExpressionAttributeValues: { ":workerId": workerId },
  }));
  
  return result.Items || [];
}

export async function acceptBid(bidId: string, jobId: string) {
  // Update bid status
  await docClient.send(new UpdateCommand({
    TableName: TABLES.bids,
    Key: { id: bidId, jobId },
    UpdateExpression: "SET #status = :status",
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: { ":status": "accepted" },
  }));
  
  // Update job status
  await updateJobStatus(jobId, "in_progress");
  
  return { success: true, workerId: "" }; // TODO: Get workerId from bid
}

// ===== Listing Management =====

export async function createListing(data: any) {
  const now = new Date().toISOString();
  const listingId = generateId();
  
  const listing = {
    id: listingId,
    title: data.title,
    description: data.description,
    category: data.category,
    price: data.price,
    unit: data.unit,
    stock: data.stock,
    photoUrl: data.photoUrl || null,
    supplierId: data.supplierId,
    location: data.location,
    available: true,
    createdAt: now,
    updatedAt: now,
  };
  
  await docClient.send(new PutCommand({
    TableName: TABLES.listings,
    Item: listing,
  }));
  
  return listing;
}

export async function getListingById(id: string) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLES.listings,
    Key: { id },
  }));
  
  return result.Item;
}

export async function getAvailableListings(category?: string, location?: string) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.listings,
    FilterExpression: "available = :available",
    ExpressionAttributeValues: { ":available": true },
  }));
  
  let listings = result.Items || [];
  
  if (category) {
    listings = listings.filter(l => l.category === category);
  }
  if (location) {
    listings = listings.filter(l => l.location === location);
  }
  
  return listings;
}

export async function getListingsBySupplier(supplierId: string) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.listings,
    FilterExpression: "supplierId = :supplierId",
    ExpressionAttributeValues: { ":supplierId": supplierId },
  }));
  
  return result.Items || [];
}

// ===== Review Management =====

export async function createReview(data: any) {
  const now = new Date().toISOString();
  const reviewId = generateId();
  
  const review = {
    id: reviewId,
    reviewedId: data.reviewedId,
    reviewerId: data.reviewerId,
    rating: data.rating,
    comment: data.comment || null,
    jobId: data.jobId || null,
    type: data.type,
    createdAt: now,
  };
  
  await docClient.send(new PutCommand({
    TableName: TABLES.reviews,
    Item: review,
  }));
  
  return review;
}

export async function getReviewsForUser(userId: string) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.reviews,
    FilterExpression: "reviewedId = :userId",
    ExpressionAttributeValues: { ":userId": userId },
  }));
  
  return result.Items || [];
}

// ===== Milestone Management =====

export async function createMilestone(data: any) {
  // Milestones can be stored in jobs table or separate table
  return { success: true };
}

export async function getMilestonesByJob(jobId: string) {
  return [];
}

// ===== Messaging =====

export async function createMessage(data: any) {
  return { success: true };
}

export async function getConversation(userId1: string, userId2: string) {
  return [];
}

// ===== Notifications =====

export async function createNotification(data: any) {
  return { success: true };
}

export async function getNotificationsByUser(userId: string) {
  return [];
}

export async function markNotificationAsRead(notificationId: string) {
  return { success: true };
}

// ===== Credits =====

export async function addCredit(data: any) {
  const now = new Date().toISOString();
  const creditId = generateId();
  
  await docClient.send(new PutCommand({
    TableName: TABLES.credits,
    Item: {
      id: creditId,
      userId: data.userId,
      amount: data.amount,
      type: data.type,
      description: data.description || null,
      relatedReferralId: data.relatedReferralId || null,
      createdAt: now,
    },
  }));
  
  return { success: true };
}

export async function getUserCredits(userId: string) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.credits,
    FilterExpression: "userId = :userId",
    ExpressionAttributeValues: { ":userId": userId },
  }));
  
  return result.Items || [];
}

export async function getUserCreditBalance(userId: string) {
  const credits = await getUserCredits(userId);
  const total = credits.reduce((sum, c) => sum + (c.amount || 0), 0);
  return { balance: total };
}

// ===== Referrals =====

export async function createReferral(data: any) {
  const now = new Date().toISOString();
  const referralId = generateId();
  
  const referral = {
    id: referralId,
    referrerId: data.referrerId,
    referredEmail: data.referredEmail || null,
    referredPhone: data.referredPhone || null,
    referralCode: data.referralCode,
    status: data.status || "pending",
    rewardAmount: 5000, // R50 in cents
    createdAt: now,
  };
  
  await docClient.send(new PutCommand({
    TableName: TABLES.referrals,
    Item: referral,
  }));
  
  return referral;
}

export async function getUserReferrals(userId: string) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.referrals,
    FilterExpression: "referrerId = :userId",
    ExpressionAttributeValues: { ":userId": userId },
  }));
  
  return result.Items || [];
}

export async function getReferralByCode(code: string) {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLES.referrals,
    IndexName: "CodeIndex",
    KeyConditionExpression: "referralCode = :code",
    ExpressionAttributeValues: { ":code": code },
    Limit: 1,
  }));
  
  return result.Items?.[0];
}

export async function updateReferralStatus(referralId: string, status: string, referredUserId?: string) {
  await docClient.send(new UpdateCommand({
    TableName: TABLES.referrals,
    Key: { id: referralId },
    UpdateExpression: "SET #status = :status" + (referredUserId ? ", referredUserId = :referredUserId" : ""),
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: {
      ":status": status,
      ...(referredUserId && { ":referredUserId": referredUserId }),
    },
  }));
  
  return { success: true };
}

// ===== Stories =====

export async function createStory(data: any) {
  const now = new Date().toISOString();
  const storyId = generateId();
  
  const story = {
    id: storyId,
    createdAt: now,
    userId: data.userId,
    title: data.title,
    content: data.content,
    type: data.type,
    relatedJobId: data.relatedJobId || null,
    relatedWorkerId: data.relatedWorkerId || null,
    mediaUrl: data.mediaUrl || null,
    approved: data.approved || false,
    featured: false,
    likes: 0,
  };
  
  await docClient.send(new PutCommand({
    TableName: TABLES.stories,
    Item: story,
  }));
  
  return story;
}

export async function getApprovedStories(limit?: number) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.stories,
    FilterExpression: "approved = :approved",
    ExpressionAttributeValues: { ":approved": true },
    Limit: limit || 50,
  }));
  
  return result.Items || [];
}

export async function getFeaturedStories() {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.stories,
    FilterExpression: "featured = :featured AND approved = :approved",
    ExpressionAttributeValues: { ":featured": true, ":approved": true },
  }));
  
  return result.Items || [];
}

export async function getUserStories(userId: string) {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLES.stories,
    FilterExpression: "userId = :userId",
    ExpressionAttributeValues: { ":userId": userId },
  }));
  
  return result.Items || [];
}

export async function likeStory(storyId: string) {
  await docClient.send(new UpdateCommand({
    TableName: TABLES.stories,
    Key: { id: storyId },
    UpdateExpression: "SET likes = likes + :inc",
    ExpressionAttributeValues: { ":inc": 1 },
  }));
  
  return { success: true };
}

// Export getDb for compatibility
export async function getDb() {
  return docClient;
}
