/**
 * Paystack Integration
 * Payment processing and subscriptions
 */

import { config } from '../config/aws.js';

const PAYSTACK_API_URL = 'https://api.paystack.co';
const PLATFORM_FEE_PERCENT = 5; // 5% platform fee

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

/**
 * Make Paystack API request
 */
async function paystackRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: any
): Promise<PaystackResponse> {
  const response = await fetch(`${PAYSTACK_API_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${config.paystackSecretKey}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  return response.json();
}

/**
 * Initialize payment transaction
 */
export async function initializePayment(params: {
  email: string;
  amount: number; // in kobo (ZAR cents)
  reference: string;
  metadata?: Record<string, any>;
  callback_url?: string;
}): Promise<{
  authorization_url: string;
  access_code: string;
  reference: string;
}> {
  const response = await paystackRequest('/transaction/initialize', 'POST', params);
  
  if (!response.status) {
    throw new Error(`Paystack error: ${response.message}`);
  }
  
  return response.data;
}

/**
 * Verify payment transaction
 */
export async function verifyPayment(reference: string): Promise<{
  status: 'success' | 'failed' | 'pending';
  amount: number;
  metadata: Record<string, any>;
  paid_at: string;
}> {
  const response = await paystackRequest(`/transaction/verify/${reference}`);
  
  if (!response.status) {
    throw new Error(`Paystack error: ${response.message}`);
  }
  
  return {
    status: response.data.status,
    amount: response.data.amount,
    metadata: response.data.metadata,
    paid_at: response.data.paid_at
  };
}

/**
 * Calculate platform fee
 */
export function calculateFee(amount: number): {
  subtotal: number;
  platformFee: number;
  total: number;
  netAmount: number;
} {
  const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
  const total = amount + platformFee;
  const netAmount = amount - platformFee;
  
  return {
    subtotal: amount,
    platformFee,
    total,
    netAmount
  };
}

/**
 * Check if user has fee waiver available
 */
export function hasFeeWaiver(completedJobs: number, userType: 'buyer' | 'worker'): boolean {
  // Workers get first 2 jobs free
  if (userType === 'worker' && completedJobs < 2) {
    return true;
  }
  
  return false;
}

/**
 * Create payment session with fee calculation
 */
export async function createPaymentSession(params: {
  userId: string;
  email: string;
  amount: number; // in ZAR
  jobId: string;
  userType: 'buyer' | 'worker';
  completedJobs: number;
}): Promise<{
  sessionId: string;
  authorizationUrl: string;
  reference: string;
  feeBreakdown: {
    subtotal: number;
    platformFee: number;
    total: number;
    netAmount: number;
    feeWaived: boolean;
    message: string;
  };
}> {
  const amountInKobo = params.amount * 100; // Convert ZAR to kobo
  const feeWaived = hasFeeWaiver(params.completedJobs, params.userType);
  
  let feeBreakdown;
  let finalAmount;
  
  if (feeWaived) {
    // No fee for waived transactions
    feeBreakdown = {
      subtotal: params.amount,
      platformFee: 0,
      total: params.amount,
      netAmount: params.amount,
      feeWaived: true,
      message: `Fee waived! ${params.userType === 'worker' ? `${2 - params.completedJobs} free jobs remaining` : 'Special offer'}`
    };
    finalAmount = amountInKobo;
  } else {
    // Calculate fee
    const calc = calculateFee(amountInKobo);
    feeBreakdown = {
      subtotal: calc.subtotal / 100,
      platformFee: calc.platformFee / 100,
      total: calc.total / 100,
      netAmount: calc.netAmount / 100,
      feeWaived: false,
      message: `5% service fee - for verified transactions & secure payments`
    };
    finalAmount = params.userType === 'buyer' ? calc.total : amountInKobo;
  }
  
  // Generate unique reference
  const reference = `khaya_${params.jobId}_${Date.now()}`;
  
  // Initialize payment
  const payment = await initializePayment({
    email: params.email,
    amount: finalAmount,
    reference,
    metadata: {
      userId: params.userId,
      jobId: params.jobId,
      userType: params.userType,
      feeWaived,
      originalAmount: params.amount
    }
  });
  
  return {
    sessionId: payment.access_code,
    authorizationUrl: payment.authorization_url,
    reference: payment.reference,
    feeBreakdown
  };
}

/**
 * Create subscription plan
 */
export async function createSubscription(params: {
  email: string;
  plan: 'pro' | 'elite';
  userId: string;
}): Promise<{
  subscriptionCode: string;
  emailToken: string;
}> {
  // Paystack plan codes (create these in Paystack dashboard)
  const planCodes = {
    pro: 'PLN_pro_monthly', // R149/month
    elite: 'PLN_elite_monthly' // R299/month
  };
  
  const response = await paystackRequest('/subscription', 'POST', {
    customer: params.email,
    plan: planCodes[params.plan],
    metadata: {
      userId: params.userId,
      tier: params.plan
    }
  });
  
  if (!response.status) {
    throw new Error(`Paystack error: ${response.message}`);
  }
  
  return {
    subscriptionCode: response.data.subscription_code,
    emailToken: response.data.email_token
  };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionCode: string): Promise<boolean> {
  const response = await paystackRequest(`/subscription/disable`, 'POST', {
    code: subscriptionCode,
    token: config.paystackSecretKey
  });
  
  return response.status;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', config.paystackSecretKey)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
