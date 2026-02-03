import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { PasswordManager } from '@/lib/password';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SESSION_COOKIE_NAME = 'schoolflow_teacher_session';
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

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
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get teacher by email
    const teacher = await convex.query(api.teachers.getTeacherByEmail, { email });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check account status
    if (teacher.status === 'inactive') {
      return NextResponse.json(
        { success: false, message: 'Your account has been deactivated. Please contact your school administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await PasswordManager.verify(password, teacher.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get teacher's classes
    const classes = await convex.query(api.teachers.getTeacherClasses, { teacherId: teacher._id });
    const classIds = classes.map((c) => c._id);
    const classNames = classes.map((c) => c.className);

    // Create session token with minimal data (to avoid large headers)
    const sessionData = {
      teacherId: teacher._id,
      email: teacher.email,
      schoolId: teacher.schoolId,
      role: 'teacher' as const,
    };

    const token = jwt.sign(
      { data: sessionData },
      JWT_SECRET,
      { expiresIn: SESSION_DURATION }
    );

    console.log('Login successful for:', email);

    // Return token in response body - client will store in localStorage
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token, // Include token for localStorage storage
      teacher: {
        id: teacher._id,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        schoolId: teacher.schoolId,
        classIds,
        classNames,
        photoUrl: teacher.photoUrl,
      },
      redirectTo: '/teacher',
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
