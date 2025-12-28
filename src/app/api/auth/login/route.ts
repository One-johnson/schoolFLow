import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { PasswordManager } from '@/lib/password';
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
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Try Super Admin login first
    const superAdmins = await convex.query(api.auth.listSuperAdmins);
    const superAdmin = superAdmins?.find((admin) => admin.email === email);

    if (superAdmin) {
      const isValidPassword = await PasswordManager.verify(password, superAdmin.password);
      
      if (isValidPassword) {
        // Update last login
        await convex.mutation(api.auth.updateLastLogin, { email });

        // Create session
        await SessionManager.createSession({
          userId: superAdmin._id.toString(),
          email: superAdmin.email,
          role: 'super_admin',
        });

        return NextResponse.json({
          success: true,
          message: 'Login successful',
          role: 'super_admin',
          redirectTo: '/super-admin',
        });
      }
    }

    // Try School Admin login
    const schoolAdmins = await convex.query(api.schoolAdmins.list);
    const schoolAdmin = schoolAdmins?.find(
      (admin) => admin.schoolId === email || admin.email === email
    );

    if (schoolAdmin) {
      let isValidPassword = false;

      // Check hashed password first
      if (schoolAdmin.password) {
        isValidPassword = await PasswordManager.verify(password, schoolAdmin.password);
      }

      // Fallback to tempPassword (plain text for backward compatibility)
      if (!isValidPassword && schoolAdmin.tempPassword === password) {
        isValidPassword = true;
        
        // Hash the temp password and save it as the permanent password
        const hashedPassword = await PasswordManager.hash(password);
        await convex.mutation(api.schoolAdmins.updatePassword, {
          email: schoolAdmin.email,
          password: hashedPassword,
        });
      }

      if (isValidPassword) {
        // Check account status
        if (schoolAdmin.status === 'inactive') {
          return NextResponse.json(
            { success: false, message: 'Your account has been deactivated. Please contact support.' },
            { status: 403 }
          );
        }

        if (schoolAdmin.status === 'suspended') {
          return NextResponse.json(
            { success: false, message: 'Your account has been suspended. Your trial may have expired.' },
            { status: 403 }
          );
        }

        // Create session
        await SessionManager.createSession({
          userId: schoolAdmin._id.toString(),
          email: schoolAdmin.email,
          role: 'school_admin',
          schoolId: schoolAdmin.schoolId,
        });

        return NextResponse.json({
          success: true,
          message: 'Login successful',
          role: 'school_admin',
          redirectTo: '/school-admin',
        });
      }
    }

    // No matching credentials
    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
