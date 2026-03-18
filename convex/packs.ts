import { action } from './_generated/server'
import { internal } from './_generated/api'
import { openedPackValidator } from './packModel'
import type { OpenedPack, PackCard, PackRarity } from './packModel'
import { fetchArtistGenres, fetchTrackInfo, lastFmError } from './lastFm'
import type { LastFmTrack, LastFmTrackInfo } from './lastFm'
import { PACK_TAGS } from './packTags'
import type { PackTag } from './packTags'
import { getViewerSnapshot } from './userModel'

const PACK_SIZE = 5

type TrackPoolEntry = Omit<
  PackCard,
  'slot' | 'artistGenres' | 'album' | 'durationMs' | 'rarity'
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

const sampleOne = <T>(items: readonly T[]) => {
  if (items.length === 0) {
    return null
  }

  return items[getRandomInt(0, items.length - 1)] ?? null
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

function calculatePlayListenerRatio(
  playcount: number,
  listeners: number,
): number | undefined {
  if (listeners === 0) {
    return undefined
  }

  return playcount / listeners
}

function getTrackImageUrl(data: LastFmTrackInfo['track']): string | undefined {
  const imageUrl = data?.album?.image?.find((entry) => entry.size === 'extralarge')?.['#text']?.trim()
  return imageUrl || undefined
}

function getTrackWikiSummary(
  data: LastFmTrackInfo['track'],
): string | undefined {
  const summary = data?.wiki?.summary?.trim()
  if (!summary) {
    return undefined
  }

  const sanitized = summary
    .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()

  return sanitized || undefined
}

async function buildArtistGenresMap(
  apiKey: string,
  entries: TrackPoolEntry[],
): Promise<Map<string, string[]>> {
  const uniqueArtists = Array.from(
    new Set(entries.map((entry) => entry.artist)),
  )

  return new Map<string, string[]>(
    await Promise.all(
      uniqueArtists.map(
        async (artist): Promise<readonly [string, string[]]> => [
          artist,
          await fetchArtistGenres(apiKey, artist),
        ],
      ),
    ),
  )
}

const pickCards = async (apiKey: string) => {
  // assign random tag to each slot
  const slotTags: PackTag[] = []
  for (let i = 0; i < PACK_SIZE; i++) {
    slotTags.push(sampleOne(PACK_TAGS) ?? PACK_TAGS[0])
  }

  // fetch pools for unique tags
  const uniqueTags = Array.from(new Set(slotTags))
  const tagPoolMap = new Map<string, TrackPoolEntry[]>()

  await Promise.all(
    uniqueTags.map(async (tag) => {
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

      const tracks = dedupePool(
        (data.tracks?.track ?? [])
          .map((track: LastFmTrack) => normalizeTrack(track, tag))
          .filter((track): track is TrackPoolEntry => track !== null),
      )
      tagPoolMap.set(tag, tracks)
    }),
  )

  // build rarity thresholds
  const combinedPool = Array.from(tagPoolMap.values()).flat()
  if (combinedPool.length < PACK_SIZE) {
    lastFmError(
      'PACK_POOL_TOO_SMALL',
      'Last.fm pool too small for pack generation',
    )
  }

  const sortedPopularity = combinedPool
    .map((entry) => entry.popularity)
    .sort((left, right) => left - right)

  const thresholds = {
    uncommon: quantile(sortedPopularity, 0.45),
    rare: quantile(sortedPopularity, 0.2),
    mythic: quantile(sortedPopularity, 0.06),
  }

  // slot rarity distribution
  const rarityTargets: PackRarity[] = [
    'common',
    'common',
    'uncommon',
    'rare',
    'mythic',
  ]

  const chosenEntries: TrackPoolEntry[] = []
  const usedTracks = new Set<string>()

  for (let i = 0; i < PACK_SIZE; i++) {
    const targetRarity = rarityTargets[i]
    const targetTag = slotTags[i]
    const tagPool = tagPoolMap.get(targetTag) ?? []

    const rarityPool = tagPool.filter((entry) => {
      const rarity = assignRarity(entry, thresholds)
      return rarity === targetRarity
    })

    let chosen = sampleOne(rarityPool)

    if (!chosen) {
      const fallbackPool =
        targetRarity !== 'common'
          ? tagPool.filter(
              (entry) => assignRarity(entry, thresholds) !== 'common',
            )
          : tagPool

      chosen = sampleOne(fallbackPool)
    }

    if (!chosen) {
      const allRarityPool = combinedPool.filter(
        (entry) => assignRarity(entry, thresholds) === targetRarity,
      )
      chosen = sampleOne(allRarityPool)
    }

    if (!chosen) {
      chosen = sampleOne(combinedPool)
    }

    if (chosen) {
      const key = `${chosen.artist.toLowerCase()}::${chosen.title.toLowerCase()}`
      if (!usedTracks.has(key)) {
        chosenEntries.push(chosen)
        usedTracks.add(key)
      }
    }
  }

  const toppedUp = [...chosenEntries]

  while (toppedUp.length < PACK_SIZE) {
    const candidate = sampleOne(combinedPool)
    if (!candidate) {
      break
    }

    const key = `${candidate.artist.toLowerCase()}::${candidate.title.toLowerCase()}`
    if (!usedTracks.has(key)) {
      toppedUp.push(candidate)
      usedTracks.add(key)
    }
  }

  if (toppedUp.length < PACK_SIZE) {
    lastFmError('PACK_ASSEMBLY_FAILED', 'Could not assemble five unique tracks')
  }

  const selectedEntries = toppedUp.slice(0, PACK_SIZE)
  const artistGenres = await buildArtistGenresMap(apiKey, selectedEntries)

  const enriched = await Promise.all(
    selectedEntries.map(async (entry, index) => {
      const data = await fetchTrackInfo(apiKey, entry.artist, entry.title)

      const listeners = parseCount(data.track?.listeners)
      const playcount = parseCount(data.track?.playcount)
      const durationMs = parseCount(data.track?.duration)
      const playListenerRatio = calculatePlayListenerRatio(playcount, listeners)

      return {
        slot: index + 1,
        title: data.track?.name ?? entry.title,
        artist: entry.artist,
        artistGenres: artistGenres.get(entry.artist),
        album: data.track?.album?.title,
        lastFmUrl: data.track?.url ?? entry.lastFmUrl,
        listeners,
        playcount,
        playListenerRatio,
        imageUrl: getTrackImageUrl(data.track),
        publishedAt: data.track?.wiki?.published?.trim(),
        wikiSummary: getTrackWikiSummary(data.track),
        durationMs: durationMs > 0 ? durationMs : undefined,
        sourceTag: entry.sourceTag,
        rarity: assignRarity(entry, thresholds),
      } satisfies PackCard
    }),
  )

  return {
    cards: enriched,
    themeTag: sampleOne(slotTags) ?? PACK_TAGS[0],
  }
}

export const openPack = action({
  args: {},
  returns: openedPackValidator,
  handler: async (ctx): Promise<OpenedPack> => {
    const apiKey = process.env.LASTFM_API_KEY?.trim()
    if (!apiKey) {
      lastFmError('MISSING_LASTFM_API_KEY', 'Missing required env var: LASTFM_API_KEY')
    }
    const identity = await ctx.auth.getUserIdentity()
    const { cards, themeTag } = await pickCards(apiKey)

    if (identity) {
      await ctx.runMutation(
        internal.collectionWrites.storeOpenedPackForViewer,
        {
          viewer: getViewerSnapshot(identity),
          cards,
        },
      )
    }

    return {
      themeTag,
      cards,
    }
  },
})
