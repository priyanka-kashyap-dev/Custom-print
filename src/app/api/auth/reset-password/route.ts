import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { fallbackStore } from '@/lib/fallback-store';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      token?: string;
      newPassword?: string;
    };
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing password reset token.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(newPassword);
    let resetDone = false;

    // 1. Try finding and updating in MongoDB Atlas
    try {
      await connectToDatabase();
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (user) {
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        resetDone = true;

        // Also update fallback store
        fallbackStore.updatePassword(user.email, hashedPassword);
      }
    } catch (dbErr) {
      console.warn('MongoDB Atlas query failed during reset-password, checking fallback store:', dbErr);
    }

    // 2. If not reset via MongoDB, try fallback store
    if (!resetDone) {
      const fbUser = fallbackStore.findByResetToken(token);
      if (fbUser) {
        fallbackStore.updatePassword(fbUser.email, hashedPassword);
        resetDone = true;
      }
    }

    if (!resetDone) {
      return NextResponse.json(
        {
          error: 'This password reset link is invalid or has expired. Please request a new one.',
          code: 'TOKEN_EXPIRED_OR_INVALID',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Error in reset-password:', error);
    return NextResponse.json(
      { error: message || 'Failed to reset password.' },
      { status: 500 }
    );
  }
}
