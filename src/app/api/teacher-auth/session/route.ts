import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, teacher: null },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as SessionToken;

    return NextResponse.json({
      authenticated: true,
      teacher: {
        id: decoded.data.teacherId,
        email: decoded.data.email,
        schoolId: decoded.data.schoolId,
        firstName: decoded.data.firstName,
        lastName: decoded.data.lastName,
        classIds: decoded.data.classIds,
        role: decoded.data.role,
      },
    });
  } catch (error) {
    console.error('Teacher session validation error:', error);
    return NextResponse.json(
      { authenticated: false, teacher: null },
      { status: 401 }
    );
  }
}
