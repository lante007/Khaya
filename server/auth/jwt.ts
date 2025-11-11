/**
 * JWT Authentication System
 * Handles token generation, verification, and user sessions
 */

import { SignJWT, jwtVerify } from 'jose';
import { nanoid } from 'nanoid';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export type UserRole = 'buyer' | 'worker' | 'supplier' | 'admin';

export interface JWTPayload {
  userId: number;
  email: string;
  phone: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for authenticated user
 */
export async function generateToken(user: {
  id: number;
  email?: string;
  phone: string;
  role: UserRole;
}): Promise<string> {
  const sessionId = nanoid();
  
  const token = await new SignJWT({
    userId: user.id,
    email: user.email || '',
    phone: user.phone,
    role: user.role,
    sessionId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7 days
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Generate refresh token (longer expiry)
 */
export async function generateRefreshToken(userId: number): Promise<string> {
  const token = await new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30 days
    .sign(JWT_SECRET);

  return token;
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Generate OTP for phone verification
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash password (for email/password auth)
 */
export async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or argon2
  // For now, simple implementation
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
