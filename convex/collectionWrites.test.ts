import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from './_generated/api'
import type { PackCard } from './packModel'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

const VIEWER = {
  name: 'Test User',
  subject: 'clerk|user_1',
  email: 'test@example.com',
}

function makeCard(
  overrides: Partial<PackCard> & {
    artist: string
    title: string
    slot: number
  },
): PackCard {
  return {
    lastFmUrl: `https://www.last.fm/music/${overrides.artist}/_/${overrides.title}`,
    listeners: 1000,
    playcount: 5000,
    sourceTag: 'indie',
    rarity: 'common',
    ...overrides,
  }
}

function makePack(cards: PackCard[]) {
  return { themeTag: 'indie', cards }
}

describe('storePackForViewer (via importGuestPack)', () => {
  it('creates new song and collection entry', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)

    await asUser.mutation(api.users.importGuestPack, {
      pack: makePack([
        makeCard({
          slot: 1,
          artist: 'Radiohead',
          title: 'Creep',
          rarity: 'rare',
        }),
      ]),
    })

    const summary = await asUser.query(api.collection.getSummary, {})
    expect(summary.uniqueSongs).toBe(1)
    expect(summary.totalCopies).toBe(1)
    expect(summary.rareCount).toBe(1)
  })

  it('increments copyCount on duplicate collect', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    const pack = makePack([
      makeCard({ slot: 1, artist: 'Radiohead', title: 'Creep' }),
    ])

    await asUser.mutation(api.users.importGuestPack, { pack })
    await asUser.mutation(api.users.importGuestPack, { pack })

    const summary = await asUser.query(api.collection.getSummary, {})
    expect(summary.uniqueSongs).toBe(1)
    expect(summary.totalCopies).toBe(2)
  })

  it('upgrades rarity when higher rarity is collected', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)

    await asUser.mutation(api.users.importGuestPack, {
      pack: makePack([
        makeCard({
          slot: 1,
          artist: 'Radiohead',
          title: 'Creep',
          rarity: 'common',
        }),
      ]),
    })
    await asUser.mutation(api.users.importGuestPack, {
      pack: makePack([
        makeCard({
          slot: 1,
          artist: 'Radiohead',
          title: 'Creep',
          rarity: 'mythic',
        }),
      ]),
    })

    const summary = await asUser.query(api.collection.getSummary, {})
    expect(summary.mythicCount).toBe(1)
    expect(summary.commonCount).toBe(0)
  })

  it('does not downgrade rarity', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)

    await asUser.mutation(api.users.importGuestPack, {
      pack: makePack([
        makeCard({
          slot: 1,
          artist: 'Radiohead',
          title: 'Creep',
          rarity: 'rare',
        }),
      ]),
    })
    await asUser.mutation(api.users.importGuestPack, {
      pack: makePack([
        makeCard({
          slot: 1,
          artist: 'Radiohead',
          title: 'Creep',
          rarity: 'common',
        }),
      ]),
    })

    const summary = await asUser.query(api.collection.getSummary, {})
    expect(summary.rareCount).toBe(1)
    expect(summary.commonCount).toBe(0)
  })

  it('stores multiple unique songs from one pack', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)

    await asUser.mutation(api.users.importGuestPack, {
      pack: makePack([
        makeCard({
          slot: 1,
          artist: 'Radiohead',
          title: 'Creep',
          rarity: 'common',
        }),
        makeCard({
          slot: 2,
          artist: 'Radiohead',
          title: 'Karma Police',
          rarity: 'uncommon',
        }),
        makeCard({ slot: 3, artist: 'Blur', title: 'Song 2', rarity: 'rare' }),
        makeCard({
          slot: 4,
          artist: 'Oasis',
          title: 'Wonderwall',
          rarity: 'mythic',
        }),
        makeCard({
          slot: 5,
          artist: 'Pulp',
          title: 'Common People',
          rarity: 'uncommon',
        }),
      ]),
    })

    const summary = await asUser.query(api.collection.getSummary, {})
    expect(summary.uniqueSongs).toBe(5)
    expect(summary.totalCopies).toBe(5)
    expect(summary.commonCount).toBe(1)
    expect(summary.uncommonCount).toBe(2)
    expect(summary.rareCount).toBe(1)
    expect(summary.mythicCount).toBe(1)
  })

  it('deduplicates by normalized song key (case-insensitive)', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)

    await asUser.mutation(api.users.importGuestPack, {
      pack: makePack([
        makeCard({ slot: 1, artist: 'Radiohead', title: 'Creep' }),
      ]),
    })
    // Same song, different casing
    await asUser.mutation(api.users.importGuestPack, {
      pack: makePack([
        makeCard({ slot: 1, artist: 'RADIOHEAD', title: 'CREEP' }),
      ]),
    })

    const summary = await asUser.query(api.collection.getSummary, {})
    expect(summary.uniqueSongs).toBe(1)
    expect(summary.totalCopies).toBe(2)
  })
})
