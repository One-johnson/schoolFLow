import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

interface TokenData {
  teacherId: string;
  email: string;
  schoolId: string;
  role: 'teacher';
}

interface SessionToken {
  data: TokenData;
  exp: number;
  iat: number;
}

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  }
  return new ConvexHttpClient(url);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, teacher: null, reason: 'no_token' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as SessionToken;
    const { teacherId, email, schoolId } = decoded.data;

    // Fetch full teacher data from database
    const convex = getConvexClient();
    const teacher = await convex.query(api.teachers.getTeacherByEmail, { email });

    if (!teacher) {
      return NextResponse.json(
        { authenticated: false, teacher: null, reason: 'teacher_not_found' },
        { status: 401 }
      );
    }

    // Get teacher's classes
    const classes = await convex.query(api.teachers.getTeacherClasses, { teacherId: teacher._id });
    const classIds = classes.map((c) => c._id);
    const classNames = classes.map((c) => c.className);

    return NextResponse.json({
      authenticated: true,
      teacher: {
        id: teacherId,
        email: teacher.email,
        schoolId: schoolId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        classIds,
        classNames,
        photoUrl: teacher.photoUrl,
        role: 'teacher',
      },
    });
  } catch (error) {
    console.error('Teacher session validation error:', error);
    return NextResponse.json(
      { authenticated: false, teacher: null, reason: 'invalid_token' },
      { status: 401 }
    );
  }
}
