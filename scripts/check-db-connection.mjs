import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME || 'custom_printing_store';

console.log('Testing connection to MongoDB Atlas...');
console.log('Cluster URI:', uri ? uri.replace(/:([^:@]+)@/, ':****@') : 'NOT_FOUND');

try {
  const conn = await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 8000,
  });
  console.log('✓ Successfully connected to MongoDB Atlas!');
  console.log('  Database Name:', conn.connection.name);
  console.log('  Host:', conn.connection.host);
  console.log('  Ready State:', conn.connection.readyState);

  // Ping database
  const ping = await conn.connection.db.admin().ping();
  console.log('  Ping result:', ping);
  
  await mongoose.disconnect();
  console.log('✓ Connection closed cleanly.');
  process.exit(0);
} catch (err) {
  console.error('✗ Connection failed:', err.message);
  process.exit(1);
}
