import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { PasswordManager } from '@/lib/password';
import { SessionManager } from '@/lib/session';
import { extractIpAddress } from '@/lib/ip-utils';
import { parseUserAgent } from '@/lib/device-parser';

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

    // Extract IP and device information
    const ipAddress = extractIpAddress(request.headers);
    const userAgent = request.headers.get('user-agent') || '';
    const deviceInfo = parseUserAgent(userAgent);

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
      // Check account status
      if (superAdmin.status === 'suspended') {
        return NextResponse.json(
          { success: false, message: 'Your account has been suspended. Please contact the system administrator.' },
          { status: 403 }
        );
      }

      const isValidPassword = await PasswordManager.verify(password, superAdmin.password);
      
      if (isValidPassword) {
        // Update last login
        await convex.mutation(api.auth.updateLastLogin, { email });

        // Generate session token
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

        // Create session with role information
        await SessionManager.createSession({
          userId: superAdmin._id.toString(),
          email: superAdmin.email,
          role: 'super_admin',
          adminRole: superAdmin.role, // Include owner/admin/moderator role
        });

        // Track login in history
        await convex.mutation(api.loginHistory.create, {
          userId: superAdmin._id.toString(),
          userRole: 'super_admin',
          status: 'success',
          ipAddress,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          sessionId: sessionToken,
        });

        // Create session record
        await convex.mutation(api.sessions.create, {
          userId: superAdmin._id.toString(),
          userRole: 'super_admin',
          sessionToken,
          ipAddress,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          expiresAt,
        });

        // Check for suspicious activity
        await convex.mutation(api.securityAlerts.detectSuspiciousActivity, {
          userId: superAdmin._id.toString(),
          userRole: 'super_admin',
          ipAddress,
          device: deviceInfo.device,
        });

        return NextResponse.json({
          success: true,
          message: 'Login successful',
          role: 'super_admin',
          adminRole: superAdmin.role,
          redirectTo: '/super-admin',
        });
      } else {
        // Track failed login
        await convex.mutation(api.loginHistory.create, {
          userId: superAdmin._id.toString(),
          userRole: 'super_admin',
          status: 'failed',
          ipAddress,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          failureReason: 'Invalid password',
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

        // Generate session token
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

        // Create session
        await SessionManager.createSession({
          userId: schoolAdmin._id.toString(),
          email: schoolAdmin.email,
          role: 'school_admin',
          schoolId: schoolAdmin.schoolId,
        });

        // Track login in history
        await convex.mutation(api.loginHistory.create, {
          userId: schoolAdmin._id.toString(),
          userRole: 'school_admin',
          status: 'success',
          ipAddress,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          sessionId: sessionToken,
        });

        // Create session record
        await convex.mutation(api.sessions.create, {
          userId: schoolAdmin._id.toString(),
          userRole: 'school_admin',
          sessionToken,
          ipAddress,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          expiresAt,
        });

        // Check for suspicious activity
        await convex.mutation(api.securityAlerts.detectSuspiciousActivity, {
          userId: schoolAdmin._id.toString(),
          userRole: 'school_admin',
          ipAddress,
          device: deviceInfo.device,
        });

        return NextResponse.json({
          success: true,
          message: 'Login successful',
          role: 'school_admin',
          redirectTo: '/school-admin',
        });
      } else {
        // Track failed login
        await convex.mutation(api.loginHistory.create, {
          userId: schoolAdmin._id.toString(),
          userRole: 'school_admin',
          status: 'failed',
          ipAddress,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          failureReason: 'Invalid password',
        });
      }
    }

    // No matching credentials - track failed attempt without user ID
    await convex.mutation(api.loginHistory.create, {
      userId: 'unknown',
      userRole: 'super_admin',
      status: 'failed',
      ipAddress,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      deviceType: deviceInfo.deviceType,
      failureReason: 'Invalid credentials',
    });

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
