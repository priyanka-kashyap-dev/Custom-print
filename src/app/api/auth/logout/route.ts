import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to logout';
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
