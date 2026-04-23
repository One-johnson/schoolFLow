import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { TeacherSessionManager } from "@/lib/session";

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

export async function GET(): Promise<NextResponse> {
  try {
    const token = await TeacherSessionManager.getSessionToken();
    if (!token) {
      return NextResponse.json(
        { authenticated: false, teacher: null },
        { status: 401 },
      );
    }

    const convex = getConvexClient();
    const data = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: token,
    });

    if (!data || data.role !== "teacher") {
      return NextResponse.json(
        { authenticated: false, teacher: null },
        { status: 401 },
      );
    }

    const teacher = await convex.query(api.teachers.getTeacherByEmail, {
      email: data.email,
    });

    if (!teacher) {
      return NextResponse.json(
        { authenticated: false, teacher: null },
        { status: 401 },
      );
    }

    // Hard lock: deny access if the school is suspended (also clears the cookie).
    if (teacher.schoolId) {
      const school = await convex.query(api.schools.getBySchoolId, {
        schoolId: teacher.schoolId,
      });
      if (school?.status === "suspended") {
        await TeacherSessionManager.clearSession();
        return NextResponse.json(
          {
            authenticated: false,
            teacher: null,
            code: "SCHOOL_SUSPENDED",
            message:
              "Your school is currently suspended. The teacher portal is temporarily unavailable. Please contact your school administrator.",
          },
          { status: 403 },
        );
      }
    }

    const classes = await convex.query(api.teachers.getTeacherClasses, {
      teacherId: teacher._id,
    });
    const classIds = classes.map((c) => c._id);
    const classNames = classes.map((c) => c.className);

    return NextResponse.json({
      authenticated: true,
      teacher: {
        id: teacher._id,
        teacherId: teacher.teacherId,
        email: teacher.email,
        schoolId: teacher.schoolId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        classIds,
        classNames,
        photoUrl: teacher.photoUrl,
        role: "teacher",
      },
    });
  } catch (error) {
    console.error("Teacher session validation error:", error);
    return NextResponse.json(
      { authenticated: false, teacher: null },
      { status: 401 },
    );
  }
}
