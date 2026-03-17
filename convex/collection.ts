import {
  paginationOptsValidator,
  paginationResultValidator,
} from 'convex/server'
import { query } from './_generated/server'
import {
  collectionPageItemValidator,
  collectionSortValidator,
  collectionSummaryValidator,
} from './collectionModel'
import type { CollectionSort } from './collectionModel'
import { requireUser } from './auth'
import { getUserByClerkId } from './userModel'

const emptyCollectionPage = {
  page: [],
  isDone: true,
  continueCursor: '',
}

export const listPage = query({
  args: {
    paginationOpts: paginationOptsValidator,
    sort: collectionSortValidator,
  },
  returns: paginationResultValidator(collectionPageItemValidator),
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx)
    const user = await getUserByClerkId(ctx, identity.subject)

    if (!user) {
      return emptyCollectionPage
    }

    let collectionQuery

    switch (args.sort satisfies CollectionSort) {
      case 'artist':
        collectionQuery = ctx.db
          .query('userCollectionEntries')
          .withIndex('by_user_and_artist_sort', (q) => q.eq('userId', user._id))
          .order('asc')
        break
      case 'title':
        collectionQuery = ctx.db
          .query('userCollectionEntries')
          .withIndex('by_user_and_title_sort', (q) => q.eq('userId', user._id))
          .order('asc')
        break
      case 'rarity':
        collectionQuery = ctx.db
          .query('userCollectionEntries')
          .withIndex('by_user_and_rarity_rank', (q) => q.eq('userId', user._id))
          .order('desc')
        break
      case 'recent':
        collectionQuery = ctx.db
          .query('userCollectionEntries')
          .withIndex('by_user_and_last_collected_at', (q) =>
            q.eq('userId', user._id),
          )
          .order('desc')
        break
    }

    const page = await collectionQuery.paginate(args.paginationOpts)

    return {
      ...page,
      page: await Promise.all(
        page.page.map(async (entry) => {
          const song = await ctx.db.get(entry.songId)
          if (!song) {
            throw new Error('Discovered song missing')
          }

          return {
            _id: entry._id,
            songId: entry.songId,
            copyCount: entry.copyCount,
            firstCollectedAt: entry.firstCollectedAt,
            lastCollectedAt: entry.lastCollectedAt,
            artist: song.artist,
            title: song.title,
            artistGenres: song.artistGenres,
            album: song.album,
            lastFmUrl: song.lastFmUrl,
            listeners: song.listeners,
            playcount: song.playcount,
            playListenerRatio: song.playListenerRatio,
            publishedAt: song.publishedAt,
            wikiSummary: song.wikiSummary,
            durationMs: song.durationMs,
            sourceTag: song.sourceTag,
            rarity: entry.rarity,
            imageUrl: song.imageUrl,
          }
        }),
      ),
    }
  },
})

export const getSummary = query({
  args: {},
  returns: collectionSummaryValidator,
  handler: async (ctx) => {
    const identity = await requireUser(ctx)
    const user = await getUserByClerkId(ctx, identity.subject)

    if (!user) {
      return {
        uniqueSongs: 0,
        totalCopies: 0,
        commonCount: 0,
        uncommonCount: 0,
        rareCount: 0,
        mythicCount: 0,
      }
    }

    const entries = await ctx.db
      .query('userCollectionEntries')
      .withIndex('by_user_and_last_collected_at', (q) =>
        q.eq('userId', user._id),
      )
      .collect()

    let totalCopies = 0
    let commonCount = 0
    let uncommonCount = 0
    let rareCount = 0
    let mythicCount = 0

    for (const entry of entries) {
      totalCopies += entry.copyCount

      switch (entry.rarity) {
        case 'common':
          commonCount += 1
          break
        case 'uncommon':
          uncommonCount += 1
          break
        case 'rare':
          rareCount += 1
          break
        case 'mythic':
          mythicCount += 1
          break
      }
    }

    return {
      uniqueSongs: entries.length,
      totalCopies,
      commonCount,
      uncommonCount,
      rareCount,
      mythicCount,
    }
  },
})
