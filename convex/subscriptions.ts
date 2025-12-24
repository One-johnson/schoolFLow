import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Get all subscriptions (super admin)
export const getAllSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const subscriptions = await ctx.db.query("subscriptions").collect();

    // Enrich with school and plan data
    const enrichedSubs = await Promise.all(
      subscriptions.map(async (sub) => {
        const school = await ctx.db.get(sub.schoolId);
        const plan = await ctx.db.get(sub.planId);
        const creator = await ctx.db.get(sub.createdBy);

        return {
          ...sub,
          schoolName: school?.name || "Unknown",
          planName: plan?.displayName || "Unknown",
          planPrice: plan?.price || 0,
          creatorName: creator
            ? `${creator.firstName} ${creator.lastName}`
            : "Unknown",
        };
      })
    );

    return enrichedSubs;
  },
});

// Get subscription by school ID
export const getSubscriptionBySchool = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .order("desc")
      .first();

    if (!subscription) return null;

    const plan = await ctx.db.get(subscription.planId);
    const school = await ctx.db.get(subscription.schoolId);

    return {
      ...subscription,
      plan,
      schoolName: school?.name || "Unknown",
    };
  },
});

// Get subscription by ID
export const getSubscriptionById = query({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) return null;

    const plan = await ctx.db.get(subscription.planId);
    const school = await ctx.db.get(subscription.schoolId);

    return {
      ...subscription,
      plan,
      schoolName: school?.name || "Unknown",
    };
  },
});

// Get expiring subscriptions (within next 7 days)
export const getExpiringSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_end_date")
      .filter(
        (q) =>
          q.and(
            q.gte(q.field("endDate"), now),
            q.lte(q.field("endDate"), sevenDaysFromNow),
            q.eq(q.field("status"), "active")
          )
      )
      .collect();

    const enrichedSubs = await Promise.all(
      subscriptions.map(async (sub) => {
        const school = await ctx.db.get(sub.schoolId);
        const plan = await ctx.db.get(sub.planId);

        return {
          ...sub,
          schoolName: school?.name || "Unknown",
          schoolEmail: school?.email || "",
          planName: plan?.displayName || "Unknown",
          planPrice: plan?.price || 0,
        };
      })
    );

    return enrichedSubs;
  },
});

// Get expired subscriptions
export const getExpiredSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const subscriptions = await ctx.db
      .query("subscriptions")
      .withIndex("by_end_date")
      .filter(
        (q) =>
          q.and(
            q.lt(q.field("endDate"), now),
            q.eq(q.field("status"), "active")
          )
      )
      .collect();

    return subscriptions;
  },
});

// Create subscription
export const createSubscription = mutation({
  args: {
    schoolId: v.id("schools"),
    planId: v.id("subscriptionPlans"),
    startDate: v.number(),
    endDate: v.number(),
    status: v.string(),
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const subscriptionId = await ctx.db.insert("subscriptions", {
      schoolId: args.schoolId,
      planId: args.planId,
      status: args.status,
      startDate: args.startDate,
      endDate: args.endDate,
      autoRenew: false,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
      createdBy: args.createdBy,
    });

    // Update school's subscription plan
    const plan = await ctx.db.get(args.planId);
    if (plan) {
      await ctx.db.patch(args.schoolId, {
        subscriptionPlan: plan.name,
        updatedAt: now,
      });
    }

    return subscriptionId;
  },
});

// Update subscription
export const updateSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    planId: v.optional(v.id("subscriptionPlans")),
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    autoRenew: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { subscriptionId, updatedBy, ...updates } = args;

    await ctx.db.patch(subscriptionId, {
      ...updates,
      updatedAt: Date.now(),
      updatedBy,
    });

    // If plan changed, update school's subscription plan
    if (args.planId) {
      const subscription = await ctx.db.get(subscriptionId);
      if (subscription) {
        const plan = await ctx.db.get(args.planId);
        if (plan) {
          await ctx.db.patch(subscription.schoolId, {
            subscriptionPlan: plan.name,
            updatedAt: Date.now(),
          });
        }
      }
    }

    return subscriptionId;
  },
});

// Expire subscription (set status to expired)
export const expireSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      status: "expired",
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    });

    return args.subscriptionId;
  },
});

// Renew subscription (extend end date)
export const renewSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    newEndDate: v.number(),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      endDate: args.newEndDate,
      status: "active",
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    });

    return args.subscriptionId;
  },
});

// Cancel subscription
export const cancelSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      status: "inactive",
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    });

    return args.subscriptionId;
  },
});

// Auto-expire subscriptions (cron job function)
export const autoExpireSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const expiredSubs = await ctx.db
      .query("subscriptions")
      .withIndex("by_end_date")
      .filter(
        (q) =>
          q.and(
            q.lt(q.field("endDate"), now),
            q.eq(q.field("status"), "active")
          )
      )
      .collect();

    for (const sub of expiredSubs) {
      await ctx.db.patch(sub._id, {
        status: "expired",
        updatedAt: now,
      });

      // Update school status to suspended
      await ctx.db.patch(sub.schoolId, {
        status: "suspended",
        updatedAt: now,
      });
    }

    return {
      expiredCount: expiredSubs.length,
      message: `${expiredSubs.length} subscriptions expired`,
    };
  },
});


// Delete subscription
export const deleteSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Delete the subscription
    await ctx.db.delete(args.subscriptionId);

    // Update school's subscription plan back to free
    await ctx.db.patch(subscription.schoolId, {
      subscriptionPlan: "free",
      updatedAt: Date.now(),
    });

    return args.subscriptionId;
  },
});