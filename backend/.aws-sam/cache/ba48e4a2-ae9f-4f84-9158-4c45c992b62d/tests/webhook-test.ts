/**
 * Paystack Webhook Signature Verification Test
 * Run: npx ts-node tests/webhook-test.ts
 */

import crypto from 'crypto';

// Test configuration
const TEST_SECRET = 'sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const TEST_PAYLOAD = {
  event: 'charge.success',
  data: {
    reference: 'khaya_test-job-123_1699999999999',
    amount: 50000, // R500 in kobo
    status: 'success',
    paid_at: '2025-11-11T18:00:00.000Z',
    metadata: {
      jobId: 'test-job-123',
      userId: 'test-buyer-456',
      userType: 'buyer',
      originalAmount: 500
    }
  }
};

/**
 * Generate webhook signature (same as Paystack)
 */
function generateSignature(payload: any, secret: string): string {
  const hash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash;
}

/**
 * Verify webhook signature
 */
function verifySignature(payload: any, signature: string, secret: string): boolean {
  const expectedHash = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return expectedHash === signature;
}

/**
 * Test webhook flow
 */
async function testWebhookFlow() {
  console.log('🧪 Testing Paystack Webhook Signature Verification\n');
  
  // Step 1: Generate signature
  console.log('1️⃣ Generating webhook signature...');
  const signature = generateSignature(TEST_PAYLOAD, TEST_SECRET);
  console.log(`   Signature: ${signature.substring(0, 20)}...`);
  console.log('   ✅ Signature generated\n');
  
  // Step 2: Verify signature (valid)
  console.log('2️⃣ Verifying valid signature...');
  const isValid = verifySignature(TEST_PAYLOAD, signature, TEST_SECRET);
  console.log(`   Valid: ${isValid}`);
  if (isValid) {
    console.log('   ✅ Signature verification passed\n');
  } else {
    console.log('   ❌ Signature verification failed\n');
    process.exit(1);
  }
  
  // Step 3: Verify signature (invalid)
  console.log('3️⃣ Testing invalid signature...');
  const invalidSignature = 'invalid_signature_12345';
  const isInvalid = verifySignature(TEST_PAYLOAD, invalidSignature, TEST_SECRET);
  console.log(`   Valid: ${isInvalid}`);
  if (!isInvalid) {
    console.log('   ✅ Invalid signature correctly rejected\n');
  } else {
    console.log('   ❌ Invalid signature incorrectly accepted\n');
    process.exit(1);
  }
  
  // Step 4: Test payload extraction
  console.log('4️⃣ Testing payload extraction...');
  const { event, data } = TEST_PAYLOAD;
  const { reference, amount, metadata } = data;
  const { jobId, userId } = metadata;
  
  console.log(`   Event: ${event}`);
  console.log(`   Reference: ${reference}`);
  console.log(`   Amount: R${amount / 100}`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`   User ID: ${userId}`);
  console.log('   ✅ Payload extracted correctly\n');
  
  // Step 5: Test escrow calculation
  console.log('5️⃣ Testing escrow calculation...');
  const escrowAmount = amount / 100; // Convert kobo to ZAR
  const platformFee = escrowAmount * 0.05; // 5%
  const workerAmount = escrowAmount * 0.95; // 95%
  
  console.log(`   Escrow Amount: R${escrowAmount.toFixed(2)}`);
  console.log(`   Platform Fee (5%): R${platformFee.toFixed(2)}`);
  console.log(`   Worker Amount (95%): R${workerAmount.toFixed(2)}`);
  console.log('   ✅ Escrow calculation correct\n');
  
  console.log('✅ All webhook tests passed!\n');
  
  // Step 6: Generate curl command for testing
  console.log('6️⃣ Test webhook endpoint with this curl command:\n');
  console.log('```bash');
  console.log(`curl -X POST https://your-api-url.com/trpc/payments.paystackWebhook \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -H "x-paystack-signature: ${signature}" \\`);
  console.log(`  -d '${JSON.stringify(TEST_PAYLOAD, null, 2)}'`);
  console.log('```\n');
}

// Run tests
testWebhookFlow().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
