import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { PasswordManager } from '@/lib/password';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import type { Id } from '../../../../../convex/_generated/dataModel';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SESSION_COOKIE_NAME = 'schoolflow_teacher_session';

interface TeacherSessionData {
  teacherId: string;
  email: string;
  schoolId: string;
  role: 'teacher';
  firstName: string;
  lastName: string;
  classIds: string[];
}

interface SessionToken {
  data: TeacherSessionData;
  exp: number;
  iat: number;
}

function getConvexClient(): ConvexHttpClient {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not set');
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get session
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let sessionData: TeacherSessionData;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as SessionToken;
      sessionData = decoded.data;
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Validate new password
    const validation = PasswordManager.validate(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      );
    }

    const convex = getConvexClient();

    // Get teacher's current password
    const teacher = await convex.query(api.teachers.getTeacherByEmail, {
      email: sessionData.email,
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await PasswordManager.verify(currentPassword, teacher.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await PasswordManager.hash(newPassword);

    // Update password in database
    await convex.mutation(api.teachers.updateTeacherPassword, {
      teacherId: teacher._id as Id<'teachers'>,
      hashedPassword: hashedNewPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Teacher password change error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change password' },
      { status: 500 }
    );
  }
}
