import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Generate upload URL for photos/documents
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Create photo record after successful upload
export const createPhotoRecord = mutation({
  args: {
    storageId: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    entityType: v.union(
      v.literal('student'),
      v.literal('teacher'),
      v.literal('school'),
      v.literal('support_ticket')
    ),
    entityId: v.string(),
    fileType: v.union(
      v.literal('photo'),
      v.literal('document'),
      v.literal('certificate'),
      v.literal('attachment')
    ),
    uploadedBy: v.string(),
    schoolId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const photoId = await ctx.db.insert('photos', {
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      entityType: args.entityType,
      entityId: args.entityId,
      fileType: args.fileType,
      uploadedBy: args.uploadedBy,
      uploadedAt: new Date().toISOString(),
      schoolId: args.schoolId,
      isDeleted: false,
    });

    return photoId;
  },
});

// Get photo/document URL from storage
export const getFileUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as Id<'_storage'>);
  },
});

// Get photo record by storage ID
export const getPhotoByStorageId = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const photo = await ctx.db
      .query('photos')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .first();

    return photo;
  },
});

// Get all photos for an entity
export const getPhotosByEntity = query({
  args: {
    entityType: v.union(
      v.literal('student'),
      v.literal('teacher'),
      v.literal('school'),
      v.literal('support_ticket')
    ),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const photos = await ctx.db
      .query('photos')
      .withIndex('by_entity', (q) =>
        q.eq('entityType', args.entityType).eq('entityId', args.entityId)
      )
      .filter((q) => q.eq(q.field('isDeleted'), false))
      .collect();

    return photos;
  },
});

// Soft delete photo record
export const softDeletePhoto = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    const photo = await ctx.db
      .query('photos')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .first();

    if (!photo) {
      throw new Error('Photo record not found');
    }

    await ctx.db.patch(photo._id, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Hard delete file from storage (use with caution)
export const deleteFileFromStorage = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    // First soft delete the photo record
    const photo = await ctx.db
      .query('photos')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .first();

    if (photo) {
      await ctx.db.patch(photo._id, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
    }

    // Then delete from storage
    await ctx.storage.delete(args.storageId as Id<'_storage'>);

    return { success: true };
  },
});

// Delete photo record and file (complete cleanup)
export const deletePhoto = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    // Find and soft delete the photo record
    const photo = await ctx.db
      .query('photos')
      .withIndex('by_storage', (q) => q.eq('storageId', args.storageId))
      .first();

    if (photo) {
      await ctx.db.patch(photo._id, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      });
    }

    // Delete from storage
    try {
      await ctx.storage.delete(args.storageId as Id<'_storage'>);
    } catch (error) {
      console.error('Failed to delete file from storage:', error);
      // Continue even if storage deletion fails
    }

    return { success: true };
  },
});
