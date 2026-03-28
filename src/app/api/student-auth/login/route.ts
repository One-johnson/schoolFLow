import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { PasswordManager } from "@/lib/password";
import { StudentSessionManager } from "@/lib/session";
import { extractIpAddress } from "@/lib/ip-utils";
import { parseUserAgent } from "@/lib/device-parser";

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();
  try {
    const body = await request.json();
    const rawLoginId =
      (typeof body.loginId === "string"
        ? body.loginId
        : typeof body.studentId === "string"
          ? body.studentId
          : "") as string;
    const rawPassword = body.password as string | undefined;
    const loginId = rawLoginId.trim();
    const password = typeof rawPassword === "string" ? rawPassword.trim() : "";

    const ipAddress = extractIpAddress(request.headers);
    const userAgent = request.headers.get("user-agent") || "";
    const deviceInfo = parseUserAgent(userAgent);

    if (!loginId || !password) {
      return NextResponse.json(
        { success: false, message: "Student ID (or email) and password are required" },
        { status: 400 },
      );
    }

    const failedCount = await convex.query(
      api.loginHistory.getFailedAttemptsCountByIp,
      {
        ipAddress,
        windowMinutes: RATE_LIMIT_WINDOW_MINUTES,
      },
    );
    if (failedCount >= RATE_LIMIT_MAX_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many failed login attempts. Please try again later.",
        },
        { status: 429 },
      );
    }

    const student = loginId.includes("@")
      ? await convex.query(api.students.getStudentByEmailForLogin, {
          email: loginId,
        })
      : await convex.query(api.students.getStudentByStudentId, {
          studentId: loginId,
        });

    if (!student) {
      await convex.mutation(api.loginHistory.create, {
        userId: "unknown",
        userRole: "student",
        status: "failed",
        ipAddress,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.deviceType,
        failureReason: "Student not found",
      });
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (student.status === "inactive") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account has been deactivated. Please contact your school administrator.",
        },
        { status: 403 },
      );
    }

    if (student.status === "graduated" || student.status === "transferred") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This account is no longer active for the student portal. Please contact your school.",
        },
        { status: 403 },
      );
    }

    const isValidPassword = await PasswordManager.verifyStudentOrLegacy(
      password,
      student.password,
    );

    if (!isValidPassword) {
      await convex.mutation(api.loginHistory.create, {
        userId: student._id,
        userRole: "student",
        status: "failed",
        ipAddress,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.deviceType,
        failureReason: "Invalid password",
      });
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!PasswordManager.isBcryptHash(student.password)) {
      const hashedPassword = await PasswordManager.hash(password);
      await convex.mutation(api.students.updateStudentPassword, {
        studentId: student._id,
        hashedPassword,
      });
    }

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await convex.mutation(api.loginHistory.create, {
      userId: student._id,
      userRole: "student",
      status: "success",
      ipAddress,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      deviceType: deviceInfo.deviceType,
      sessionId: sessionToken,
    });

    await convex.mutation(api.sessions.create, {
      userId: student._id,
      userRole: "student",
      sessionToken,
      ipAddress,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      deviceType: deviceInfo.deviceType,
      expiresAt,
    });

    await convex.mutation(api.securityAlerts.detectSuspiciousActivity, {
      userId: student._id,
      userRole: "student",
      ipAddress,
      device: deviceInfo.device,
    });

    await StudentSessionManager.setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      student: {
        id: student._id,
        studentId: student.studentId,
        email: student.email ?? "",
        schoolId: student.schoolId,
        firstName: student.firstName,
        lastName: student.lastName,
        classId: student.classId,
        className: student.className,
        photoUrl: null as string | null,
      },
      redirectTo: "/student",
    });
  } catch (error) {
    console.error("Student login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 },
    );
  }
}
