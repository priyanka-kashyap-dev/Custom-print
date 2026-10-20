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

async function checkUsers() {
  console.log('====================================================');
  console.log('             PRINTSTYLE DATABASE USERS              ');
  console.log('====================================================\n');

  let dbUsers = [];
  let dbConnected = false;

  if (uri) {
    try {
      console.log('Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(uri, {
        dbName,
        serverSelectionTimeoutMS: 6000,
      });
      dbConnected = true;
      console.log(`✓ Connected to Database: [${conn.connection.name}]\n`);

      const collection = conn.connection.db.collection('users');
      dbUsers = await collection.find({}).toArray();

      console.log(`📊 Total Users in MongoDB Atlas: ${dbUsers.length}`);

      if (dbUsers.length > 0) {
        console.table(
          dbUsers.map((u, idx) => ({
            '#': idx + 1,
            Name: u.name || 'N/A',
            Email: u.email || 'N/A',
            Role: u.role || 'customer',
            Auth: u.googleId ? 'Google OAuth' : u.password ? 'Email/Password' : 'Google',
            'Created Date': u.createdAt ? new Date(u.createdAt).toLocaleString() : 'N/A',
            'Last Login': u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'N/A',
          }))
        );
      } else {
        console.log('   (No users found in MongoDB collection yet)');
      }

      await mongoose.disconnect();
    } catch (err) {
      console.warn('⚠️  Could not connect to MongoDB Atlas directly (IP whitelist or network):', err.message);
    }
  } else {
    console.warn('⚠️  MONGODB_URI not found in .env.local');
  }

  // Also check local fallback store
  const fallbackPath = path.resolve(process.cwd(), '.fallback_users.json');
  if (fs.existsSync(fallbackPath)) {
    try {
      const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      const fbList = Object.values(fallbackData);
      if (fbList.length > 0) {
        console.log(`\n📁 Fallback / Local Stored Users (${fbList.length}):`);
        console.table(
          fbList.map((u, idx) => ({
            '#': idx + 1,
            Name: u.name,
            Email: u.email,
            Role: u.role || 'customer',
            'Has Password': u.password ? 'Yes' : 'No',
            Created: u.createdAt || 'N/A',
          }))
        );
      }
    } catch {
      // ignore
    }
  }

  console.log('\n====================================================');
}

checkUsers().catch(console.error);
