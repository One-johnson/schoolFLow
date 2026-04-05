import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import {
  getPushApiSecret,
  getPushPortalIdentity,
} from "@/lib/push-session-server";

function getConvex(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  return new ConvexHttpClient(url);
}

type Body = {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
};

export async function POST(req: Request): Promise<Response> {
  const secret = getPushApiSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Push is not configured (SCHOOLFLOW_PUSH_API_SECRET)." },
      { status: 503 },
    );
  }

  const identity = await getPushPortalIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sub = body.subscription;
  const endpoint = sub?.endpoint?.trim();
  const p256dh = sub?.keys?.p256dh?.trim();
  const auth = sub?.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  try {
    const convex = getConvex();
    await convex.mutation(api.webPush.registerSubscriptionTrusted, {
      apiSecret: secret,
      recipientRole: identity.recipientRole,
      recipientId: identity.recipientId,
      schoolId: identity.schoolId,
      endpoint,
      p256dh,
      auth,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("push subscribe:", e);
    return NextResponse.json({ error: "Could not save subscription" }, { status: 500 });
  }
}
