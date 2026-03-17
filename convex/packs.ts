import { ConvexError, v } from 'convex/values'
import { action, query } from './_generated/server'
import { internal } from './_generated/api'
import { packValidator } from './packModel'
import type { PackCard, PackRarity, StoredPack } from './packModel'

const PACK_SIZE = 5
const PACK_TAGS = [
  'art pop',
  'electronic',
  'hip-hop',
  'house',
  'indie',
  'jazz',
  'metal',
  'neo soul',
  'post-punk',
  'shoegaze',
] as const

type LastFmTrack = {
  name: string
  playcount?: string
  listeners?: string
  url: string
  artist?: { name?: string } | string
}

type LastFmTrackInfo = {
  track?: {
    name?: string
    url?: string
    duration?: string
    album?: {
      title?: string
    }
  }
}

type TrackPoolEntry = Omit<
  PackCard,
  'slot' | 'album' | 'durationMs' | 'rarity'
> & {
  popularity: number
}

const parseCount = (value: string | undefined) => {
  if (!value) {
    return 0
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeTrack = (
  track: LastFmTrack,
  sourceTag: string,
): TrackPoolEntry | null => {
  const artist =
    typeof track.artist === 'string' ? track.artist : track.artist?.name

  if (!track.name || !artist || !track.url) {
    return null
  }

  const listeners = parseCount(track.listeners)
  const playcount = parseCount(track.playcount)

  return {
    title: track.name,
    artist,
    lastFmUrl: track.url,
    listeners,
    playcount,
    sourceTag,
    popularity: Math.log10(Math.max(playcount + listeners, 1)),
  }
}

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const sampleUnique = <T>(items: readonly T[], count: number) => {
  const pool = [...items]
  const picked: T[] = []

  while (pool.length > 0 && picked.length < count) {
    const index = getRandomInt(0, pool.length - 1)
    const [item] = pool.splice(index, 1)
    picked.push(item)
  }

  return picked
}

const sampleOne = <T>(items: readonly T[]) => {
  if (items.length === 0) {
    return null
  }

  return items[getRandomInt(0, items.length - 1)] ?? null
}

const lastFmError = (
  code: string,
  message: string,
  extra?: Record<string, string | number>,
): never => {
  throw new ConvexError({
    code,
    message,
    ...extra,
  })
}

const readLastFmApiKey = (): string => {
  const apiKey = process.env.LASTFM_API_KEY?.trim()
  if (!apiKey) {
    lastFmError(
      'MISSING_LASTFM_API_KEY',
      'Missing required env var: LASTFM_API_KEY',
    )
  }

  return apiKey as string
}

const assignRarity = (
  entry: TrackPoolEntry,
  thresholds: { uncommon: number; rare: number; mythic: number },
): PackRarity => {
  if (entry.popularity <= thresholds.mythic) {
    return 'mythic'
  }
  if (entry.popularity <= thresholds.rare) {
    return 'rare'
  }
  if (entry.popularity <= thresholds.uncommon) {
    return 'uncommon'
  }
  return 'common'
}

const quantile = (values: number[], ratio: number) => {
  if (values.length === 0) {
    return 0
  }

  const index = Math.min(
    values.length - 1,
    Math.max(0, Math.floor((values.length - 1) * ratio)),
  )
  return values[index] ?? 0
}

const dedupePool = (entries: TrackPoolEntry[]) => {
  const seen = new Set<string>()
  const deduped: TrackPoolEntry[] = []

  for (const entry of entries) {
    const key = `${entry.artist.toLowerCase()}::${entry.title.toLowerCase()}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(entry)
  }

  return deduped
}

const pickCards = async (apiKey: string) => {
  const selectedTags = sampleUnique(PACK_TAGS, 3)
  const poolResponses = await Promise.all(
    selectedTags.map(async (tag) => {
      const url = new URL('https://ws.audioscrobbler.com/2.0/')
      url.searchParams.set('method', 'tag.getTopTracks')
      url.searchParams.set('tag', tag)
      url.searchParams.set('page', String(getRandomInt(1, 8)))
      url.searchParams.set('limit', '50')
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('format', 'json')

      const response = await fetch(url)
      if (!response.ok) {
        lastFmError('LASTFM_REQUEST_FAILED', 'Last.fm request failed', {
          status: response.status,
        })
      }

      const data = (await response.json()) as {
        error?: number
        message?: string
        tracks?: { track?: LastFmTrack[] }
      }

      if (data.error) {
        lastFmError(
          'LASTFM_API_ERROR',
          data.message ?? 'Last.fm returned an error',
          { lastFmError: data.error },
        )
      }

      return {
        tag,
        tracks: (data.tracks?.track ?? [])
          .map((track) => normalizeTrack(track, tag))
          .filter((track): track is TrackPoolEntry => track !== null),
      }
    }),
  )

  const pool = dedupePool(poolResponses.flatMap((response) => response.tracks))
  if (pool.length < PACK_SIZE) {
    lastFmError(
      'PACK_POOL_TOO_SMALL',
      'Last.fm pool too small for pack generation',
    )
  }

  const sortedPopularity = pool
    .map((entry) => entry.popularity)
    .sort((left, right) => left - right)

  const thresholds = {
    uncommon: quantile(sortedPopularity, 0.45),
    rare: quantile(sortedPopularity, 0.2),
    mythic: quantile(sortedPopularity, 0.06),
  }

  const mythicPool = pool.filter(
    (entry) => entry.popularity <= thresholds.mythic,
  )
  const rarePool = pool.filter(
    (entry) =>
      entry.popularity <= thresholds.rare &&
      entry.popularity > thresholds.mythic,
  )
  const uncommonPool = pool.filter(
    (entry) =>
      entry.popularity <= thresholds.uncommon &&
      entry.popularity > thresholds.rare,
  )
  const commonPool = pool.filter(
    (entry) => entry.popularity > thresholds.uncommon,
  )

  const chosenEntries = [
    sampleOne(commonPool) ?? sampleOne(pool),
    sampleOne(commonPool) ?? sampleOne(pool),
    sampleOne(uncommonPool) ?? sampleOne(pool),
    sampleOne(rarePool) ?? sampleOne(uncommonPool) ?? sampleOne(pool),
    sampleOne(mythicPool) ?? sampleOne(rarePool) ?? sampleOne(pool),
  ].filter((entry): entry is TrackPoolEntry => entry !== null)

  const uniqueChosen = dedupePool(chosenEntries)
  const toppedUp = [...uniqueChosen]

  while (toppedUp.length < PACK_SIZE) {
    const candidate = sampleOne(pool)
    if (!candidate) {
      break
    }

    const exists = toppedUp.some(
      (entry) =>
        entry.artist === candidate.artist && entry.title === candidate.title,
    )

    if (!exists) {
      toppedUp.push(candidate)
    }
  }

  if (toppedUp.length < PACK_SIZE) {
    lastFmError('PACK_ASSEMBLY_FAILED', 'Could not assemble five unique tracks')
  }

  const enriched = await Promise.all(
    toppedUp.slice(0, PACK_SIZE).map(async (entry, index) => {
      const url = new URL('https://ws.audioscrobbler.com/2.0/')
      url.searchParams.set('method', 'track.getInfo')
      url.searchParams.set('artist', entry.artist)
      url.searchParams.set('track', entry.title)
      url.searchParams.set('autocorrect', '1')
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('format', 'json')

      const response = await fetch(url)
      if (!response.ok) {
        lastFmError('TRACK_INFO_REQUEST_FAILED', 'Track metadata failed', {
          status: response.status,
        })
      }

      const data = (await response.json()) as LastFmTrackInfo & {
        error?: number
        message?: string
      }

      if (data.error) {
        lastFmError(
          'TRACK_INFO_API_ERROR',
          data.message ?? 'Track metadata fetch failed',
          { lastFmError: data.error },
        )
      }

      const durationMs = parseCount(data.track?.duration)

      return {
        slot: index + 1,
        title: data.track?.name ?? entry.title,
        artist: entry.artist,
        album: data.track?.album?.title,
        lastFmUrl: data.track?.url ?? entry.lastFmUrl,
        listeners: entry.listeners,
        playcount: entry.playcount,
        durationMs: durationMs > 0 ? durationMs : undefined,
        sourceTag: entry.sourceTag,
        rarity: assignRarity(entry, thresholds),
      } satisfies PackCard
    }),
  )

  return {
    cards: enriched,
    themeTag: sampleOne(selectedTags) ?? selectedTags[0],
  }
}

export const listRecent = query({
  args: {
    ownerKey: v.string(),
  },
  returns: v.array(packValidator),
  handler: async (ctx, args) => {
    const packs = await ctx.db
      .query('packOpens')
      .withIndex('by_owner_opened_at', (q) => q.eq('ownerKey', args.ownerKey))
      .order('desc')
      .take(6)

    return packs.map(({ ownerKey, openedAt, themeTag, cards }) => ({
      ownerKey,
      openedAt,
      themeTag,
      cards,
    }))
  },
})

export const openPack = action({
  args: {
    ownerKey: v.string(),
  },
  returns: packValidator,
  handler: async (ctx, args): Promise<StoredPack> => {
    const apiKey = readLastFmApiKey()
    const openedAt = Date.now()
    const { cards, themeTag } = await pickCards(apiKey)

    return await ctx.runMutation(internal.packWrites.storeOpenedPack, {
      ownerKey: args.ownerKey,
      openedAt,
      themeTag,
      cards,
    })
  },
})
