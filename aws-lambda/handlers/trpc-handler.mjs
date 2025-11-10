/**
 * Simple tRPC-compatible Lambda handler
 * Returns mock data for frontend to work without errors
 */

// Mock data
const mockUser = null; // Not authenticated
const mockJobs = [];
const mockWorkers = [];
const mockListings = [];
const mockBids = [];
const mockReviews = [];
const mockStories = [];
const mockCredits = { balance: 0, history: [] };
const mockReferrals = [];

// Helper to create CORS response
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, trpc-batch-mode',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(body),
  };
}

// Parse tRPC batch request
function parseTRPCRequest(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : null;
    const isBatch = event.headers['trpc-batch-mode'] === '1' || Array.isArray(body);
    
    if (isBatch && Array.isArray(body)) {
      return { isBatch: true, requests: body };
    }
    
    // Single request
    return { isBatch: false, requests: [body] };
  } catch (error) {
    console.error('Parse error:', error);
    return { isBatch: false, requests: [] };
  }
}

// Handle tRPC procedure call
function handleProcedure(path, input) {
  console.log('Procedure:', path, 'Input:', input);
  
  // Auth procedures
  if (path === 'auth.me') {
    return { result: { data: mockUser } };
  }
  if (path === 'auth.logout') {
    return { result: { data: { success: true } } };
  }
  
  // Profile procedures
  if (path === 'profile.get') {
    return { result: { data: null } };
  }
  if (path === 'profile.getWorkers') {
    return { result: { data: mockWorkers } };
  }
  
  // Job procedures
  if (path === 'job.getOpen') {
    return { result: { data: mockJobs } };
  }
  if (path === 'job.getMyJobs') {
    return { result: { data: mockJobs } };
  }
  if (path === 'job.getById') {
    return { result: { data: null } };
  }
  
  // Bid procedures
  if (path === 'bid.getByJob') {
    return { result: { data: mockBids } };
  }
  if (path === 'bid.getMyBids') {
    return { result: { data: mockBids } };
  }
  
  // Listing procedures
  if (path === 'listing.getAvailable') {
    return { result: { data: mockListings } };
  }
  if (path === 'listing.getMyListings') {
    return { result: { data: mockListings } };
  }
  if (path === 'listing.getById') {
    return { result: { data: null } };
  }
  
  // Review procedures
  if (path === 'review.getForUser') {
    return { result: { data: mockReviews } };
  }
  
  // Credits procedures
  if (path === 'credits.getBalance') {
    return { result: { data: mockCredits } };
  }
  if (path === 'credits.getHistory') {
    return { result: { data: mockCredits.history } };
  }
  
  // Referral procedures
  if (path === 'referral.getMy') {
    return { result: { data: mockReferrals } };
  }
  
  // Story procedures
  if (path === 'story.getApproved') {
    return { result: { data: mockStories } };
  }
  if (path === 'story.getFeatured') {
    return { result: { data: mockStories } };
  }
  if (path === 'story.getMy') {
    return { result: { data: mockStories } };
  }
  
  // Notification procedures
  if (path === 'notification.getMyNotifications') {
    return { result: { data: [] } };
  }
  
  // Message procedures
  if (path === 'message.getConversation') {
    return { result: { data: [] } };
  }
  
  // Milestone procedures
  if (path === 'milestone.getByJob') {
    return { result: { data: [] } };
  }
  
  // System procedures
  if (path === 'system.health') {
    return { 
      result: { 
        data: { 
          status: 'ok', 
          message: 'Mock API - Backend deployment in progress',
          timestamp: new Date().toISOString() 
        } 
      } 
    };
  }
  
  // Default: return empty success
  return { result: { data: { success: true } } };
}

// Main Lambda handler
export async function handler(event) {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
    return createResponse(200, {});
  }
  
  // Handle GET requests (query procedures)
  if (event.httpMethod === 'GET' || event.requestContext?.http?.method === 'GET') {
    const path = event.queryStringParameters?.path || '';
    const input = event.queryStringParameters?.input 
      ? JSON.parse(decodeURIComponent(event.queryStringParameters.input))
      : {};
    
    const result = handleProcedure(path, input);
    return createResponse(200, result);
  }
  
  // Handle POST requests (mutation procedures or batch)
  if (event.httpMethod === 'POST' || event.requestContext?.http?.method === 'POST') {
    const { isBatch, requests } = parseTRPCRequest(event);
    
    if (isBatch) {
      // Handle batch request
      const results = requests.map((req, index) => {
        const path = req.path || '';
        const input = req.input || {};
        return handleProcedure(path, input);
      });
      return createResponse(200, results);
    } else {
      // Handle single request
      const req = requests[0] || {};
      const path = req.path || event.queryStringParameters?.path || '';
      const input = req.input || {};
      const result = handleProcedure(path, input);
      return createResponse(200, result);
    }
  }
  
  return createResponse(404, { error: { message: 'Not found' } });
}
