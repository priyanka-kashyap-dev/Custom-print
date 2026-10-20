import fs from 'fs';
import path from 'path';

export interface FallbackUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'customer' | 'admin';
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  createdAt: string;
}

const FALLBACK_FILE = path.resolve(process.cwd(), '.fallback_users.json');

function readStore(): Record<string, FallbackUser> {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch {
    // ignore read error
  }
  return {};
}

function writeStore(store: Record<string, FallbackUser>) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // ignore write error
  }
}

export const fallbackStore = {
  findByEmail(email: string): FallbackUser | null {
    const store = readStore();
    return store[email.toLowerCase().trim()] || null;
  },

  findByResetToken(token: string): FallbackUser | null {
    const store = readStore();
    for (const u of Object.values(store)) {
      if (u.resetPasswordToken === token) {
        if (u.resetPasswordExpires && new Date(u.resetPasswordExpires) > new Date()) {
          return u;
        }
      }
    }
    return null;
  },

  saveUser(user: Partial<FallbackUser> & { email: string; name: string }): FallbackUser {
    const store = readStore();
    const key = user.email.toLowerCase().trim();
    const existing = store[key] || {
      id: 'usr_' + Date.now().toString(36),
      name: user.name,
      email: key,
      role: 'customer',
      createdAt: new Date().toISOString(),
    };

    const updated: FallbackUser = {
      ...existing,
      ...user,
      email: key,
    };

    store[key] = updated;
    writeStore(store);
    return updated;
  },

  updatePassword(email: string, hashedPassword: string): boolean {
    const store = readStore();
    const key = email.toLowerCase().trim();
    if (store[key]) {
      store[key].password = hashedPassword;
      delete store[key].resetPasswordToken;
      delete store[key].resetPasswordExpires;
      writeStore(store);
      return true;
    }
    return false;
  },
};
