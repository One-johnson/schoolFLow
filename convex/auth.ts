import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("superAdmins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Email already exists");
    }

    const id = await ctx.db.insert("superAdmins", {
      name: args.name,
      email: args.email,
      password: args.password,
      createdAt: new Date().toISOString(),
    });

    return id;
  },
});

export const login = query({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("superAdmins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user || user.password !== args.password) {
      return null;
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
    };
  },
});

export const getCurrentUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("superAdmins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;

    return {
      id: user._id,
      name: user.name,
      email: user.email,
    };
  },
});

export const updateProfile = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("superAdmins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      name: args.name,
    });

    return user._id;
  },
});

export const changePassword = mutation({
  args: {
    email: v.string(),
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("superAdmins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.password !== args.oldPassword) {
      throw new Error("Current password is incorrect");
    }

    await ctx.db.patch(user._id, {
      password: args.newPassword,
    });

    return user._id;
  },
});
