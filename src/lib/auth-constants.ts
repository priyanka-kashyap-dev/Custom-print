/**
 * Central authentication constants and utilities for admin access.
 * Safe for use in both Client and Server Components.
 */

export const ADMIN_EMAILS: readonly string[] = [
  'pkashyap1506@gmail.com',
  'shubhamrajvanshi2001@gmail.com',
  'customprintshelp@gmail.com',
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();

  // Check static list
  if (ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalized)) {
    return true;
  }

  // Check process.env.ADMIN_EMAIL if present (supports comma-separated emails)
  if (typeof process !== 'undefined' && process.env?.ADMIN_EMAIL) {
    const envAdmins = process.env.ADMIN_EMAIL.split(',').map((e) => e.toLowerCase().trim());
    if (envAdmins.includes(normalized)) {
      return true;
    }
  }

  return false;
}
