import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireUser } from './auth'
import {
  getUserByClerkId,
  getViewerSnapshot,
  upsertUser,
  userFields,
} from './userModel'

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
