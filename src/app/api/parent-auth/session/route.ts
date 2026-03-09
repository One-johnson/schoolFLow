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

    return NextResponse.json({
      authenticated: true,
      parent: {
        id: parent._id,
        parentId: parent.parentId,
        email: parent.email,
        name: parent.name,
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
