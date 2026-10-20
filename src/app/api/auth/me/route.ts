import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    // Refresh user role & data from MongoDB if connection is available
    try {
      await connectToDatabase();
      const freshUser = await User.findById(session.id).select('email name role avatar');
      if (freshUser) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: freshUser._id.toString(),
            email: freshUser.email,
            name: freshUser.name,
            role: freshUser.role,
            avatar: freshUser.avatar,
          },
        });
      }
    } catch {
      // If DB read has a transient issue, fallback to valid session cookie payload
    }

    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching session user:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: message },
      { status: 500 }
    );
  }
}
