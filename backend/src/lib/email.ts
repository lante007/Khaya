/**
 * Email Integration
 * AWS SES email sending
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { config } from '../config/aws.js';

const ses = new SESClient({ region: config.region });

/**
 * Send OTP via email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const command = new SendEmailCommand({
      Source: 'Amanda@projectkhaya.co.za', // Verified sender
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Your Project Khaya Verification Code',
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: `Your Project Khaya verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Project Khaya Team
https://projectkhaya.co.za`,
            Charset: 'UTF-8'
          },
          Html: {
            Data: `<!DOCTYPE html>
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
</html>`,
            Charset: 'UTF-8'
          }
        }
      }
    });

    const response = await ses.send(command);
    
    console.log(`[EMAIL] OTP sent to ${email}: ${response.MessageId}`);
    
    return {
      success: true,
      messageId: response.MessageId
    };
  } catch (error: any) {
    console.error('[EMAIL] Failed to send OTP:', error.message);
    
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
    const command = new SendEmailCommand({
      Source: 'Amanda@projectkhaya.co.za',
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Welcome to Project Khaya!',
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: `Hi ${name},

Welcome to Project Khaya! We're excited to have you join our community.

Project Khaya connects skilled workers with clients who need their services. Whether you're looking to hire or offer your skills, we're here to help.

Get started:
- Complete your profile
- Browse available jobs
- Connect with clients or workers

If you have any questions, feel free to reach out to us at Amanda@projectkhaya.co.za

Best regards,
Amanda & The Project Khaya Team
https://projectkhaya.co.za`,
            Charset: 'UTF-8'
          }
        }
      }
    });

    await ses.send(command);
    console.log(`[EMAIL] Welcome email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send welcome email:', error.message);
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
    const command = new SendEmailCommand({
      Source: 'Amanda@projectkhaya.co.za',
      Destination: {
        ToAddresses: [params.email]
      },
      Message: {
        Subject: {
          Data: `Project Khaya: ${params.jobTitle}`,
          Charset: 'UTF-8'
        },
        Body: {
          Text: {
            Data: params.message,
            Charset: 'UTF-8'
          }
        }
      }
    });

    await ses.send(command);
    console.log(`[EMAIL] Job notification sent to ${params.email}`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send job notification:', error.message);
    return false;
  }
}
