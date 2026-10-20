import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword, createSessionCookie } from '@/lib/auth';
import { fallbackStore } from '@/lib/fallback-store';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = hashPassword(password);

    let registeredUser: {
      id: string;
      name: string;
      email: string;
      role: 'customer' | 'admin';
      avatar?: string;
    } = {
      id: 'usr_' + Date.now().toString(36),
      name: name.trim(),
      email: normalizedEmail,
      role: 'customer',
      avatar: '',
    };

    // 1. Try persisting to MongoDB Atlas
    try {
      await connectToDatabase();
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in or use Forgot Password.' },
          { status: 409 }
        );
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'customer',
        lastLoginAt: new Date(),
      });

      registeredUser = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar || '',
      };
    } catch (dbErr) {
      console.warn('MongoDB Atlas query failed during register, saving to fallback store:', dbErr);
    }

    // 2. Also save to fallback store for immediate access
    fallbackStore.saveUser({
      id: registeredUser.id,
      name: registeredUser.name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'customer',
      avatar: '',
    });

    await createSessionCookie(registeredUser);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: registeredUser,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Error in register:', error);
    return NextResponse.json(
      { error: message || 'Failed to create account.' },
      { status: 500 }
    );
  }
}
