import { v } from 'convex/values'

export const rarityValidator = v.union(
  v.literal('common'),
  v.literal('uncommon'),
  v.literal('rare'),
  v.literal('mythic'),
)

export const packCardValidator = v.object({
  slot: v.number(),
  title: v.string(),
  artist: v.string(),
  artistGenres: v.optional(v.array(v.string())),
  album: v.optional(v.string()),
  lastFmUrl: v.string(),
  listeners: v.number(),
  playcount: v.number(),
  playListenerRatio: v.optional(v.number()),
  imageUrl: v.optional(v.string()),
  publishedAt: v.optional(v.string()),
  wikiSummary: v.optional(v.string()),
  durationMs: v.optional(v.number()),
  sourceTag: v.string(),
  rarity: rarityValidator,
})

export const openedPackFields = {
  themeTag: v.string(),
  cards: v.array(packCardValidator),
}

export const openedPackValidator = v.object(openedPackFields)

export type PackRarity = 'common' | 'uncommon' | 'rare' | 'mythic'

export type PackCard = {
  slot: number
  title: string
  artist: string
  artistGenres?: string[]
  album?: string
  lastFmUrl: string
  listeners: number
  playcount: number
  playListenerRatio?: number
  imageUrl?: string
  publishedAt?: string
  wikiSummary?: string
  durationMs?: number
  sourceTag: string
  rarity: PackRarity
}

export type OpenedPack = {
  themeTag: string
  cards: PackCard[]
}
