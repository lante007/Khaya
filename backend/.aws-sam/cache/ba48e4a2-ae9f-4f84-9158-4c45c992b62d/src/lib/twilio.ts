/**
 * Twilio Integration
 * WhatsApp and SMS OTP delivery
 */

import twilio from 'twilio';
import { config } from '../config/aws.js';

const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

/**
 * Send OTP via WhatsApp
 */
export async function sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
  try {
    // Format phone number for WhatsApp (must start with whatsapp:)
    const whatsappNumber = `whatsapp:${phone}`;
    const fromNumber = `whatsapp:${config.twilioWhatsAppNumber}`;
    
    const message = await client.messages.create({
      body: `Your Project Khaya verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this message.`,
      from: fromNumber,
      to: whatsappNumber
    });
    
    console.log(`WhatsApp OTP sent: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('WhatsApp OTP error:', error);
    return false;
  }
}

/**
 * Send OTP via SMS (fallback)
 */
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  try {
    const message = await client.messages.create({
      body: `Your Project Khaya verification code is: ${otp}. Valid for 10 minutes.`,
      from: config.twilioWhatsAppNumber.replace('whatsapp:', ''),
      to: phone
    });
    
    console.log(`SMS OTP sent: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('SMS OTP error:', error);
    return false;
  }
}

/**
 * Send OTP with automatic fallback
 * Tries WhatsApp first, falls back to SMS
 */
export async function sendOTP(phone: string, otp: string): Promise<{
  success: boolean;
  method: 'whatsapp' | 'sms' | 'failed';
}> {
  // Try WhatsApp first
  const whatsappSuccess = await sendWhatsAppOTP(phone, otp);
  if (whatsappSuccess) {
    return { success: true, method: 'whatsapp' };
  }
  
  // Fallback to SMS
  const smsSuccess = await sendSMSOTP(phone, otp);
  if (smsSuccess) {
    return { success: true, method: 'sms' };
  }
  
  return { success: false, method: 'failed' };
}

/**
 * Generate 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate phone number format (South African)
 */
export function validatePhoneNumber(phone: string): boolean {
  // Accepts: +27XXXXXXXXX or 0XXXXXXXXX
  const regex = /^(\+27|0)[6-8][0-9]{8}$/;
  return regex.test(phone);
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove spaces and dashes
  phone = phone.replace(/[\s-]/g, '');
  
  // Convert 0XXXXXXXXX to +27XXXXXXXXX
  if (phone.startsWith('0')) {
    return `+27${phone.substring(1)}`;
  }
  
  // Already in +27 format
  if (phone.startsWith('+27')) {
    return phone;
  }
  
  // Add +27 prefix
  return `+27${phone}`;
}

/**
 * Send job notification SMS
 */
export async function sendJobNotification(params: {
  phone: string;
  message: string;
}): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneNumber(params.phone);
    
    const message = await client.messages.create({
      body: params.message,
      from: config.twilioWhatsAppNumber.replace('whatsapp:', ''),
      to: formattedPhone
    });
    
    console.log(`Job notification sent: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Job notification error:', error);
    return false;
  }
}
