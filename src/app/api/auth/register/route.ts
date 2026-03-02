import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { PasswordManager } from '@/lib/password';
import { SessionManager } from '@/lib/session';

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  }
  return new ConvexHttpClient(url);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = PasswordManager.validate(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if super admin already exists
    const existingSuperAdmins = await convex.query(api.auth.listSuperAdmins);
    if (existingSuperAdmins && existingSuperAdmins.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Super Admin already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await PasswordManager.hash(password);

    // Register super admin in Convex
    const userId = await convex.mutation(api.auth.register, {
      name,
      email,
      password: hashedPassword,
    });

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await convex.mutation(api.sessions.create, {
      userId: userId.toString(),
      userRole: 'super_admin',
      sessionToken,
      ipAddress: '0.0.0.0',
      device: 'Unknown',
      browser: 'Unknown',
      os: 'Unknown',
      deviceType: 'unknown',
      expiresAt,
    });
    await SessionManager.setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Registration failed' },
      { status: 500 }
    );
  }
}
