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
  durationMs: v.optional(v.number()),
  sourceTag: v.string(),
  rarity: rarityValidator,
})

export const packFields = {
  ownerKey: v.string(),
  openedAt: v.number(),
  themeTag: v.string(),
  cards: v.array(packCardValidator),
}

export const packValidator = v.object(packFields)

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
  durationMs?: number
  sourceTag: string
  rarity: PackRarity
}

export type StoredPack = {
  ownerKey: string
  openedAt: number
  themeTag: string
  cards: PackCard[]
}
