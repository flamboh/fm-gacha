import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server'

export async function getIdentity(ctx: ActionCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Not authenticated')
  }
  return identity
}

export async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    return null
  }

  return identity
}

export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const user = await getUser(ctx)
  if (!user) {
    throw new Error('Not authenticated')
  }
  return user
}
