/**
 * Escrow Payment System
 * Handles milestone-based payments with Paystack integration
 */

export interface EscrowPayment {
  id: string;
  jobId: string;
  buyerId: string;
  workerId: string;
  totalAmount: number; // in cents
  depositAmount: number; // 30% upfront
  remainingAmount: number; // 70% on completion
  status: 'pending' | 'deposit_paid' | 'held' | 'released' | 'refunded';
  paystackReference?: string;
  depositPaidAt?: string;
  releasedAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  escrowId: string;
  jobId: string;
  title: string;
  description: string;
  amount: number; // in cents
  status: 'pending' | 'in_progress' | 'completed' | 'verified' | 'paid';
  proofUrl?: string; // Photo/document proof
  completedAt?: string;
  verifiedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentConfig {
  depositPercentage: number; // Default: 30%
  buyerFeePercentage: number; // Default: 5% from buyer
  workerFeePercentage: number; // Default: 5% from worker
  autoReleaseHours: number; // Default: 72 hours after completion
}

export const DEFAULT_CONFIG: PaymentConfig = {
  depositPercentage: 0.30, // 30% upfront
  buyerFeePercentage: 0.05, // 5% from buyer
  workerFeePercentage: 0.05, // 5% from worker
  autoReleaseHours: 72, // 3 days
};

/**
 * Calculate escrow amounts
 * 
 * Commission Structure:
 * - Buyer pays job amount + 5% commission
 * - Worker receives job amount - 5% commission
 * - Platform earns 10% total (5% from each party)
 */
export function calculateEscrowAmounts(
  jobAmount: number,
  config: PaymentConfig = DEFAULT_CONFIG
): {
  jobAmount: number;
  buyerFee: number;
  buyerTotal: number;
  depositAmount: number;
  remainingAmount: number;
  workerFee: number;
  workerReceives: number;
  platformRevenue: number;
} {
  // Buyer pays job amount + 5%
  const buyerFee = Math.round(jobAmount * config.buyerFeePercentage);
  const buyerTotal = jobAmount + buyerFee;
  
  // Calculate deposit (30% of buyer's total)
  const depositAmount = Math.round(buyerTotal * config.depositPercentage);
  const remainingAmount = buyerTotal - depositAmount;
  
  // Worker receives job amount - 5%
  const workerFee = Math.round(jobAmount * config.workerFeePercentage);
  const workerReceives = jobAmount - workerFee;
  
  // Platform earns both fees
  const platformRevenue = buyerFee + workerFee;

  return {
    jobAmount,
    buyerFee,
    buyerTotal,
    depositAmount,
    remainingAmount,
    workerFee,
    workerReceives,
    platformRevenue,
  };
}

/**
 * Create escrow payment
 */
export function createEscrowPayment(data: {
  jobId: string;
  buyerId: string;
  workerId: string;
  totalAmount: number;
}): EscrowPayment {
  const amounts = calculateEscrowAmounts(data.totalAmount);
  const now = new Date().toISOString();

  return {
    id: `escrow_${Date.now()}`,
    jobId: data.jobId,
    buyerId: data.buyerId,
    workerId: data.workerId,
    totalAmount: amounts.totalAmount,
    depositAmount: amounts.depositAmount,
    remainingAmount: amounts.remainingAmount,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create milestone
 */
export function createMilestone(data: {
  escrowId: string;
  jobId: string;
  title: string;
  description: string;
  amount: number;
}): Milestone {
  const now = new Date().toISOString();

  return {
    id: `milestone_${Date.now()}`,
    escrowId: data.escrowId,
    jobId: data.jobId,
    title: data.title,
    description: data.description,
    amount: data.amount,
    status: 'pending',
    createdAt: now,
  };
}

/**
 * Check if payment should be auto-released
 */
export function shouldAutoRelease(
  completedAt: Date,
  config: PaymentConfig = DEFAULT_CONFIG
): boolean {
  const now = new Date();
  const hoursSinceCompletion = (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceCompletion >= config.autoReleaseHours;
}

/**
 * Calculate platform fees (from both parties)
 */
export function calculatePlatformFees(
  jobAmount: number,
  config: PaymentConfig = DEFAULT_CONFIG
): {
  buyerFee: number;
  workerFee: number;
  totalRevenue: number;
} {
  const buyerFee = Math.round(jobAmount * config.buyerFeePercentage);
  const workerFee = Math.round(jobAmount * config.workerFeePercentage);
  const totalRevenue = buyerFee + workerFee;
  
  return {
    buyerFee,
    workerFee,
    totalRevenue,
  };
}

/**
 * Validate payment release
 */
export function canReleasePayment(escrow: EscrowPayment): {
  canRelease: boolean;
  reason?: string;
} {
  if (escrow.status !== 'held') {
    return {
      canRelease: false,
      reason: 'Payment is not in held status',
    };
  }

  return { canRelease: true };
}

/**
 * Validate refund
 */
export function canRefund(escrow: EscrowPayment): {
  canRefund: boolean;
  reason?: string;
} {
  if (escrow.status === 'released') {
    return {
      canRefund: false,
      reason: 'Payment has already been released',
    };
  }

  if (escrow.status === 'refunded') {
    return {
      canRefund: false,
      reason: 'Payment has already been refunded',
    };
  }

  return { canRefund: true };
}

/**
 * Format amount for display
 */
export function formatAmount(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

/**
 * Payment flow states
 */
export const PAYMENT_FLOW = {
  // 1. Job accepted, escrow created
  CREATED: 'pending',
  
  // 2. Buyer pays deposit (30%)
  DEPOSIT_PAID: 'deposit_paid',
  
  // 3. Worker starts job, payment held
  HELD: 'held',
  
  // 4. Job completed, payment released to worker
  RELEASED: 'released',
  
  // 5. Dispute/cancellation, payment refunded to buyer
  REFUNDED: 'refunded',
} as const;

/**
 * Milestone flow states
 */
export const MILESTONE_FLOW = {
  // 1. Milestone created
  PENDING: 'pending',
  
  // 2. Worker starts milestone
  IN_PROGRESS: 'in_progress',
  
  // 3. Worker marks as complete with proof
  COMPLETED: 'completed',
  
  // 4. Buyer verifies completion
  VERIFIED: 'verified',
  
  // 5. Payment released for this milestone
  PAID: 'paid',
} as const;

/**
 * Generate Paystack payment reference
 */
export function generatePaystackReference(escrowId: string): string {
  return `khaya_${escrowId}_${Date.now()}`;
}

/**
 * Verify Paystack payment
 */
export async function verifyPaystackPayment(reference: string): Promise<{
  success: boolean;
  amount?: number;
  status?: string;
  error?: string;
}> {
  try {
    const paystack = await import('./paystack');
    const result = await paystack.verifyPayment(reference);
    
    return {
      success: result.status && result.data.status === 'success',
      amount: result.data.amount,
      status: result.data.status,
    };
  } catch (error) {
    console.error('[ESCROW] Payment verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}
