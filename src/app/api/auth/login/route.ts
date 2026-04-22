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
    const rawEmail = body.email as string | undefined;
    const rawPassword = body.password as string | undefined;
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
    const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';

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

        // Generate session token and create Convex session record
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

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

        await SessionManager.setSessionCookie(sessionToken);

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

    // Try School Admin login (schoolId is case-insensitive; email is case-sensitive)
    const schoolAdmins = await convex.query(api.schoolAdmins.list);
    const emailLower = email.toLowerCase();
    const schoolAdmin = schoolAdmins?.find(
      (admin) =>
        (admin.schoolId && admin.schoolId.toUpperCase() === email.toUpperCase()) ||
        admin.email.toLowerCase() === emailLower
    );

    // If not found by admin record, try lookup via school (admin.schoolId may have been updated after approval)
    let resolvedAdmin = schoolAdmin;
    if (!resolvedAdmin && email.toUpperCase().startsWith('SCH')) {
      const school = await convex.query(api.schools.getBySchoolId, {
        schoolId: email.toUpperCase(),
      });
      if (school?.adminId) {
        resolvedAdmin =
          schoolAdmins?.find((a) => a._id.toString() === school.adminId) ??
          undefined;
      }
    }

    if (resolvedAdmin) {
      let isValidPassword = false;

      // Check hashed password first
      if (resolvedAdmin.password) {
        isValidPassword = await PasswordManager.verify(password, resolvedAdmin.password);
      }

      // Verify against hashed tempPassword if set (original credential from creation)
      if (!isValidPassword && resolvedAdmin.tempPassword) {
        isValidPassword = await PasswordManager.verify(password, resolvedAdmin.tempPassword);
      }

      // Allow current schoolId as password when tempPassword is still set (e.g. after school approval,
      // admin.schoolId was updated to custom ID; user expects "school ID as password" to work)
      if (!isValidPassword && resolvedAdmin.tempPassword && resolvedAdmin.schoolId) {
        isValidPassword = resolvedAdmin.schoolId.toUpperCase() === password.toUpperCase();
      }

      if (isValidPassword) {
        // Promote temp password to permanent if it was temp
        if (resolvedAdmin.tempPassword) {
          const hashedPassword = await PasswordManager.hash(password);
          await convex.mutation(api.schoolAdmins.updatePassword, {
            email: resolvedAdmin.email,
            password: hashedPassword,
          });
        }

        // Check account status
        if (resolvedAdmin.status === 'inactive') {
          return NextResponse.json(
            { success: false, message: 'Your account has been deactivated. Please contact support.' },
            { status: 403 }
          );
        }

        if (resolvedAdmin.status === 'suspended') {
          return NextResponse.json(
            { success: false, message: 'Your account has been suspended. Your trial may have expired.' },
            { status: 403 }
          );
        }

        // Hard lock: deny access if the school is suspended.
        // (Admin may be active but school suspended; portals should remain locked.)
        const school = await convex.query(api.schools.getBySchoolId, {
          schoolId: resolvedAdmin.schoolId,
        });
        if (school?.status === "suspended") {
          return NextResponse.json(
            {
              success: false,
              code: "SCHOOL_SUSPENDED",
              message:
                "Your school is currently suspended. The admin portal is locked until the school is reactivated.",
            },
            { status: 403 },
          );
        }

        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

        await convex.mutation(api.loginHistory.create, {
          userId: resolvedAdmin._id.toString(),
          userRole: 'school_admin',
          status: 'success',
          ipAddress,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          sessionId: sessionToken,
        });

        await convex.mutation(api.sessions.create, {
          userId: resolvedAdmin._id.toString(),
          userRole: 'school_admin',
          sessionToken,
          ipAddress,
          device: deviceInfo.device,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          deviceType: deviceInfo.deviceType,
          expiresAt,
        });

        await SessionManager.setSessionCookie(sessionToken);

        // Check for suspicious activity
        await convex.mutation(api.securityAlerts.detectSuspiciousActivity, {
          userId: resolvedAdmin._id.toString(),
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
          userId: resolvedAdmin._id.toString(),
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
