import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { generateResetToken } from '@/lib/auth';
import { fallbackStore } from '@/lib/fallback-store';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { token, expires } = generateResetToken();

    let userFound = false;
    let userName = '';

    // 1. Try querying MongoDB Atlas
    try {
      await connectToDatabase();
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        userFound = true;
        userName = user.name || '';
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await user.save();
      }
    } catch (dbErr) {
      console.warn('MongoDB Atlas query failed during forgot-password, checking fallback store:', dbErr);
    }

    // 2. Check fallback store if not yet found in MongoDB
    if (!userFound) {
      const fbUser = fallbackStore.findByEmail(normalizedEmail);
      if (fbUser) {
        userFound = true;
        userName = fbUser.name;
        fallbackStore.saveUser({
          ...fbUser,
          resetPasswordToken: token,
          resetPasswordExpires: expires.toISOString(),
        });
      }
    }

    // Explicit user requirement: "if user is not regirdterd show error user not regirerted"
    if (!userFound) {
      return NextResponse.json(
        {
          error: 'User is not registered',
          details: `No account exists with email ${normalizedEmail}. Please sign up first.`,
          code: 'USER_NOT_REGISTERED',
        },
        { status: 404 }
      );
    }

    // Always mirror token into fallback store for immediate verification resiliency
    fallbackStore.saveUser({
      email: normalizedEmail,
      name: userName || normalizedEmail.split('@')[0],
      resetPasswordToken: token,
      resetPasswordExpires: expires.toISOString(),
    });

    // Determine host for reset link
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

    // Optionally send email if SMTP is configured
    if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: `"PrintStyle Support" <${process.env.GMAIL_EMAIL}>`,
          to: normalizedEmail,
          subject: 'Reset Your PrintStyle Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #4F46E5;">Password Reset Request</h2>
              <p>Hello ${userName || 'valued customer'},</p>
              <p>We received a request to reset your password for your PrintStyle account.</p>
              <p style="margin: 24px 0;">
                <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </p>
              <p style="font-size: 0.85rem; color: #64748B;">This link will expire in 1 hour. If you did not request this reset, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (mailErr) {
        console.warn('Nodemailer skipped in forgot-password:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetToken: token,
      resetUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    console.error('Error in forgot-password:', error);
    return NextResponse.json(
      { error: message || 'Failed to process forgot password request.' },
      { status: 500 }
    );
  }
}
