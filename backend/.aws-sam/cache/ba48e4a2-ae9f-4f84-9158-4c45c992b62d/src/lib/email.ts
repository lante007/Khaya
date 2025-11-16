/**
 * Email Integration
 * MailerSend email sending
 */

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY || '',
});

const sentFrom = new Sender('noreply@projectkhaya.co.za', 'Project Khaya');

/**
 * Send OTP via email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const recipients = [new Recipient(email)];
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Your Project Khaya Verification Code')
      .setHtml(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .otp-code { font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; letter-spacing: 8px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Project Khaya</h1>
    </div>
    <div class="content">
      <h2>Your Verification Code</h2>
      <p>Use this code to verify your email address:</p>
      <div class="otp-code">${otp}</div>
      <p><strong>This code will expire in 10 minutes.</strong></p>
      <p>If you didn't request this code, please ignore this email.</p>
      <div class="footer">
        <p>Best regards,<br>Project Khaya Team</p>
        <p><a href="https://projectkhaya.co.za">projectkhaya.co.za</a></p>
      </div>
    </div>
  </div>
</body>
</html>`)
      .setText(`Your Project Khaya verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nProject Khaya Team\nhttps://projectkhaya.co.za`);

    const response = await mailerSend.email.send(emailParams);
    
    console.log(`[EMAIL] OTP sent to ${email} via MailerSend`);
    
    return {
      success: true,
      messageId: response.body?.id || 'sent'
    };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send OTP via MailerSend:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  try {
    const recipients = [new Recipient(email, name)];
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject('Welcome to Project Khaya!')
      .setHtml(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Project Khaya!</h1>
    </div>
    <div class="content">
      <h2>Hi ${name},</h2>
      <p>We're excited to have you join our community!</p>
      <p>Project Khaya connects skilled workers with clients who need their services. Whether you're looking to hire or offer your skills, we're here to help.</p>
      <h3>Get started:</h3>
      <ul>
        <li>Complete your profile</li>
        <li>Browse available jobs</li>
        <li>Connect with clients or workers</li>
      </ul>
      <a href="https://projectkhaya.co.za/dashboard" class="button">Go to Dashboard</a>
      <div class="footer">
        <p>If you have any questions, feel free to reach out to us.</p>
        <p>Best regards,<br>The Project Khaya Team</p>
        <p><a href="https://projectkhaya.co.za">projectkhaya.co.za</a></p>
      </div>
    </div>
  </div>
</body>
</html>`)
      .setText(`Hi ${name},\n\nWelcome to Project Khaya! We're excited to have you join our community.\n\nProject Khaya connects skilled workers with clients who need their services. Whether you're looking to hire or offer your skills, we're here to help.\n\nGet started:\n- Complete your profile\n- Browse available jobs\n- Connect with clients or workers\n\nIf you have any questions, feel free to reach out to us.\n\nBest regards,\nThe Project Khaya Team\nhttps://projectkhaya.co.za`);

    await mailerSend.email.send(emailParams);
    console.log(`[EMAIL] Welcome email sent to ${email} via MailerSend`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send welcome email via MailerSend:', error.message);
    return false;
  }
}

/**
 * Send job notification email
 */
export async function sendJobNotificationEmail(params: {
  email: string;
  jobTitle: string;
  message: string;
}): Promise<boolean> {
  try {
    const recipients = [new Recipient(params.email)];
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(`Project Khaya: ${params.jobTitle}`)
      .setHtml(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Project Khaya</h1>
    </div>
    <div class="content">
      <h2>${params.jobTitle}</h2>
      <p>${params.message}</p>
      <div class="footer">
        <p>Best regards,<br>Project Khaya Team</p>
        <p><a href="https://projectkhaya.co.za">projectkhaya.co.za</a></p>
      </div>
    </div>
  </div>
</body>
</html>`)
      .setText(params.message);

    await mailerSend.email.send(emailParams);
    console.log(`[EMAIL] Job notification sent to ${params.email} via MailerSend`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send job notification via MailerSend:', error.message);
    return false;
  }
}
