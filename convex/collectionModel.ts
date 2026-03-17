import { v } from 'convex/values'
import { rarityValidator } from './packModel'
import type { PackRarity } from './packModel'

export const collectionSortValidator = v.union(
  v.literal('recent'),
  v.literal('artist'),
  v.literal('title'),
  v.literal('rarity'),
)

export const discoveredSongFields = {
  songKey: v.string(),
  artist: v.string(),
  title: v.string(),
  artistGenres: v.optional(v.array(v.string())),
  album: v.optional(v.string()),
  lastFmUrl: v.string(),
  listeners: v.number(),
  playcount: v.number(),
  playListenerRatio: v.optional(v.number()),
  publishedAt: v.optional(v.string()),
  wikiSummary: v.optional(v.string()),
  durationMs: v.optional(v.number()),
  sourceTag: v.string(),
  rarity: rarityValidator,
  rarityRank: v.number(),
  imageUrl: v.optional(v.string()),
  imageUpdatedAt: v.optional(v.number()),
}

export const userCollectionEntryFields = {
  userId: v.id('users'),
  songId: v.id('discoveredSongs'),
  copyCount: v.number(),
  firstCollectedAt: v.number(),
  lastCollectedAt: v.number(),
  favorite: v.optional(v.boolean()),
  artistSort: v.string(),
  titleSort: v.string(),
  rarity: rarityValidator,
  rarityRank: v.number(),
}

export const collectionPageItemValidator = v.object({
  _id: v.id('userCollectionEntries'),
  songId: v.id('discoveredSongs'),
  copyCount: v.number(),
  firstCollectedAt: v.number(),
  lastCollectedAt: v.number(),
  artist: v.string(),
  title: v.string(),
  artistGenres: v.optional(v.array(v.string())),
  album: v.optional(v.string()),
  lastFmUrl: v.string(),
  listeners: v.number(),
  playcount: v.number(),
  playListenerRatio: v.optional(v.number()),
  publishedAt: v.optional(v.string()),
  wikiSummary: v.optional(v.string()),
  durationMs: v.optional(v.number()),
  sourceTag: v.string(),
  rarity: rarityValidator,
  imageUrl: v.optional(v.string()),
})

export const collectionSummaryValidator = v.object({
  uniqueSongs: v.number(),
  totalCopies: v.number(),
  commonCount: v.number(),
  uncommonCount: v.number(),
  rareCount: v.number(),
  mythicCount: v.number(),
})

export type CollectionSort = 'recent' | 'artist' | 'title' | 'rarity'

function normalizeCollectionValue(value: string) {
  return value.trim().toLocaleLowerCase()
}

export function getSongKey(artist: string, title: string) {
  return `${normalizeCollectionValue(artist)}::${normalizeCollectionValue(title)}`
}

export function getRarityRank(rarity: PackRarity) {
  switch (rarity) {
    case 'common':
      return 0
    case 'uncommon':
      return 1
    case 'rare':
      return 2
    case 'mythic':
      return 3
  }
}

export function getArtistSortValue(artist: string) {
  return normalizeCollectionValue(artist)
}

export function getTitleSortValue(title: string) {
  return normalizeCollectionValue(title)
}
