import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { StudentSessionManager } from "@/lib/session";
import type { Id } from "../../../../../convex/_generated/dataModel";

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

export async function GET(): Promise<NextResponse> {
  try {
    const token = await StudentSessionManager.getSessionToken();
    if (!token) {
      return NextResponse.json(
        { authenticated: false, student: null },
        { status: 401 },
      );
    }

    const convex = getConvexClient();
    const data = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: token,
    });

    if (!data || data.role !== "student") {
      return NextResponse.json(
        { authenticated: false, student: null },
        { status: 401 },
      );
    }

    const row = await convex.query(api.students.getStudentById, {
      studentId: data.userId as Id<"students">,
    });

    if (!row) {
      return NextResponse.json(
        { authenticated: false, student: null },
        { status: 401 },
      );
    }

    return NextResponse.json({
      authenticated: true,
      student: {
        id: row._id,
        studentId: row.studentId,
        email: row.email ?? "",
        schoolId: row.schoolId,
        firstName: row.firstName,
        lastName: row.lastName,
        classId: row.classId,
        className: row.className,
        photoUrl: row.photoUrl ?? undefined,
        role: "student" as const,
      },
    });
  } catch (error) {
    console.error("Student session validation error:", error);
    return NextResponse.json(
      { authenticated: false, student: null },
      { status: 401 },
    );
  }
}
