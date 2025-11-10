import * as db from './db.mjs';

// Helper to parse request body
function parseBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch {
    return {};
  }
}

// Helper to create response
function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify(body),
  };
}

// Route handlers
const routes = {
  // Auth routes
  'GET /auth/me': async (event) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });
    const user = await db.getUser(userId);
    return response(200, user);
  },

  // Profile routes
  'GET /profile': async (event) => {
    const { userId } = event.queryStringParameters || {};
    if (!userId) return response(400, { error: 'userId required' });
    const profile = await db.getProfile(userId);
    return response(200, profile || {});
  },

  'POST /profile': async (event) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });
    const body = parseBody(event);
    const profile = await db.upsertProfile(userId, body);
    return response(200, profile);
  },

  'GET /profiles': async (event) => {
    const filters = event.queryStringParameters || {};
    const profiles = await db.listProfiles(filters);
    return response(200, profiles);
  },

  // Job routes
  'GET /jobs': async (event) => {
    const filters = event.queryStringParameters || {};
    const jobs = await db.listJobs(filters);
    return response(200, jobs);
  },

  'POST /jobs': async (event) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });
    const body = parseBody(event);
    const job = await db.createJob({ ...body, buyerId: userId });
    return response(201, job);
  },

  'GET /job': async (event) => {
    const { id } = event.queryStringParameters || {};
    if (!id) return response(400, { error: 'id required' });
    const job = await db.getJob(id);
    return response(200, job || {});
  },

  // Bid routes
  'POST /bids': async (event) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });
    const body = parseBody(event);
    const bid = await db.createBid({ ...body, workerId: userId });
    return response(201, bid);
  },

  'GET /bids': async (event) => {
    const { jobId } = event.queryStringParameters || {};
    if (!jobId) return response(400, { error: 'jobId required' });
    const bids = await db.listBidsByJob(jobId);
    return response(200, bids);
  },

  // Listing routes
  'GET /listings': async (event) => {
    const filters = event.queryStringParameters || {};
    const listings = await db.listListings(filters);
    return response(200, listings);
  },

  'POST /listings': async (event) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });
    const body = parseBody(event);
    const listing = await db.createListing({ ...body, sellerId: userId });
    return response(201, listing);
  },

  // Review routes
  'POST /reviews': async (event) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });
    const body = parseBody(event);
    const review = await db.createReview({ ...body, reviewerId: userId });
    return response(201, review);
  },

  // Credit routes
  'GET /credits': async (event) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });
    const credits = await db.getUserCredits(userId);
    const total = credits.reduce((sum, c) => sum + (c.amount || 0), 0);
    return response(200, { credits, total });
  },

  // Referral routes
  'POST /referrals': async (event) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });
    const body = parseBody(event);
    const referral = await db.createReferral({ ...body, referrerId: userId });
    return response(201, referral);
  },

  'GET /referral': async (event) => {
    const { code } = event.queryStringParameters || {};
    if (!code) return response(400, { error: 'code required' });
    const referral = await db.getReferralByCode(code);
    return response(200, referral || {});
  },

  // Story routes
  'GET /stories': async (event) => {
    const stories = await db.listStories();
    return response(200, stories);
  },

  'POST /stories': async (event) => {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) return response(401, { error: 'Unauthorized' });
    const body = parseBody(event);
    const story = await db.createStory({ ...body, userId });
    return response(201, story);
  },
};

// Main Lambda handler
export async function handler(event) {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  // Route key
  const routeKey = `${event.httpMethod} ${event.path}`;
  console.log('Route:', routeKey);

  // Find matching route
  const handler = routes[routeKey];
  if (!handler) {
    return response(404, { error: 'Route not found' });
  }

  try {
    return await handler(event);
  } catch (error) {
    console.error('Error:', error);
    return response(500, { error: error.message });
  }
}
