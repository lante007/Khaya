/**
 * Paystack Integration
 * Payment processing and subscriptions
 */

import { config } from '../config/aws.js';
import crypto from 'crypto';

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
  
  return response.json() as Promise<PaystackResponse>;
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
  reference?: string;
  metadata?: Record<string, any>;
  callback_url?: string;
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
  console.log('[Paystack] createPaymentSession called:', { 
    email: params.email, 
    amount: params.amount, 
    jobId: params.jobId,
    userType: params.userType
  });
  
  const amountInKobo = params.amount * 100; // Convert ZAR to kobo
  const feeWaived = hasFeeWaiver(params.completedJobs, params.userType);
  console.log('[Paystack] Fee waived:', feeWaived);
  
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
  
  // Generate unique reference or use provided one
  const reference = params.reference || `khaya_${params.jobId}_${Date.now()}`;
  
  // Merge metadata
  const metadata = {
    userId: params.userId,
    jobId: params.jobId,
    userType: params.userType,
    feeWaived,
    originalAmount: params.amount,
    ...(params.metadata || {})
  };
  
  // Initialize payment with callback URL
  const payment = await initializePayment({
    email: params.email,
    amount: finalAmount,
    reference,
    metadata,
    callback_url: params.callback_url
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
  const hash = crypto
    .createHmac('sha512', config.paystackSecretKey)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

/**
 * Create transfer recipient (bank account)
 */
export async function createTransferRecipient(params: {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}): Promise<{
  recipientCode: string;
  details: any;
}> {
  const response = await paystackRequest('/transferrecipient', 'POST', {
    type: 'nuban',
    name: params.name,
    account_number: params.accountNumber,
    bank_code: params.bankCode,
    currency: params.currency || 'ZAR'
  });
  
  if (!response.status) {
    throw new Error(`Paystack error: ${response.message}`);
  }
  
  return {
    recipientCode: response.data.recipient_code,
    details: response.data
  };
}

/**
 * Initiate transfer to bank account
 */
export async function initiateTransfer(params: {
  amount: number; // in kobo (ZAR cents)
  recipientCode: string;
  reason: string;
  reference?: string;
}): Promise<{
  transferCode: string;
  status: string;
  reference: string;
}> {
  const reference = params.reference || `transfer_${Date.now()}`;
  
  const response = await paystackRequest('/transfer', 'POST', {
    source: 'balance',
    amount: params.amount,
    recipient: params.recipientCode,
    reason: params.reason,
    reference
  });
  
  if (!response.status) {
    throw new Error(`Paystack error: ${response.message}`);
  }
  
  return {
    transferCode: response.data.transfer_code,
    status: response.data.status,
    reference: response.data.reference
  };
}

/**
 * Verify transfer status
 */
export async function verifyTransfer(reference: string): Promise<{
  status: 'success' | 'failed' | 'pending' | 'reversed';
  amount: number;
  recipient: any;
}> {
  const response = await paystackRequest(`/transfer/verify/${reference}`);
  
  if (!response.status) {
    throw new Error(`Paystack error: ${response.message}`);
  }
  
  return {
    status: response.data.status,
    amount: response.data.amount,
    recipient: response.data.recipient
  };
}

/**
 * List South African banks
 */
export async function listBanks(): Promise<Array<{
  name: string;
  code: string;
  slug: string;
}>> {
  const response = await paystackRequest('/bank?currency=ZAR');
  
  if (!response.status) {
    throw new Error(`Paystack error: ${response.message}`);
  }
  
  return response.data.map((bank: any) => ({
    name: bank.name,
    code: bank.code,
    slug: bank.slug
  }));
}

/**
 * Resolve bank account details
 */
export async function resolveAccountNumber(params: {
  accountNumber: string;
  bankCode: string;
}): Promise<{
  accountNumber: string;
  accountName: string;
  bankId: number;
}> {
  const response = await paystackRequest(
    `/bank/resolve?account_number=${params.accountNumber}&bank_code=${params.bankCode}`
  );
  
  if (!response.status) {
    throw new Error(`Paystack error: ${response.message}`);
  }
  
  return {
    accountNumber: response.data.account_number,
    accountName: response.data.account_name,
    bankId: response.data.bank_id
  };
}
