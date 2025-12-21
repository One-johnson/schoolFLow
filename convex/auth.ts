import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import bcrypt from "bcryptjs";
import type { Id } from "./_generated/dataModel";

// Register a new school with first admin user
export const registerSchool = mutation({
  args: {
    schoolName: v.string(),
    subdomain: v.optional(v.string()),
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Check if subdomain is taken (if provided)
    if (args.subdomain) {
      const existingSchool = await ctx.db
        .query("schools")
        .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
        .first();

      if (existingSchool) {
        throw new Error("Subdomain already taken");
      }
    }

    const now = Date.now();

    // Create school
    const schoolId = await ctx.db.insert("schools", {
      name: args.schoolName,
      subdomain: args.subdomain,
      email: args.email,
      phone: args.phone,
      status: "active",
      subscriptionPlan: "free",
      createdAt: now,
      updatedAt: now,
    });

    // Hash password
    const hashedPassword = bcrypt.hashSync(args.password, 10);

    // Create admin user
    const userId = await ctx.db.insert("users", {
      schoolId,
      email: args.email,
      password: hashedPassword,
      role: "school_admin",
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Create session
    const token = generateToken();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("sessions", {
      userId,
      schoolId,
      token,
      expiresAt,
      createdAt: now,
    });

    return {
      token,
      user: {
        id: userId,
        schoolId,
        email: args.email,
        role: "school_admin",
        firstName: args.firstName,
        lastName: args.lastName,
      },
    };
  },
});

// Login
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    // Find user by email
    let user;
    if (args.schoolId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_school_and_email", (q) =>
          q.eq("schoolId", args.schoolId!).eq("email", args.email)
        )
        .first();
    } else {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
    }

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = bcrypt.compareSync(args.password, user.password);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Check user status
    if (user.status !== "active") {
      throw new Error("Account is not active");
    }

    // Get school
    const school = await ctx.db.get(user.schoolId);
    if (!school || school.status !== "active") {
      throw new Error("School account is not active");
    }

    const now = Date.now();

    // Update last login
    await ctx.db.patch(user._id, { lastLogin: now });

    // Create session
    const token = generateToken();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("sessions", {
      userId: user._id,
      schoolId: user.schoolId,
      token,
      expiresAt,
      createdAt: now,
    });

    return {
      token,
      user: {
        id: user._id,
        schoolId: user.schoolId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        photo: user.photo,
      },
    };
  },
});

// Verify session and get current user
export const getCurrentUser = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== "active") return null;

    const school = await ctx.db.get(session.schoolId);
    if (!school || school.status !== "active") return null;

    return {
      id: user._id,
      schoolId: user.schoolId,
      schoolName: school.name,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      photo: user.photo,
    };
  },
});


// Logout
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Get school by subdomain or domain
export const getSchoolByDomain = query({
  args: {
    subdomain: v.optional(v.string()),
    domain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.subdomain) {
      const school = await ctx.db
        .query("schools")
        .withIndex("by_subdomain", (q) => q.eq("subdomain", args.subdomain))
        .first();
      return school;
    }

    if (args.domain) {
      const school = await ctx.db
        .query("schools")
        .withIndex("by_domain", (q) => q.eq("domain", args.domain))
        .first();
      return school;
    }

    return null;
  },
});

// Check if super admin exists
export const superAdminExists = query({
  args: {},
  handler: async (ctx) => {
    const superAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "super_admin"))
      .first();
    
    return !!superAdmin;
  },
});

// Create super admin (only if none exists)
export const createSuperAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if any super admin already exists
    const existingSuperAdmin = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "super_admin"))
      .first();
    
    if (existingSuperAdmin) {
      throw new Error("Super admin already exists. Only one super admin can be created.");
    }

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const now = Date.now();

    // Hash password
    const hashedPassword = bcrypt.hashSync(args.password, 10);

    // Create a placeholder school for super admin
    const schoolId = await ctx.db.insert("schools", {
      name: "Platform Administration",
      email: args.email,
      phone: args.phone,
      status: "active",
      subscriptionPlan: "enterprise",
      createdAt: now,
      updatedAt: now,
    });

    // Create super admin user (no school association)
    const userId = await ctx.db.insert("users", {
      schoolId, // Reference to platform admin school
      email: args.email,
      password: hashedPassword,
      role: "super_admin",
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    // Create session
    const token = generateToken();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.db.insert("sessions", {
      userId,
      schoolId,
      token,
      expiresAt,
      createdAt: now,
    });

    return {
      token,
      user: {
        id: userId,
        schoolId,
        email: args.email,
        role: "super_admin",
        firstName: args.firstName,
        lastName: args.lastName,
      },
    };
  },
});

// Helper function to generate random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}
