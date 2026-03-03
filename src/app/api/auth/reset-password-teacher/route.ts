import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { SessionManager } from '@/lib/session';
import { PasswordManager } from '@/lib/password';
import type { Id } from '../../../../../convex/_generated/dataModel';

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  }
  return new ConvexHttpClient(url);
}

function generateTempPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  const remainingLength = Math.floor(Math.random() * 5) + 4;
  for (let i = 0; i < remainingLength; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();

  try {
    const token = await SessionManager.getSessionToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }
    const session = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: token,
    });
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teacherId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const teacher = await convex.query(api.teachers.getTeacherById, {
      teacherId: teacherId as Id<'teachers'>,
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Teacher not found' },
        { status: 404 }
      );
    }

    const tempPassword = generateTempPassword();
    const hashedTempPassword = await PasswordManager.hash(tempPassword);

    await convex.mutation(api.teachers.updateTeacherPassword, {
      teacherId: teacherId as Id<'teachers'>,
      hashedPassword: hashedTempPassword,
    });

    await convex.mutation(api.auditLogs.create, {
      userId: session.userId,
      userName: session.email,
      action: 'Reset Teacher Password',
      entity: 'Teacher',
      entityId: teacher.email,
      details: `Password reset for ${teacher.firstName} ${teacher.lastName} (${teacher.email})`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      userName: `${teacher.firstName} ${teacher.lastName}`,
      userEmail: teacher.email,
      tempPassword,
    });
  } catch (error) {
    console.error('Teacher password reset error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
