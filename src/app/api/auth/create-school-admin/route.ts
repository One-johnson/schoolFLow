import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { SessionManager } from '@/lib/session';
import { PasswordManager } from '@/lib/password';

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
    const { name, email, schoolId, tempPassword } = body;

    if (!name || !email || !schoolId || !tempPassword) {
      return NextResponse.json(
        { success: false, message: 'Name, email, schoolId, and tempPassword are required' },
        { status: 400 }
      );
    }

    // Hash the temporary password before storing
    const hashedPassword = await PasswordManager.hash(tempPassword);

    // Create the school admin with hashed password
    const adminId = await convex.mutation(api.schoolAdmins.create, {
      name,
      email,
      schoolId,
      status: 'pending',
      invitedBy: 'super_admin',
      tempPassword: hashedPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'School Admin created successfully',
      adminId,
      schoolId,
      // Return the plain text password so it can be shown to the super admin
      tempPassword,
    });
  } catch (error) {
    console.error('Create school admin error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create school admin' },
      { status: 500 }
    );
  }
}
