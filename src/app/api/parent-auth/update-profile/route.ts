import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
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
    const { name, email, phone } = body;

    const args: {
      parentId: Id<"parents">;
      name?: string;
      email?: string;
      phone?: string;
    } = { parentId: session.userId as Id<"parents"> };

    let hasUpdate = false;
    if (typeof name === "string" && name.trim()) {
      args.name = name.trim();
      hasUpdate = true;
    }
    if (typeof email === "string" && email.trim()) {
      args.email = email.trim().toLowerCase();
      hasUpdate = true;
    }
    if ("phone" in body) {
      args.phone = typeof phone === "string" ? phone.trim() : undefined;
      hasUpdate = true;
    }

    if (!hasUpdate) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await convex.mutation(api.parents.updateParentProfile, args);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Parent profile update error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
