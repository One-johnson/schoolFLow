import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { SessionManager } from '@/lib/session';
import type { Id } from '../../../../../convex/_generated/dataModel';

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  }
  return new ConvexHttpClient(url);
}

// Generate secure temporary password
function generateTempPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  
  // Ensure password meets requirements
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining characters (8-12 total length)
  const remainingLength = Math.floor(Math.random() * 5) + 4; // 4-8 more chars
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();
  
  try {
    // Verify Super Admin session
    const session = await SessionManager.getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { adminId } = body;

    if (!adminId) {
      return NextResponse.json(
        { success: false, message: 'School Admin ID is required' },
        { status: 400 }
      );
    }

    // Get the school admin
    const schoolAdmin = await convex.query(api.schoolAdmins.getById, {
      id: adminId as Id<'schoolAdmins'>,
    });

    if (!schoolAdmin) {
      return NextResponse.json(
        { success: false, message: 'School Admin not found' },
        { status: 404 }
      );
    }

    // Generate new temporary password
    const tempPassword = generateTempPassword();

    // Reset the password (this will set tempPassword and clear password)
    await convex.mutation(api.schoolAdmins.resetPassword, {
      id: adminId as Id<'schoolAdmins'>,
      tempPassword,
    });

    // Create audit log
    await convex.mutation(api.auditLogs.create, {
      userId: session.userId,
      userName: session.email,
      action: 'Reset School Admin Password',
      entity: 'SchoolAdmin',
      entityId: schoolAdmin.email,
      details: `Password reset for ${schoolAdmin.name} (${schoolAdmin.email})`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      tempPassword,
      adminName: schoolAdmin.name,
      adminEmail: schoolAdmin.email,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
