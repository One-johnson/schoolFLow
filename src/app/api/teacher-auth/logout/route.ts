import { NextResponse } from "next/server";
import { TeacherSessionManager } from "@/lib/session";

export async function POST(): Promise<NextResponse> {
  try {
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
