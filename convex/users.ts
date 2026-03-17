import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'
import { requireUser } from './auth'
import { storePackForViewer } from './collectionWrites'
import { openedPackValidator } from './packModel'
import {
  getUserByClerkId,
  getViewerSnapshot,
  upsertUser,
  userFields,
} from './userModel'

const LASTFM_USERNAME_MAX_LENGTH = 64

export const ensureViewer = mutation({
  args: {},
  returns: v.id('users'),
  handler: async (ctx) => {
    const identity = await requireUser(ctx)
    return await upsertUser(ctx, getViewerSnapshot(identity))
  },
})

export const getViewer = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      ...userFields,
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const identity = await requireUser(ctx)
    return await getUserByClerkId(ctx, identity.subject)
  },
})

export const setLastFmUsername = mutation({
  args: {
    lastFmUsername: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx)
    const lastFmUsername = args.lastFmUsername.trim()

    if (lastFmUsername.length > LASTFM_USERNAME_MAX_LENGTH) {
      throw new ConvexError({
        code: 'INVALID_LASTFM_USERNAME',
        message: 'Last.fm username too long',
      })
    }

    const userId = await upsertUser(ctx, getViewerSnapshot(identity))
    const nextLastFmUsername =
      lastFmUsername.length === 0 ? undefined : lastFmUsername

    await ctx.db.patch(userId, {
      lastFmUsername: nextLastFmUsername,
      updatedAt: Date.now(),
    })

    return null
  },
})

export const importGuestPack = mutation({
  args: {
    pack: openedPackValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx)
    await storePackForViewer(ctx, getViewerSnapshot(identity), args.pack.cards)
    return null
  },
})
