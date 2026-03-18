import { internalMutation } from './_generated/server'
import {
  getRarityRank,
  getSongKey,
  normalizeCollectionValue,
} from './collectionModel'
import type { MutationCtx } from './_generated/server'
import { packCardValidator } from './packModel'
import type { PackCard } from './packModel'
import { upsertUser, viewerSnapshotValidator } from './userModel'
import type { ViewerSnapshot } from './userModel'
import { v } from 'convex/values'

export async function storePackForViewer(
  ctx: MutationCtx,
  viewer: ViewerSnapshot,
  cards: PackCard[],
) {
  const userId = await upsertUser(ctx, viewer)
  const collectedAt = Date.now()

  for (const card of cards) {
    const rarityRank = getRarityRank(card.rarity)
    const songKey = getSongKey(card.artist, card.title)
    const existingSong = await ctx.db
      .query('discoveredSongs')
      .withIndex('by_song_key', (q) => q.eq('songKey', songKey))
      .unique()

    let songId
    if (!existingSong) {
      songId = await ctx.db.insert('discoveredSongs', {
        songKey,
        artist: card.artist,
        title: card.title,
        artistGenres: card.artistGenres,
        album: card.album,
        lastFmUrl: card.lastFmUrl,
        listeners: card.listeners,
        playcount: card.playcount,
        playListenerRatio: card.playListenerRatio,
        imageUrl: card.imageUrl,
        publishedAt: card.publishedAt,
        wikiSummary: card.wikiSummary,
        durationMs: card.durationMs,
        sourceTag: card.sourceTag,
        rarity: card.rarity,
        rarityRank,
      })
    } else {
      songId = existingSong._id

      const nextSongPatch = {
        artist: card.artist,
        title: card.title,
        artistGenres: card.artistGenres,
        album: card.album,
        lastFmUrl: card.lastFmUrl,
        listeners: card.listeners,
        playcount: card.playcount,
        playListenerRatio: card.playListenerRatio,
        imageUrl: card.imageUrl,
        publishedAt: card.publishedAt,
        wikiSummary: card.wikiSummary,
        durationMs: card.durationMs,
        sourceTag: card.sourceTag,
      }

      if (existingSong.rarityRank < rarityRank) {
        await ctx.db.patch(songId, {
          ...nextSongPatch,
          rarity: card.rarity,
          rarityRank,
        })
      } else {
        await ctx.db.patch(songId, nextSongPatch)
      }
    }

    const existingCollectionEntry = await ctx.db
      .query('userCollectionEntries')
      .withIndex('by_user_and_song_id', (q) =>
        q.eq('userId', userId).eq('songId', songId),
      )
      .unique()

    if (!existingCollectionEntry) {
      await ctx.db.insert('userCollectionEntries', {
        userId,
        songId,
        copyCount: 1,
        firstCollectedAt: collectedAt,
        lastCollectedAt: collectedAt,
        favorite: false,
        artistSort: normalizeCollectionValue(card.artist),
        titleSort: normalizeCollectionValue(card.title),
        rarity: card.rarity,
        rarityRank,
      })
      continue
    }

    const nextEntryPatch = {
      copyCount: existingCollectionEntry.copyCount + 1,
      lastCollectedAt: collectedAt,
      artistSort: normalizeCollectionValue(card.artist),
      titleSort: normalizeCollectionValue(card.title),
    }

    if (existingCollectionEntry.rarityRank < rarityRank) {
      await ctx.db.patch(existingCollectionEntry._id, {
        ...nextEntryPatch,
        rarity: card.rarity,
        rarityRank,
      })
      continue
    }

    await ctx.db.patch(existingCollectionEntry._id, nextEntryPatch)
  }
}

export const storeOpenedPackForViewer = internalMutation({
  args: {
    viewer: viewerSnapshotValidator,
    cards: v.array(packCardValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await storePackForViewer(ctx, args.viewer, args.cards)
    return null
  },
})
