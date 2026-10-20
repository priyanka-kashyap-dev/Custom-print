import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyGoogleIdToken, createSessionCookie, isAdminEmail } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { credential?: string };
    const { credential } = body;

    if (!credential || typeof credential !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid Google credential token.' },
        { status: 400 }
      );
    }

    // Cryptographically verify Google ID Token on the backend
    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(credential);
    } catch (verifyError: unknown) {
      const message = verifyError instanceof Error ? verifyError.message : 'Invalid token';
      console.error('Google token verification failed:', message);
      return NextResponse.json(
        {
          error: 'Google authentication failed: ' + message,
          code: 'INVALID_GOOGLE_TOKEN',
        },
        { status: 401 }
      );
    }

    const isAdmin = isAdminEmail(googleUser.email);

    // Initialize session user from cryptographically verified Google token
    let sessionUser: {
      id: string;
      email: string;
      name: string;
      role: 'customer' | 'admin';
      avatar?: string;
    } = {
      id: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
      role: isAdmin ? 'admin' : 'customer',
      avatar: googleUser.picture || '',
    };

    // Connect to MongoDB and persist user (with graceful fallback if DB access is delayed)
    try {
      await connectToDatabase();

      // Check if user already exists by googleId or email
      let user = await User.findOne({
        $or: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
      });

      if (user) {
        // Returning user - update last login and latest profile fields, preserve existing role or promote admin!
        user.lastLoginAt = new Date();
        if (isAdmin) user.role = 'admin';
        if (!user.googleId) user.googleId = googleUser.googleId;
        if (googleUser.name && user.name !== googleUser.name) user.name = googleUser.name;
        if (googleUser.picture && user.avatar !== googleUser.picture) user.avatar = googleUser.picture;
        await user.save();

        sessionUser = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: isAdmin ? 'admin' : user.role,
          avatar: user.avatar || '',
        };
      } else {
        // New user - create profile with default role (admin if pkashyap1506@gmail.com)
        user = await User.create({
          googleId: googleUser.googleId,
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture || '',
          role: isAdmin ? 'admin' : 'customer',
          lastLoginAt: new Date(),
        });

        sessionUser = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar || '',
        };
      }
    } catch (dbError: unknown) {
      console.warn('MongoDB sync deferred (database temporarily unreachable):', dbError);
    }

    // Issue secure HttpOnly session cookie
    await createSessionCookie(sessionUser);

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: sessionUser,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error during Google authentication:', error);
    return NextResponse.json(
      {
        error: message || 'Internal server error during authentication.',
        code: 'AUTH_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
