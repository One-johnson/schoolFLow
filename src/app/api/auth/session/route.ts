import { NextResponse } from 'next/server';
import { SessionManager } from '../../../../lib/session';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await SessionManager.getSession();
    
    if (!session) {
      return NextResponse.json(
        { authenticated: false, session: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: session.userId,
        email: session.email,
        role: session.role,
        schoolId: session.schoolId,
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { authenticated: false, session: null },
      { status: 401 }
    );
  }
}
