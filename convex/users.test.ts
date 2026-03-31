import { convexTest } from 'convex-test'
import { ConvexError } from 'convex/values'
import { describe, expect, it } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

const VIEWER = {
  name: 'Test User',
  subject: 'clerk|user_1',
  email: 'test@example.com',
}

describe('ensureViewer', () => {
  it('creates a new user and returns id', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    const id = await asUser.mutation(api.users.ensureViewer, {})
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('is idempotent — same id on repeated calls', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    const id1 = await asUser.mutation(api.users.ensureViewer, {})
    const id2 = await asUser.mutation(api.users.ensureViewer, {})
    expect(id1).toBe(id2)
  })

  it('throws when unauthenticated', async () => {
    const t = convexTest(schema, modules)
    await expect(t.mutation(api.users.ensureViewer, {})).rejects.toThrow(
      'Not authenticated',
    )
  })
})

describe('getViewer', () => {
  it('returns null when user record does not exist', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    const result = await asUser.query(api.users.getViewer, {})
    expect(result).toBeNull()
  })

  it('returns user after ensureViewer', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.ensureViewer, {})
    const user = await asUser.query(api.users.getViewer, {})
    expect(user).not.toBeNull()
    expect(user?.clerkId).toBe('clerk|user_1')
    expect(user?.name).toBe('Test User')
  })

  it('throws when unauthenticated', async () => {
    const t = convexTest(schema, modules)
    await expect(t.query(api.users.getViewer, {})).rejects.toThrow(
      'Not authenticated',
    )
  })
})

describe('setLastFmUsername', () => {
  it('sets username on existing user', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.setLastFmUsername, {
      lastFmUsername: 'musiclover',
    })
    const user = await asUser.query(api.users.getViewer, {})
    expect(user?.lastFmUsername).toBe('musiclover')
  })

  it('trims whitespace from username', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.setLastFmUsername, {
      lastFmUsername: '  trimmed  ',
    })
    const user = await asUser.query(api.users.getViewer, {})
    expect(user?.lastFmUsername).toBe('trimmed')
  })

  it('clears username when empty string is provided', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.setLastFmUsername, {
      lastFmUsername: 'musiclover',
    })
    await asUser.mutation(api.users.setLastFmUsername, { lastFmUsername: '' })
    const user = await asUser.query(api.users.getViewer, {})
    expect(user?.lastFmUsername).toBeUndefined()
  })

  it('clears username when whitespace-only string is provided', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.setLastFmUsername, {
      lastFmUsername: 'musiclover',
    })
    await asUser.mutation(api.users.setLastFmUsername, {
      lastFmUsername: '   ',
    })
    const user = await asUser.query(api.users.getViewer, {})
    expect(user?.lastFmUsername).toBeUndefined()
  })

  it('rejects username longer than 64 characters', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await expect(
      asUser.mutation(api.users.setLastFmUsername, {
        lastFmUsername: 'a'.repeat(65),
      }),
    ).rejects.toThrow(ConvexError)
  })

  it('accepts username at exactly 64 characters', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    const maxUsername = 'a'.repeat(64)
    await asUser.mutation(api.users.setLastFmUsername, {
      lastFmUsername: maxUsername,
    })
    const user = await asUser.query(api.users.getViewer, {})
    expect(user?.lastFmUsername).toBe(maxUsername)
  })

  it('throws when unauthenticated', async () => {
    const t = convexTest(schema, modules)
    await expect(
      t.mutation(api.users.setLastFmUsername, { lastFmUsername: 'test' }),
    ).rejects.toThrow('Not authenticated')
  })
})
