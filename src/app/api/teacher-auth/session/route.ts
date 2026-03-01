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
    const session = await TeacherSessionManager.getSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false, teacher: null },
        { status: 401 },
      );
    }

    const convex = getConvexClient();
    const teacher = await convex.query(api.teachers.getTeacherByEmail, {
      email: session.email,
    });

    if (!teacher) {
      return NextResponse.json(
        { authenticated: false, teacher: null },
        { status: 401 },
      );
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
