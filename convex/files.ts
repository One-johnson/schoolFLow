import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Generate upload URL for profile photos
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Get URL for a stored file
export const getFileUrl = mutation({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
