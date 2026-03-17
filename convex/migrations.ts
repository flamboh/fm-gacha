import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const backfillCollectionFavorites = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const entries = await ctx.db.query('userCollectionEntries').collect()
    let updatedCount = 0

    for (const entry of entries) {
      if (entry.favorite !== undefined) {
        continue
      }

      await ctx.db.patch(entry._id, {
        favorite: false,
      })
      updatedCount += 1
    }

    return updatedCount
  },
})
