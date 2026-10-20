import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';

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

/**
 * Encrypt a user session payload into a signed JWT.
 */
export async function encryptSession(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
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
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: (payload.role as 'customer' | 'admin') || 'customer',
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
