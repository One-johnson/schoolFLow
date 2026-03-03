import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
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
    const token = await SessionManager.getSessionToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
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
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json(
        { success: false, message: 'Email and role are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (role === 'school-admin') {
      const admin = await convex.query(api.schoolAdmins.getByEmail, {
        email: normalizedEmail,
      });
      if (!admin) {
        return NextResponse.json({ success: false, found: false, message: 'School admin not found' });
      }
      return NextResponse.json({
        success: true,
        found: true,
        role: 'school-admin',
        userId: admin._id,
        userName: admin.name,
        userEmail: admin.email,
      });
    }

    if (role === 'teacher') {
      const teacher = await convex.query(api.teachers.getTeacherByEmail, {
        email: normalizedEmail,
      });
      if (!teacher) {
        return NextResponse.json({ success: false, found: false, message: 'Teacher not found' });
      }
      return NextResponse.json({
        success: true,
        found: true,
        role: 'teacher',
        userId: teacher._id,
        userName: `${teacher.firstName} ${teacher.lastName}`,
        userEmail: teacher.email,
      });
    }

    if (role === 'super-admin') {
      const admin = await convex.query(api.superAdmins.getByEmail, {
        email: normalizedEmail,
      });
      if (!admin) {
        return NextResponse.json({ success: false, found: false, message: 'Super admin not found' });
      }
      return NextResponse.json({
        success: true,
        found: true,
        role: 'super-admin',
        userId: admin._id,
        userName: admin.name,
        userEmail: admin.email,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid role. Use school-admin, teacher, or super-admin' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Lookup user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to lookup user' },
      { status: 500 }
    );
  }
}
