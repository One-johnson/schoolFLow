import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import bcrypt from "bcryptjs";
import type { Id } from "./_generated/dataModel";

// Get all users for a school (excluding super_admin)
export const getSchoolUsers = query({
  args: {
    schoolId: v.id("schools"),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let usersQuery = ctx.db
      .query("users")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId));

    const users = await usersQuery.collect();

    // Filter out super_admin and apply role filter if provided
    let filteredUsers = users.filter((user) => user.role !== "super_admin");
    
    if (args.role) {
      filteredUsers = filteredUsers.filter((user) => user.role === args.role);
    }

    return filteredUsers.map((user) => ({
      id: user._id,
      schoolId: user.schoolId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      photo: user.photo,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      address: user.address,
      emergencyContact: user.emergencyContact,
      joiningDate: user.joiningDate,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  },
});

// Get a single user by ID
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      schoolId: user.schoolId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      photo: user.photo,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      address: user.address,
      emergencyContact: user.emergencyContact,
      joiningDate: user.joiningDate,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

// Create a new user
export const createUser = mutation({
  args: {
    schoolId: v.id("schools"),
    email: v.string(),
    password: v.string(),
    role: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        relationship: v.string(),
        phone: v.string(),
      })
    ),
    joiningDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists in the school
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_school_and_email", (q) =>
        q.eq("schoolId", args.schoolId).eq("email", args.email)
      )
      .first();

    if (existingUser) {
      throw new Error("Email already exists in this school");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(args.password, 10);

    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      schoolId: args.schoolId,
      email: args.email,
      password: hashedPassword,
      role: args.role,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      bloodGroup: args.bloodGroup,
      address: args.address,
      emergencyContact: args.emergencyContact,
      joiningDate: args.joiningDate || now,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

// Update a user
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    photo: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        relationship: v.string(),
        phone: v.string(),
      })
    ),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// Delete a user
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is super_admin
    if (user.role === "super_admin") {
      throw new Error("Cannot delete super admin");
    }

    // Delete user
    await ctx.db.delete(args.userId);

    // Delete associated sessions
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Change user password
export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const hashedPassword = await bcrypt.hash(args.newPassword, 10);

    await ctx.db.patch(args.userId, {
      password: hashedPassword,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
