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

describe('getSummary', () => {
  it('returns zero stats for user with no collection', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.ensureViewer, {})

    const summary = await asUser.query(api.collection.getSummary, {})
    expect(summary).toEqual({
      uniqueSongs: 0,
      totalCopies: 0,
      commonCount: 0,
      uncommonCount: 0,
      rareCount: 0,
      mythicCount: 0,
    })
  })

  it('counts each rarity correctly', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.importGuestPack, {
      pack: {
        themeTag: 'indie',
        cards: [
          makeCard({ slot: 1, artist: 'A', title: 'a1', rarity: 'common' }),
          makeCard({ slot: 2, artist: 'B', title: 'b1', rarity: 'uncommon' }),
          makeCard({ slot: 3, artist: 'C', title: 'c1', rarity: 'rare' }),
          makeCard({ slot: 4, artist: 'D', title: 'd1', rarity: 'mythic' }),
          makeCard({ slot: 5, artist: 'E', title: 'e1', rarity: 'common' }),
        ],
      },
    })

    const summary = await asUser.query(api.collection.getSummary, {})
    expect(summary.uniqueSongs).toBe(5)
    expect(summary.totalCopies).toBe(5)
    expect(summary.commonCount).toBe(2)
    expect(summary.uncommonCount).toBe(1)
    expect(summary.rareCount).toBe(1)
    expect(summary.mythicCount).toBe(1)
  })

  it('accumulates totalCopies across duplicates', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    const pack = {
      themeTag: 'indie',
      cards: [makeCard({ slot: 1, artist: 'Radiohead', title: 'Creep' })],
    }
    await asUser.mutation(api.users.importGuestPack, { pack })
    await asUser.mutation(api.users.importGuestPack, { pack })
    await asUser.mutation(api.users.importGuestPack, { pack })

    const summary = await asUser.query(api.collection.getSummary, {})
    expect(summary.uniqueSongs).toBe(1)
    expect(summary.totalCopies).toBe(3)
  })

  it('throws when unauthenticated', async () => {
    const t = convexTest(schema, modules)
    await expect(t.query(api.collection.getSummary, {})).rejects.toThrow(
      'Not authenticated',
    )
  })
})

describe('listPage', () => {
  it('returns empty page for user with no collection', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.ensureViewer, {})

    const result = await asUser.query(api.collection.listPage, {
      sort: 'recent',
      paginationOpts: { numItems: 20, cursor: null },
    })
    expect(result.page).toHaveLength(0)
    expect(result.isDone).toBe(true)
  })

  it('returns entries with joined song data', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.importGuestPack, {
      pack: {
        themeTag: 'indie',
        cards: [
          makeCard({
            slot: 1,
            artist: 'Radiohead',
            title: 'Creep',
            rarity: 'rare',
          }),
        ],
      },
    })

    const result = await asUser.query(api.collection.listPage, {
      sort: 'recent',
      paginationOpts: { numItems: 20, cursor: null },
    })

    expect(result.page).toHaveLength(1)
    const entry = result.page[0]
    expect(entry.artist).toBe('Radiohead')
    expect(entry.title).toBe('Creep')
    expect(entry.rarity).toBe('rare')
    expect(entry.copyCount).toBe(1)
    expect(entry.sourceTag).toBe('indie')
  })

  it('sorts by artist name ascending', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.importGuestPack, {
      pack: {
        themeTag: 'indie',
        cards: [
          makeCard({ slot: 1, artist: 'Radiohead', title: 'Creep' }),
          makeCard({ slot: 2, artist: 'Blur', title: 'Song 2' }),
          makeCard({ slot: 3, artist: 'Oasis', title: 'Wonderwall' }),
        ],
      },
    })

    const result = await asUser.query(api.collection.listPage, {
      sort: 'artist',
      paginationOpts: { numItems: 20, cursor: null },
    })

    const artists = result.page.map((e) => e.artist)
    expect(artists).toEqual(['Blur', 'Oasis', 'Radiohead'])
  })

  it('sorts by title ascending', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.importGuestPack, {
      pack: {
        themeTag: 'indie',
        cards: [
          makeCard({ slot: 1, artist: 'Various', title: 'Zebra' }),
          makeCard({ slot: 2, artist: 'Various', title: 'Apple' }),
          makeCard({ slot: 3, artist: 'Various', title: 'Mango' }),
        ],
      },
    })

    const result = await asUser.query(api.collection.listPage, {
      sort: 'title',
      paginationOpts: { numItems: 20, cursor: null },
    })

    const titles = result.page.map((e) => e.title)
    expect(titles).toEqual(['Apple', 'Mango', 'Zebra'])
  })

  it('sorts by rarity descending (mythic first)', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    await asUser.mutation(api.users.importGuestPack, {
      pack: {
        themeTag: 'indie',
        cards: [
          makeCard({
            slot: 1,
            artist: 'A',
            title: 'common song',
            rarity: 'common',
          }),
          makeCard({
            slot: 2,
            artist: 'B',
            title: 'mythic song',
            rarity: 'mythic',
          }),
          makeCard({
            slot: 3,
            artist: 'C',
            title: 'rare song',
            rarity: 'rare',
          }),
        ],
      },
    })

    const result = await asUser.query(api.collection.listPage, {
      sort: 'rarity',
      paginationOpts: { numItems: 20, cursor: null },
    })

    const rarities = result.page.map((e) => e.rarity)
    expect(rarities[0]).toBe('mythic')
    expect(rarities[1]).toBe('rare')
    expect(rarities[2]).toBe('common')
  })

  it('paginates with cursor', async () => {
    const t = convexTest(schema, modules)
    const asUser = t.withIdentity(VIEWER)
    const cards = Array.from({ length: 5 }, (_, i) =>
      makeCard({ slot: i + 1, artist: `Artist${i}`, title: `Track${i}` }),
    )
    await asUser.mutation(api.users.importGuestPack, {
      pack: { themeTag: 'indie', cards },
    })

    const page1 = await asUser.query(api.collection.listPage, {
      sort: 'title',
      paginationOpts: { numItems: 3, cursor: null },
    })
    expect(page1.page).toHaveLength(3)
    expect(page1.isDone).toBe(false)

    const page2 = await asUser.query(api.collection.listPage, {
      sort: 'title',
      paginationOpts: { numItems: 3, cursor: page1.continueCursor },
    })
    expect(page2.page).toHaveLength(2)
    expect(page2.isDone).toBe(true)
  })

  it('throws when unauthenticated', async () => {
    const t = convexTest(schema, modules)
    await expect(
      t.query(api.collection.listPage, {
        sort: 'recent',
        paginationOpts: { numItems: 20, cursor: null },
      }),
    ).rejects.toThrow('Not authenticated')
  })
})
