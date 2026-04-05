import { NextResponse } from "next/server";

/** Public VAPID key for PushManager.subscribe (same value as VAPID_PUBLIC_KEY / Convex). */
export async function GET(): Promise<Response> {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { configured: false as const, publicKey: null },
      { status: 200 },
    );
  }
  return NextResponse.json({ configured: true as const, publicKey: key });
}
