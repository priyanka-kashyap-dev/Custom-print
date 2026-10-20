import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  const startTime = Date.now();
  try {
    const conn = await connectToDatabase();
    const pingStart = Date.now();
    
    // Perform a quick ping command to Atlas
    const adminDb = conn.connection.db?.admin();
    await adminDb?.ping();
    const pingMs = Date.now() - pingStart;

    return NextResponse.json({
      status: 'connected',
      database: conn.connection.name,
      host: conn.connection.host,
      readyState: conn.connection.readyState,
      pingMs,
      totalDurationMs: Date.now() - startTime,
      message: 'MongoDB Atlas connection established and operational.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database connection error';
    return NextResponse.json(
      {
        status: 'disconnected',
        error: message,
        readyState: mongoose.connection.readyState,
        totalDurationMs: Date.now() - startTime,
        help: [
          'Verify that MONGODB_URI is correctly placed in .env.local',
          'Ensure your MongoDB Atlas user password is accurate (escape special characters like @, #, $ if needed)',
          'Ensure Network Access in MongoDB Atlas allows 0.0.0.0/0 (or your local IP address)',
        ],
      },
      { status: 503 }
    );
  }
}
