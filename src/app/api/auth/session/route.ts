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

    if (
      !data ||
      data.role === 'teacher' ||
      data.role === 'parent' ||
      data.role === 'student'
    ) {
      return NextResponse.json(
        { authenticated: false, session: null },
        { status: 401 },
      );
    }

    // Hard lock enforcement for admin portals.
    if (data.role === "super_admin") {
      const superAdmin = await convex.query(api.superAdmins.getByEmail, {
        email: data.email,
      });
      if (!superAdmin) {
        await SessionManager.clearSession();
        return NextResponse.json(
          { authenticated: false, session: null },
          { status: 401 },
        );
      }
      if (superAdmin.status === "suspended") {
        await SessionManager.clearSession();
        return NextResponse.json(
          {
            authenticated: false,
            session: null,
            code: "ACCOUNT_SUSPENDED",
            message:
              "Your super admin account is suspended. Please contact the system owner.",
          },
          { status: 403 },
        );
      }
    }

    if (data.role === "school_admin" && "schoolId" in data && data.schoolId) {
      const school = await convex.query(api.schools.getBySchoolId, {
        schoolId: data.schoolId,
      });
      if (school?.status === "suspended") {
        await SessionManager.clearSession();
        return NextResponse.json(
          {
            authenticated: false,
            session: null,
            code: "SCHOOL_SUSPENDED",
            message:
              "Your school is currently suspended. The admin portal is locked until the school is reactivated.",
          },
          { status: 403 },
        );
      }
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
