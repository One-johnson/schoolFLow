import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Get all subscription plans
export const getAllPlans = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("subscriptionPlans")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get all plans (including inactive) - for super admin
export const getAllPlansAdmin = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("subscriptionPlans").collect();
  },
});

// Get plan by ID
export const getPlanById = query({
  args: { planId: v.id("subscriptionPlans") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.planId);
  },
});

// Get plan by name
export const getPlanByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptionPlans")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// Create subscription plan
export const createPlan = mutation({
  args: {
    name: v.string(),
    displayName: v.string(),
    description: v.string(),
    price: v.number(),
    currency: v.string(),
    billingPeriod: v.string(),
    features: v.array(v.string()),
    maxUsers: v.optional(v.number()),
    maxStudents: v.optional(v.number()),
    maxClasses: v.optional(v.number()),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("subscriptionPlans", {
      name: args.name,
      displayName: args.displayName,
      description: args.description,
      price: args.price,
      currency: args.currency,
      billingPeriod: args.billingPeriod,
      features: args.features,
      maxUsers: args.maxUsers,
      maxStudents: args.maxStudents,
      maxClasses: args.maxClasses,
      isActive: true,
      isPopular: args.isPopular || false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update subscription plan
export const updatePlan = mutation({
  args: {
    planId: v.id("subscriptionPlans"),
    displayName: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    billingPeriod: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    maxUsers: v.optional(v.number()),
    maxStudents: v.optional(v.number()),
    maxClasses: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isPopular: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { planId, ...updates } = args;

    await ctx.db.patch(planId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return planId;
  },
});

// Delete subscription plan (soft delete - set inactive)
export const deletePlan = mutation({
  args: { planId: v.id("subscriptionPlans") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.planId, {
      isActive: false,
      updatedAt: Date.now(),
    });

    return args.planId;
  },
});

// Seed default plans (call once to initialize)
export const seedDefaultPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Check if plans already exist
    const existingPlans = await ctx.db.query("subscriptionPlans").collect();
    if (existingPlans.length > 0) {
      return { message: "Plans already exist" };
    }

    // Create Free Plan
    await ctx.db.insert("subscriptionPlans", {
      name: "free",
      displayName: "Free Plan",
      description: "Perfect for getting started with basic features",
      price: 0,
      currency: "GHS",
      billingPeriod: "monthly",
      features: [
        "Up to 50 students",
        "Up to 5 teachers",
        "Up to 3 classes",
        "Basic reporting",
        "Email support",
      ],
      maxUsers: 5,
      maxStudents: 50,
      maxClasses: 3,
      isActive: true,
      isPopular: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create Basic Plan
    await ctx.db.insert("subscriptionPlans", {
      name: "basic",
      displayName: "Basic Plan",
      description: "Great for small schools and institutions",
      price: 150,
      currency: "GHS",
      billingPeriod: "monthly",
      features: [
        "Up to 200 students",
        "Up to 20 teachers",
        "Up to 10 classes",
        "Advanced reporting",
        "Student & teacher management",
        "Email support",
      ],
      maxUsers: 20,
      maxStudents: 200,
      maxClasses: 10,
      isActive: true,
      isPopular: false,
      createdAt: now,
      updatedAt: now,
    });

    // Create Premium Plan
    await ctx.db.insert("subscriptionPlans", {
      name: "premium",
      displayName: "Premium Plan",
      description: "Most popular for growing schools",
      price: 500,
      currency: "GHS",
      billingPeriod: "monthly",
      features: [
        "Up to 1000 students",
        "Up to 50 teachers",
        "Unlimited classes",
        "Advanced analytics",
        "Custom reports",
        "Parent portal access",
        "Priority support",
        "Data export",
      ],
      maxUsers: 50,
      maxStudents: 1000,
      isActive: true,
      isPopular: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create Enterprise Plan
    await ctx.db.insert("subscriptionPlans", {
      name: "enterprise",
      displayName: "Enterprise Plan",
      description: "For large institutions with advanced needs",
      price: 1500,
      currency: "GHS",
      billingPeriod: "monthly",
      features: [
        "Unlimited students",
        "Unlimited teachers",
        "Unlimited classes",
        "Advanced analytics & dashboards",
        "Custom integrations",
        "API access",
        "Multi-campus support",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom training",
      ],
      isActive: true,
      isPopular: false,
      createdAt: now,
      updatedAt: now,
    });

    return { message: "Default plans created successfully" };
  },
});
