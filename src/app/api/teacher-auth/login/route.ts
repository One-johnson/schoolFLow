import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { PasswordManager } from "@/lib/password";
import { TeacherSessionManager } from "@/lib/session";
import { extractIpAddress } from "@/lib/ip-utils";
import { parseUserAgent } from "@/lib/device-parser";

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
    const { email, password } = body;

    const ipAddress = extractIpAddress(request.headers);
    const userAgent = request.headers.get("user-agent") || "";
    const deviceInfo = parseUserAgent(userAgent);

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 },
      );
    }

    const teacher = await convex.query(api.teachers.getTeacherByEmail, {
      email,
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (teacher.status === "inactive") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account has been deactivated. Please contact your school administrator.",
        },
        { status: 403 },
      );
    }

    const isValidPassword = await PasswordManager.verify(
      password,
      teacher.password,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const classes = await convex.query(api.teachers.getTeacherClasses, {
      teacherId: teacher._id,
    });
    const classIds = classes.map((c) => c._id);
    const classNames = classes.map((c) => c.className);

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await convex.mutation(api.loginHistory.create, {
      userId: teacher._id,
      userRole: "teacher",
      status: "success",
      ipAddress,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      deviceType: deviceInfo.deviceType,
      sessionId: sessionToken,
    });

    await convex.mutation(api.sessions.create, {
      userId: teacher._id,
      userRole: "teacher",
      sessionToken,
      ipAddress,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      deviceType: deviceInfo.deviceType,
      expiresAt,
    });

    await TeacherSessionManager.setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      teacher: {
        id: teacher._id,
        teacherId: teacher.teacherId,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        schoolId: teacher.schoolId,
        classIds,
        classNames,
        photoUrl: teacher.photoUrl,
      },
      redirectTo: "/teacher",
    });
  } catch (error) {
    console.error("Teacher login error:", error);
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 },
    );
  }
}
