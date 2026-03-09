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

export async function POST(): Promise<NextResponse> {
  try {
    const token = await TeacherSessionManager.getSessionToken();
    if (token) {
      const convex = getConvexClient();
      await convex.mutation(api.sessions.revokeByToken, { sessionToken: token });
    }

    await TeacherSessionManager.clearSession();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Teacher logout error:", error);
    return NextResponse.json(
      { success: false, message: "Logout failed" },
      { status: 500 },
    );
  }
}
