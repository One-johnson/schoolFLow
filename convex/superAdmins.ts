import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Get all super admins
export const list = query({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db.query('superAdmins').order('desc').collect();
    return admins.map((admin) => ({
      ...admin,
      password: undefined, // Don't expose passwords
    }));
  },
});

// Get super admin by ID
export const getById = query({
  args: { id: v.id('superAdmins') },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    if (!admin) return null;
    
    return {
      ...admin,
      password: undefined, // Don't expose password
    };
  },
});

// Get super admin by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query('superAdmins')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
    
    if (!admin) return null;
    
    return {
      ...admin,
      password: undefined, // Don't expose password
    };
  },
});

// Create new super admin
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('moderator')),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query('superAdmins')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existing) {
      throw new Error('Email already exists');
    }

    // Create the new super admin
    const id = await ctx.db.insert('superAdmins', {
      name: args.name,
      email: args.email,
      password: args.password, // Should be hashed from API route
      role: args.role,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: args.createdBy,
    });

    return id;
  },
});

// Update super admin role
export const updateRole = mutation({
  args: {
    id: v.id('superAdmins'),
    role: v.union(v.literal('owner'), v.literal('admin'), v.literal('moderator')),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    
    if (!admin) {
      throw new Error('Super admin not found');
    }

    await ctx.db.patch(args.id, {
      role: args.role,
    });

    return args.id;
  },
});

// Suspend super admin
export const suspend = mutation({
  args: {
    id: v.id('superAdmins'),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    
    if (!admin) {
      throw new Error('Super admin not found');
    }

    await ctx.db.patch(args.id, {
      status: 'suspended',
    });

    return args.id;
  },
});

// Activate super admin
export const activate = mutation({
  args: {
    id: v.id('superAdmins'),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    
    if (!admin) {
      throw new Error('Super admin not found');
    }

    await ctx.db.patch(args.id, {
      status: 'active',
    });

    return args.id;
  },
});

// Delete super admin
export const remove = mutation({
  args: {
    id: v.id('superAdmins'),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.id);
    
    if (!admin) {
      throw new Error('Super admin not found');
    }

    // Check if this is the last owner
    if (admin.role === 'owner') {
      const owners = await ctx.db
        .query('superAdmins')
        .withIndex('by_role', (q) => q.eq('role', 'owner'))
        .collect();
      
      if (owners.length <= 1) {
        throw new Error('Cannot delete the last owner');
      }
    }

    await ctx.db.delete(args.id);

    return args.id;
  },
});

// Get statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allAdmins = await ctx.db.query('superAdmins').collect();
    
    const stats = {
      total: allAdmins.length,
      active: allAdmins.filter((a) => a.status === 'active').length,
      suspended: allAdmins.filter((a) => a.status === 'suspended').length,
      owners: allAdmins.filter((a) => a.role === 'owner').length,
      admins: allAdmins.filter((a) => a.role === 'admin').length,
      moderators: allAdmins.filter((a) => a.role === 'moderator').length,
    };

    return stats;
  },
});
