import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { PasswordManager } from '@/lib/password';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

function getConvexClient(): ConvexHttpClient {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error('NEXT_PUBLIC_CONVEX_URL is not set');
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await SessionManager.getSessionToken();
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const convex = getConvexClient();
    const session = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: token,
    });
    if (!session || session.role === 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const sessionData = {
      userId: session.userId,
      email: session.email,
      role: session.role,
      schoolId: 'schoolId' in session ? session.schoolId : undefined,
      adminRole: 'adminRole' in session ? session.adminRole : undefined,
    };

    const body = await request.json();
    const { currentPassword, newPassword, role } = body;

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

    if (role === 'super_admin' || sessionData.role === 'super_admin') {
      // Handle Super Admin password change
      const superAdmins = await convex.query(api.auth.listSuperAdmins);
      const currentUser = superAdmins.find((admin) => admin.email === sessionData.email);

      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Verify current password
      const isValidPassword = await PasswordManager.verify(currentPassword, currentUser.password);
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedNewPassword = await PasswordManager.hash(newPassword);

      // Update password in database
      await convex.mutation(api.auth.changePassword, {
        email: sessionData.email,
        oldPassword: currentUser.password, // Pass the hashed password for verification
        newPassword: hashedNewPassword,
      });

      return NextResponse.json({ 
        success: true,
        message: 'Password changed successfully'
      });

    } else if (role === 'school_admin' || sessionData.role === 'school_admin') {
      // Handle School Admin password change
      const schoolAdmins = await convex.query(api.schoolAdmins.list);
      const currentUser = schoolAdmins.find((admin) => admin.email === sessionData.email);

      if (!currentUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Verify current password (could be temp password or regular password)
      let isValidPassword = false;

      if (currentUser.password) {
        isValidPassword = await PasswordManager.verify(currentPassword, currentUser.password);
      }

      // If no match with regular password, try temp password (now hashed)
      if (!isValidPassword && currentUser.tempPassword) {
        isValidPassword = await PasswordManager.verify(currentPassword, currentUser.tempPassword);
      }

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedNewPassword = await PasswordManager.hash(newPassword);

      // Update password in database
      await convex.mutation(api.schoolAdmins.updatePassword, {
        email: sessionData.email,
        password: hashedNewPassword,
      });

      return NextResponse.json({ 
        success: true,
        message: 'Password changed successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid role' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change password' },
      { status: 500 }
    );
  }
}
