import { mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireUser } from './auth'

export const saveImage = mutation({
  args: {
    songId: v.id('discoveredSongs'),
    imageUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireUser(ctx)
    await ctx.db.patch(args.songId, {
      imageUrl: args.imageUrl,
      imageUpdatedAt: Date.now(),
    })
    return null
  },
})
