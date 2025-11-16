/**
 * Test MailerSend Email Integration
 * Run with: npx tsx test-email.ts
 */

import { sendOTPEmail } from './src/lib/email.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('🧪 Testing MailerSend Email Integration...\n');
  
  // Check if API key is configured
  if (!process.env.MAILERSEND_API_KEY) {
    console.error('❌ MAILERSEND_API_KEY not found in environment variables');
    console.log('\n📝 Please add your MailerSend API key to backend/.env:');
    console.log('   MAILERSEND_API_KEY=your_api_key_here\n');
    process.exit(1);
  }
  
  console.log('✅ MailerSend API key found');
  console.log(`📧 From: noreply@projectkhaya.co.za\n`);
  
  // Test email address (replace with your test email)
  const testEmail = process.argv[2] || 'test@example.com';
  const testOTP = '123456';
  
  console.log(`📬 Sending test OTP to: ${testEmail}`);
  console.log(`🔢 OTP Code: ${testOTP}\n`);
  
  try {
    const result = await sendOTPEmail(testEmail, testOTP);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`📨 Message ID: ${result.messageId}\n`);
      console.log('📥 Check your inbox for the verification email');
      console.log('⏰ The email should arrive within a few seconds\n');
    } else {
      console.error('❌ Failed to send email');
      console.error(`Error: ${result.error}\n`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run test
testEmail().then(() => {
  console.log('✨ Test complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
