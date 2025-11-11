/**
 * Email Service for OTP delivery
 * Free alternative to Twilio - uses Gmail SMTP
 */

import nodemailer from 'nodemailer';

// Create transporter (using Gmail for simplicity)
// In production, you can use any SMTP service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreply@projectkhaya.co.za',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

/**
 * Send OTP via email
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: {
        name: 'Project Khaya',
        address: process.env.EMAIL_USER || 'noreply@projectkhaya.co.za'
      },
      to: email,
      subject: 'Your Project Khaya Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B4513 0%, #FF8C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #8B4513; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #8B4513; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Project Khaya</h1>
              <p>Your Trusted Construction Marketplace</p>
            </div>
            <div class="content">
              <h2>Verification Code</h2>
              <p>Hello!</p>
              <p>Your verification code for Project Khaya is:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This code expires in <strong>10 minutes</strong></li>
                  <li>Never share this code with anyone</li>
                  <li>Project Khaya will never ask for this code</li>
                </ul>
              </div>
              
              <p>If you didn't request this code, please ignore this email.</p>
              
              <p style="margin-top: 30px;">
                <strong>Welcome to Project Khaya!</strong><br>
                <em>"Umuntu ngumuntu ngabantu" - A person is a person through other people</em>
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Project Khaya. Building community, one home at a time.</p>
              <p>Estcourt, KwaZulu-Natal, South Africa</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Your Project Khaya Verification Code

Your verification code is: ${otp}

This code expires in 10 minutes.

Security Notice:
- Never share this code with anyone
- Project Khaya will never ask for this code
- If you didn't request this code, please ignore this email

Welcome to Project Khaya!
"Umuntu ngumuntu ngabantu" - A person is a person through other people

© 2025 Project Khaya
Estcourt, KwaZulu-Natal, South Africa
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(email: string, name: string, role: string): Promise<boolean> {
  try {
    const roleMessages = {
      buyer: 'Start posting jobs and finding trusted workers!',
      worker: 'Complete your profile and start bidding on jobs!',
      supplier: 'List your materials and reach more customers!',
      admin: 'Welcome to the Scout team! Help us build trust.'
    };

    const mailOptions = {
      from: {
        name: 'Project Khaya',
        address: process.env.EMAIL_USER || 'noreply@projectkhaya.co.za'
      },
      to: email,
      subject: 'Welcome to Project Khaya! 🏠',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8B4513 0%, #FF8C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .cta-button { display: inline-block; background: #8B4513; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Welcome to Project Khaya!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}! 👋</h2>
              <p>Thank you for joining Project Khaya, your trusted construction marketplace for KZN.</p>
              
              <p><strong>${roleMessages[role as keyof typeof roleMessages]}</strong></p>
              
              <div style="text-align: center;">
                <a href="https://projectkhaya.co.za/dashboard" class="cta-button">Go to Dashboard</a>
              </div>
              
              <h3>What's Next?</h3>
              <ul>
                ${role === 'buyer' ? `
                  <li>Post your first job</li>
                  <li>Browse workers and materials</li>
                  <li>Get competitive quotes</li>
                ` : role === 'worker' || role === 'supplier' ? `
                  <li>Complete your profile</li>
                  <li>Upload portfolio/products</li>
                  <li>Start receiving opportunities</li>
                ` : `
                  <li>Review pending verifications</li>
                  <li>Help build community trust</li>
                  <li>Moderate content</li>
                `}
              </ul>
              
              <p style="margin-top: 30px;">
                <em>"Umuntu ngumuntu ngabantu" - A person is a person through other people</em>
              </p>
              
              <p>Need help? Visit our <a href="https://projectkhaya.co.za/help">Help Center</a> or <a href="https://projectkhaya.co.za/contact">Contact Us</a>.</p>
            </div>
            <div class="footer">
              <p>© 2025 Project Khaya. Building community, one home at a time.</p>
              <p>Estcourt, KwaZulu-Natal, South Africa</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
