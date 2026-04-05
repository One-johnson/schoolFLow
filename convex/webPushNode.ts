"use node";

import { v } from "convex/values";
import webpush from "web-push";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const deliver = internalAction({
  args: {
    subscriptionJson: v.array(
      v.object({
        endpoint: v.string(),
        keys: v.object({
          p256dh: v.string(),
          auth: v.string(),
        }),
      }),
    ),
    payload: v.object({
      title: v.string(),
      body: v.string(),
      url: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    const subject =
      process.env.VAPID_SUBJECT?.trim() ?? "mailto:noreply@schoolflow.app";
    if (!publicKey || !privateKey) {
      console.error("webPushNode.deliver: set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Convex env");
      return;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    const body = JSON.stringify(args.payload);
    for (const sub of args.subscriptionJson) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body,
          { TTL: 86_400 },
        );
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await ctx.runMutation(internal.webPush.removeByEndpoint, {
            endpoint: sub.endpoint,
          });
        } else {
          console.error("webPush send failed:", status, e);
        }
      }
    }
  },
});
