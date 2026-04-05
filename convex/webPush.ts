import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

const recipientRoleV = v.union(
  v.literal("student"),
  v.literal("teacher"),
  v.literal("parent"),
  v.literal("school_admin"),
);

function assertPushApiSecret(provided: string): void {
  const expected = process.env.SCHOOLFLOW_PUSH_API_SECRET;
  if (!expected || provided !== expected) {
    throw new Error("Unauthorized");
  }
}

export const registerSubscriptionTrusted = mutation({
  args: {
    apiSecret: v.string(),
    recipientRole: recipientRoleV,
    recipientId: v.string(),
    schoolId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    assertPushApiSecret(args.apiSecret);
    const now = new Date().toISOString();
    const existing = await ctx.db
      .query("webPushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        recipientRole: args.recipientRole,
        recipientId: args.recipientId,
        schoolId: args.schoolId,
        p256dh: args.p256dh,
        auth: args.auth,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("webPushSubscriptions", {
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      recipientRole: args.recipientRole,
      recipientId: args.recipientId,
      schoolId: args.schoolId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const unregisterSubscriptionTrusted = mutation({
  args: {
    apiSecret: v.string(),
    endpoint: v.string(),
    recipientRole: recipientRoleV,
    recipientId: v.string(),
  },
  handler: async (ctx, args) => {
    assertPushApiSecret(args.apiSecret);
    const row = await ctx.db
      .query("webPushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (
      row &&
      row.recipientRole === args.recipientRole &&
      row.recipientId === args.recipientId
    ) {
      await ctx.db.delete(row._id);
    }
  },
});

export const removeByEndpoint = internalMutation({
  args: { endpoint: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("webPushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    if (row) await ctx.db.delete(row._id);
  },
});

export const enqueueDeliver = internalMutation({
  args: {
    recipientRole: recipientRoleV,
    recipientId: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("webPushSubscriptions")
      .withIndex("by_recipient", (q) =>
        q.eq("recipientRole", args.recipientRole).eq("recipientId", args.recipientId),
      )
      .collect();
    if (subs.length === 0) return;
    await ctx.scheduler.runAfter(0, internal.webPushNode.deliver, {
      subscriptionJson: subs.map((s) => ({
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      })),
      payload: {
        title: args.title,
        body: args.body,
        url: args.url ?? "/",
      },
    });
  },
});

export async function scheduleWebPushForRecipient(
  ctx: MutationCtx,
  args: {
    recipientRole: "student" | "teacher" | "parent" | "school_admin";
    recipientId: string;
    title: string;
    body: string;
    url?: string;
  },
): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.webPush.enqueueDeliver, {
    recipientRole: args.recipientRole,
    recipientId: args.recipientId,
    title: args.title,
    body: args.body,
    url: args.url,
  });
}
