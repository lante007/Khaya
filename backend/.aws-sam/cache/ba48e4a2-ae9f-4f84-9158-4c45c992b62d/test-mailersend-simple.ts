/**
 * Simple MailerSend Test
 */

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import * as dotenv from 'dotenv';

dotenv.config();

async function test() {
  console.log('🧪 Testing MailerSend Connection...\n');
  
  const apiKey = process.env.MAILERSEND_API_KEY;
  
  if (!apiKey) {
    console.error('❌ MAILERSEND_API_KEY not found');
    process.exit(1);
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
  
  const mailerSend = new MailerSend({ apiKey });
  
  try {
    // Test with verified domain
    const sentFrom = new Sender('noreply@projectkhaya.co.za', 'Project Khaya');
    const recipients = [new Recipient('lante007@gmail.com')];
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Test Email')
      .setHtml('<p>Test</p>')
      .setText('Test');
    
    console.log('\n📧 Attempting to send test email...');
    const response = await mailerSend.email.send(emailParams);
    
    console.log('\n✅ Success!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    
    if (error.body) {
      console.error('Error body:', JSON.stringify(error.body, null, 2));
    }
  }
}

test();
