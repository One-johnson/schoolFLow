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

type Body = { endpoint?: string };

export async function POST(req: Request): Promise<Response> {
  const secret = getPushApiSecret();
  if (!secret) {
    return NextResponse.json(
      { error: "Push is not configured." },
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

  const endpoint = body.endpoint?.trim();
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  try {
    const convex = getConvex();
    await convex.mutation(api.webPush.unregisterSubscriptionTrusted, {
      apiSecret: secret,
      endpoint,
      recipientRole: identity.recipientRole,
      recipientId: identity.recipientId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("push unsubscribe:", e);
    return NextResponse.json({ error: "Could not remove subscription" }, { status: 500 });
  }
}
