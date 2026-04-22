import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { ParentSessionManager } from "@/lib/session";

function getConvexClient(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexHttpClient(url);
}

export async function GET(): Promise<NextResponse> {
  try {
    const token = await ParentSessionManager.getSessionToken();
    if (!token) {
      return NextResponse.json(
        { authenticated: false, parent: null },
        { status: 401 },
      );
    }

    const convex = getConvexClient();
    const data = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: token,
    });

    if (!data || data.role !== "parent") {
      return NextResponse.json(
        { authenticated: false, parent: null },
        { status: 401 },
      );
    }

    const result = await convex.query(api.parents.getParentWithStudents, {
      parentId: data.userId as import("../../../../../convex/_generated/dataModel").Id<"parents">,
    });

    if (!result) {
      return NextResponse.json(
        { authenticated: false, parent: null },
        { status: 401 },
      );
    }

    const { parent, students } = result;

    // Hard lock: deny access if the school is suspended (also clears the cookie).
    if (parent.schoolId) {
      const school = await convex.query(api.schools.getBySchoolId, {
        schoolId: parent.schoolId,
      });
      if (school?.status === "suspended") {
        await ParentSessionManager.clearSession();
        return NextResponse.json(
          {
            authenticated: false,
            parent: null,
            code: "SCHOOL_SUSPENDED",
            message:
              "Your school is currently suspended. The parent portal is temporarily unavailable. Please contact your school office.",
          },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({
      authenticated: true,
      parent: {
        id: parent._id,
        parentId: parent.parentId,
        email: parent.email,
        name: parent.name,
        phone: parent.phone,
        schoolId: parent.schoolId,
        studentIds: students.map((s) => s.id),
        students,
        role: "parent",
      },
    });
  } catch (error) {
    console.error("Parent session validation error:", error);
    return NextResponse.json(
      { authenticated: false, parent: null },
      { status: 401 },
    );
  }
}
