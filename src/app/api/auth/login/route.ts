import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, createSessionCookie } from '@/lib/auth';
import { fallbackStore } from '@/lib/fallback-store';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    let userFound = false;
    let storedPassword = '';
    let sessionUser: {
      id: string;
      email: string;
      name: string;
      role: 'customer' | 'admin';
      avatar: string;
    } | null = null;

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const user = await User.findOne({ email: normalizedEmail }).select('+password');
      if (user) {
        userFound = true;
        storedPassword = user.password || '';
        sessionUser = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar || '',
        };
        user.lastLoginAt = new Date();
        await user.save();
      }
    } catch (dbErr) {
      console.warn('MongoDB Atlas query failed during login, checking fallback store:', dbErr);
    }

    // 2. Check fallback store
    if (!userFound) {
      const fbUser = fallbackStore.findByEmail(normalizedEmail);
      if (fbUser) {
        userFound = true;
        storedPassword = fbUser.password || '';
        sessionUser = {
          id: fbUser.id,
          email: fbUser.email,
          name: fbUser.name,
          role: fbUser.role,
          avatar: fbUser.avatar || '',
        };
      }
    }

    if (!userFound) {
      return NextResponse.json(
        { error: 'User is not registered. Please sign up first.', code: 'USER_NOT_REGISTERED' },
        { status: 404 }
      );
    }

    if (!storedPassword) {
      return NextResponse.json(
        {
          error: 'This account was registered with Google Sign-In. Please click "Continue with Google" or use "Forgot Password?" to set a password.',
          code: 'GOOGLE_AUTH_ACCOUNT',
        },
        { status: 400 }
      );
    }

    const isMatch = verifyPassword(password, storedPassword);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid password. Please check your credentials or reset your password.' },
        { status: 401 }
      );
    }

    if (sessionUser) {
      await createSessionCookie(sessionUser);
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: sessionUser,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Error in email login:', error);
    return NextResponse.json(
      { error: message || 'Failed to sign in.' },
      { status: 500 }
    );
  }
}
