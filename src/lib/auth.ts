import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';
  avatar?: string;
}

const COOKIE_NAME = 'auth_session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// Secure session secret validation with safe development fallback
const rawSecret = process.env.SESSION_SECRET || 'dev_secret_only_change_in_production_min_32_characters_long_key!';
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET && process.env.NEXT_PHASE !== 'phase-production-build') {
  console.warn('[Security Notice] SESSION_SECRET is not set in production. Please set SESSION_SECRET in your environment variables.');
}

const secretKey = new TextEncoder().encode(rawSecret);

// Google OAuth client for backend ID token verification
const googleOAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'pkashyap1506@gmail.com').toLowerCase().trim();

export function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL;
}

/**
 * Encrypt a user session payload into a signed JWT.
 */
export async function encryptSession(payload: SessionUser): Promise<string> {
  const role = isAdminEmail(payload.email) ? 'admin' : payload.role || 'customer';
  return new SignJWT({ ...payload, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

/**
 * Decrypt and cryptographically verify a JWT session string.
 */
export async function decryptSession(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });
    const email = payload.email as string;
    const role = isAdminEmail(email) ? 'admin' : ((payload.role as 'customer' | 'admin') || 'customer');
    return {
      id: payload.id as string,
      email,
      name: payload.name as string,
      role,
      avatar: payload.avatar as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Creates and sets a secure HttpOnly session cookie on the server.
 */
export async function createSessionCookie(user: SessionUser): Promise<void> {
  const token = await encryptSession(user);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION,
  });
}

/**
 * Reads and verifies the current session from server-side cookies.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) {
    return null;
  }
  return decryptSession(sessionCookie.value);
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Verifies a Google ID Token on the backend using Google's official OAuth2Client.
 * This guarantees the token was issued by Google and intended for this application.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<{
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      'GOOGLE_CLIENT_ID is not configured in environment variables. ' +
      'Please add GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local.'
    );
  }

  const ticket = await googleOAuthClient.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Invalid Google token: No payload returned from Google.');
  }

  if (!payload.sub || !payload.email) {
    throw new Error('Invalid Google token: Missing subject identifier or email.');
  }

  if (!payload.email_verified) {
    throw new Error('Google email is not verified.');
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture,
  };
}

/**
 * Hashes a plaintext password using crypto scrypt with random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a salt:hash string using constant-time comparison.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically random password reset token and 1-hour expiration date.
 */
export function generateResetToken(): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity
  return { token, expires };
}
