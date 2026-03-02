import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { SessionManager } from '../../../../lib/session';

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
  return new ConvexHttpClient(url);
}

export async function GET(): Promise<NextResponse> {
  try {
    const token = await SessionManager.getSessionToken();
    if (!token) {
      return NextResponse.json(
        { authenticated: false, session: null },
        { status: 401 },
      );
    }

    const convex = getConvexClient();
    const data = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: token,
    });

    if (!data || data.role === 'teacher') {
      return NextResponse.json(
        { authenticated: false, session: null },
        { status: 401 },
      );
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: data.userId,
        email: data.email,
        role: data.role,
        schoolId: 'schoolId' in data ? data.schoolId : undefined,
        adminRole: 'adminRole' in data ? data.adminRole : undefined,
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { authenticated: false, session: null },
      { status: 401 },
    );
  }
}
