import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { PasswordManager } from "@/lib/password";
import { ParentSessionManager } from "@/lib/session";
import type { Id } from "../../../../../convex/_generated/dataModel";

function getConvexClient(): ConvexHttpClient {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(convexUrl);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await ParentSessionManager.getSessionToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const convex = getConvexClient();
    const session = await convex.query(api.sessions.getSessionWithUser, {
      sessionToken: token,
    });
    if (!session || session.role !== "parent") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 },
      );
    }

    const validation = PasswordManager.validate(newPassword);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    const parent = await convex.query(api.parents.getParentByEmail, {
      email: session.email,
    });

    if (!parent) {
      return NextResponse.json({ error: "Parent not found" }, { status: 404 });
    }

    const isValidPassword = await PasswordManager.verify(
      currentPassword,
      parent.password,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const hashedNewPassword = await PasswordManager.hash(newPassword);

    await convex.mutation(api.parents.updateParentPassword, {
      parentId: parent._id as Id<"parents">,
      hashedPassword: hashedNewPassword,
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Parent password change error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to change password",
      },
      { status: 500 },
    );
  }
}
