import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME || 'custom_printing_store';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Maintain a cached connection across hot reloads in development and serverless invocations
declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB safely with connection pooling and caching.
 * Validates MONGODB_URI environment variable before attempting connection.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not defined. Please define it in your .env.local file. ' +
      'Refer to .env.example for guidance.'
    );
  }

  // Return existing connection if ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Create connection promise if not already connecting
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      dbName: DATABASE_NAME,
      maxPoolSize: 10, // Recommended for free-tier Atlas to prevent connection exhaustion
      serverSelectionTimeoutMS: 8000, // Timeout fast if IP is not whitelisted or network down
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error: unknown) {
    cached.promise = null;
    const rawMessage = error instanceof Error ? error.message : String(error);
    let message = rawMessage || 'Failed to connect to MongoDB';
    if (message.includes('bad auth') || message.includes('Authentication failed')) {
      message = 'MongoDB Authentication failed: Please verify your database username and password in MONGODB_URI.';
    } else if (message.includes('ETIMEDOUT') || message.includes('queryTxt ETIMEOUT') || message.includes('Server selection timed out')) {
      message = 'MongoDB Connection Timed Out: Please ensure network access (0.0.0.0/0 or your current IP) is whitelisted in MongoDB Atlas Network Access.';
    }
    const err = new Error(message);
    (err as Error & { originalError?: unknown }).originalError = error;
    throw err;
  }
}

/**
 * Disconnect from MongoDB (useful for test teardown and cleanup)
 */
export async function disconnectDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}
