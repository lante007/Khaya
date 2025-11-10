import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'af-south-1' });
const ddb = DynamoDBDocumentClient.from(client);

// Table names from environment
const TABLES = {
  users: process.env.USERS_TABLE,
  profiles: process.env.PROFILES_TABLE,
  jobs: process.env.JOBS_TABLE,
  bids: process.env.BIDS_TABLE,
  listings: process.env.LISTINGS_TABLE,
  reviews: process.env.REVIEWS_TABLE,
  credits: process.env.CREDITS_TABLE,
  referrals: process.env.REFERRALS_TABLE,
  stories: process.env.STORIES_TABLE,
};

// User operations
export async function getUser(id) {
  const result = await ddb.send(new GetCommand({
    TableName: TABLES.users,
    Key: { id },
  }));
  return result.Item;
}

export async function getUserByEmail(email) {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLES.users,
    IndexName: 'EmailIndex',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
  }));
  return result.Items?.[0];
}

export async function createUser(user) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const item = {
    id,
    ...user,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  await ddb.send(new PutCommand({
    TableName: TABLES.users,
    Item: item,
  }));
  return item;
}

// Profile operations
export async function getProfile(userId) {
  const result = await ddb.send(new GetCommand({
    TableName: TABLES.profiles,
    Key: { userId },
  }));
  return result.Item;
}

export async function upsertProfile(userId, profileData) {
  const now = new Date().toISOString();
  const item = {
    userId,
    ...profileData,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({
    TableName: TABLES.profiles,
    Item: item,
  }));
  return item;
}

export async function listProfiles(filters = {}) {
  const params = {
    TableName: TABLES.profiles,
  };
  
  if (filters.location) {
    params.IndexName = 'LocationIndex';
    params.KeyConditionExpression = 'location = :location';
    params.ExpressionAttributeValues = { ':location': filters.location };
  }
  
  const command = filters.location ? new QueryCommand(params) : new ScanCommand(params);
  const result = await ddb.send(command);
  return result.Items || [];
}

// Job operations
export async function createJob(jobData) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const item = {
    id,
    ...jobData,
    createdAt: now,
    updatedAt: now,
    status: 'open',
  };
  await ddb.send(new PutCommand({
    TableName: TABLES.jobs,
    Item: item,
  }));
  return item;
}

export async function getJob(id) {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLES.jobs,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: { ':id': id },
  }));
  return result.Items?.[0];
}

export async function listJobs(filters = {}) {
  const params = {
    TableName: TABLES.jobs,
  };
  
  if (filters.status) {
    params.IndexName = 'StatusIndex';
    params.KeyConditionExpression = '#status = :status';
    params.ExpressionAttributeNames = { '#status': 'status' };
    params.ExpressionAttributeValues = { ':status': filters.status };
  }
  
  const command = filters.status ? new QueryCommand(params) : new ScanCommand(params);
  const result = await ddb.send(command);
  return result.Items || [];
}

// Bid operations
export async function createBid(bidData) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const item = {
    id,
    ...bidData,
    createdAt: now,
    status: 'pending',
  };
  await ddb.send(new PutCommand({
    TableName: TABLES.bids,
    Item: item,
  }));
  return item;
}

export async function listBidsByJob(jobId) {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLES.bids,
    IndexName: 'JobIndex',
    KeyConditionExpression: 'jobId = :jobId',
    ExpressionAttributeValues: { ':jobId': jobId },
  }));
  return result.Items || [];
}

// Listing operations
export async function createListing(listingData) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const item = {
    id,
    ...listingData,
    createdAt: now,
    updatedAt: now,
  };
  await ddb.send(new PutCommand({
    TableName: TABLES.listings,
    Item: item,
  }));
  return item;
}

export async function listListings(filters = {}) {
  const params = {
    TableName: TABLES.listings,
  };
  
  if (filters.category) {
    params.IndexName = 'CategoryIndex';
    params.KeyConditionExpression = 'category = :category';
    params.ExpressionAttributeValues = { ':category': filters.category };
  }
  
  const command = filters.category ? new QueryCommand(params) : new ScanCommand(params);
  const result = await ddb.send(command);
  return result.Items || [];
}

// Review operations
export async function createReview(reviewData) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const item = {
    id,
    ...reviewData,
    createdAt: now,
  };
  await ddb.send(new PutCommand({
    TableName: TABLES.reviews,
    Item: item,
  }));
  return item;
}

// Credit operations
export async function createCredit(creditData) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const item = {
    id,
    ...creditData,
    createdAt: now,
  };
  await ddb.send(new PutCommand({
    TableName: TABLES.credits,
    Item: item,
  }));
  return item;
}

export async function getUserCredits(userId) {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLES.credits,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  }));
  return result.Items || [];
}

// Referral operations
export async function createReferral(referralData) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const item = {
    id,
    ...referralData,
    createdAt: now,
    status: 'pending',
  };
  await ddb.send(new PutCommand({
    TableName: TABLES.referrals,
    Item: item,
  }));
  return item;
}

export async function getReferralByCode(code) {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLES.REFERRALS,
    IndexName: 'CodeIndex',
    KeyConditionExpression: 'referralCode = :code',
    ExpressionAttributeValues: { ':code': code },
  }));
  return result.Items?.[0];
}

// Story operations
export async function createStory(storyData) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const item = {
    id,
    ...storyData,
    createdAt: now,
    approved: false,
    likes: 0,
  };
  await ddb.send(new PutCommand({
    TableName: TABLES.stories,
    Item: item,
  }));
  return item;
}

export async function listStories() {
  const result = await ddb.send(new ScanCommand({
    TableName: TABLES.stories,
    FilterExpression: 'approved = :approved',
    ExpressionAttributeValues: { ':approved': true },
  }));
  return result.Items || [];
}
