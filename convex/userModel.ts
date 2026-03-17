import type { UserIdentity } from 'convex/server'
import { v } from 'convex/values'
import type { MutationCtx, QueryCtx } from './_generated/server'

export const viewerSnapshotFields = {
  clerkId: v.string(),
  name: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
}

export const viewerSnapshotValidator = v.object(viewerSnapshotFields)

export const userFields = {
  ...viewerSnapshotFields,
  createdAt: v.number(),
  updatedAt: v.number(),
}

type DbCtx = Pick<QueryCtx | MutationCtx, 'db'>

export type ViewerSnapshot = {
  clerkId: string
  name?: string
  imageUrl?: string
}

export function getViewerSnapshot(identity: UserIdentity): ViewerSnapshot {
  return {
    clerkId: identity.subject,
    name: identity.name,
    imageUrl: identity.pictureUrl,
  }
}

export async function getUserByClerkId(ctx: DbCtx, clerkId: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
    .unique()
}

export async function upsertUser(ctx: MutationCtx, snapshot: ViewerSnapshot) {
  const existingUser = await getUserByClerkId(ctx, snapshot.clerkId)
  const updatedAt = Date.now()

  if (existingUser) {
    await ctx.db.patch(existingUser._id, {
      name: snapshot.name,
      imageUrl: snapshot.imageUrl,
      updatedAt,
    })
    return existingUser._id
  }

  return await ctx.db.insert('users', {
    clerkId: snapshot.clerkId,
    name: snapshot.name,
    imageUrl: snapshot.imageUrl,
    createdAt: updatedAt,
    updatedAt,
  })
}
