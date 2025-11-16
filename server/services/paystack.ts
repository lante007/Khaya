/**
 * Paystack Payment Integration
 * Handles payment initialization, verification, and transfers
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_API_URL = 'https://api.paystack.co';

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer: {
      email: string;
      customer_code: string;
    };
  };
}

/**
 * Initialize payment
 */
export async function initializePayment(data: {
  email: string;
  amount: number; // in cents
  reference: string;
  metadata?: any;
  callback_url?: string;
}): Promise<PaystackInitializeResponse> {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amount, // Paystack expects amount in kobo (cents)
        reference: data.reference,
        metadata: data.metadata,
        callback_url: data.callback_url,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Payment initialization failed');
    }

    return result;
  } catch (error) {
    console.error('[PAYSTACK] Initialize payment error:', error);
    throw error;
  }
}

/**
 * Verify payment
 */
export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Payment verification failed');
    }

    return result;
  } catch (error) {
    console.error('[PAYSTACK] Verify payment error:', error);
    throw error;
  }
}

/**
 * Create transfer recipient
 */
export async function createTransferRecipient(data: {
  type: 'nuban' | 'mobile_money' | 'basa';
  name: string;
  account_number: string;
  bank_code: string;
  currency?: string;
}): Promise<any> {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/transferrecipient`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: data.type,
        name: data.name,
        account_number: data.account_number,
        bank_code: data.bank_code,
        currency: data.currency || 'ZAR',
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create transfer recipient');
    }

    return result;
  } catch (error) {
    console.error('[PAYSTACK] Create recipient error:', error);
    throw error;
  }
}

/**
 * Initiate transfer
 */
export async function initiateTransfer(data: {
  amount: number; // in cents
  recipient: string; // recipient code
  reason?: string;
  reference?: string;
}): Promise<any> {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/transfer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: data.amount,
        recipient: data.recipient,
        reason: data.reason || 'Payment for completed job',
        reference: data.reference,
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Transfer failed');
    }

    return result;
  } catch (error) {
    console.error('[PAYSTACK] Transfer error:', error);
    throw error;
  }
}

/**
 * List banks
 */
export async function listBanks(country: string = 'south africa'): Promise<any> {
  try {
    const response = await fetch(`${PAYSTACK_API_URL}/bank?country=${country}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch banks');
    }

    return result;
  } catch (error) {
    console.error('[PAYSTACK] List banks error:', error);
    throw error;
  }
}

/**
 * Verify account number
 */
export async function verifyAccountNumber(data: {
  account_number: string;
  bank_code: string;
}): Promise<any> {
  try {
    const response = await fetch(
      `${PAYSTACK_API_URL}/bank/resolve?account_number=${data.account_number}&bank_code=${data.bank_code}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Account verification failed');
    }

    return result;
  } catch (error) {
    console.error('[PAYSTACK] Verify account error:', error);
    throw error;
  }
}

/**
 * Format amount for Paystack (convert to cents if needed)
 */
export function formatAmountForPaystack(amount: number): number {
  // Paystack expects amount in kobo (cents)
  // If amount is already in cents, return as is
  // If amount is in rands, multiply by 100
  return Math.round(amount);
}

/**
 * Format amount for display
 */
export function formatAmountForDisplay(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

/**
 * Generate payment reference
 */
export function generatePaymentReference(prefix: string = 'khaya'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Webhook signature verification
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

/**
 * Handle webhook event
 */
export async function handleWebhookEvent(event: any): Promise<void> {
  console.log('[PAYSTACK] Webhook event:', event.event);
  
  switch (event.event) {
    case 'charge.success':
      // Handle successful payment
      console.log('[PAYSTACK] Payment successful:', event.data.reference);
      break;
      
    case 'transfer.success':
      // Handle successful transfer
      console.log('[PAYSTACK] Transfer successful:', event.data.reference);
      break;
      
    case 'transfer.failed':
      // Handle failed transfer
      console.log('[PAYSTACK] Transfer failed:', event.data.reference);
      break;
      
    default:
      console.log('[PAYSTACK] Unhandled event:', event.event);
  }
}
