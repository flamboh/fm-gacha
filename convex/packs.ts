import { ConvexError, v } from 'convex/values'
import { action, query } from './_generated/server'
import { internal } from './_generated/api'
import { packValidator } from './packModel'
import type { PackCard, PackRarity, StoredPack } from './packModel'

const PACK_SIZE = 5
const PACK_TAGS = [
  // east asia
  'k-pop',
  'j-pop',
  'city pop',
  'k-indie',
  'c-pop',
  'cantopop',
  'enka',
  'vkei',
  'anime',
  'taiwan indie',
  // southeast asia
  'thai pop',
  'vietnamese pop',
  'filipiniana',
  'singapore pop',
  'indonesian indie',
  // south asia
  'bollywood',
  'tamil cinema',
  'telugu cinema',
  'kannada cinema',
  'malayalam cinema',
  'bhangra',
  'qawwali',
  'indian classical',
  'hindustani',
  'carnatic',
  'pakistani pop',
  'bangladeshi folk',
  // middle east
  'arabic pop',
  'rai',
  'gnawa',
  'maqam',
  'turkish folk',
  'turkish pop',
  'anatolian rock',
  'persian pop',
  'israeli folk',
  'levantine pop',
  // africa
  'afrobeats',
  'amapiano',
  'gqom',
  'highlife',
  'congolese rumba',
  'soukous',
  'juju',
  'griot',
  'makossa',
  'mbalax',
  'sudanese pop',
  'ethiowave',
  'ethiopian jazz',
  'rwandan pop',
  'tanzanian pop',
  'amapiano',
  'kwaito',
  // latin america
  'bossa nova',
  'mpb',
  'tropicália',
  'forró',
  'sertanejo',
  'axé',
  'bebop',
  'samba',
  'choro',
  'bachata',
  'merengue',
  'salsa',
  'cumbia',
  'champeta',
  'reggaeton',
  'trap latino',
  'corridos',
  'banda',
  'ranchera',
  'tango',
  'bolero',
  'son cubano',
  // europe
  'french pop',
  'chanson',
  'gypsy jazz',
  'flamenco',
  'krautrock',
  'deutsche elektronische musik',
  'soviet wave',
  'russian punk',
  'greek pop',
  'scandinavian indie',
  'britpop',
  'scottish folk',
  'irish folk',
  'punk',
  'post-punk',
  // north america
  'country',
  'bluegrass',
  'americana',
  'alt-country',
  'outlaw country',
  'country pop',
  'country rap',
  'corridos tumbados',
  'folk',
  'blues',
  'jazz',
  'bebop',
  'cool jazz',
  'free jazz',
  'soul',
  'neo soul',
  'motown',
  'funk',
  'disco',
  'spoken word',
  // blues & soul
  'delta blues',
  'chicago blues',
  'memphis soul',
  'philadelphia soul',
  'rnb',
  'contemporary rnb',
  'experimental soul',
  // pop variants
  'art pop',
  'dream pop',
  'alt-pop',
  'synth-pop',
  'electropop',
  'dance-pop',
  'synthwave',
  'vaporwave',
  'chillwave',
  'bedroom pop',
  'pop punk',
  'power pop',
  // rock variants
  'indie rock',
  'alternative rock',
  'alternative',
  'progressive rock',
  'psychedelic rock',
  'psychedelic pop',
  'shoegaze',
  'post-rock',
  'noise rock',
  'glam rock',
  'hard rock',
  'rock and roll',
  'garage rock',
  'surf rock',
  'stoner rock',
  'grunge',
  // metal variants
  'metal',
  'heavy metal',
  'thrash metal',
  'death metal',
  'black metal',
  'doom metal',
  'symphonic metal',
  'metalcore',
  'nu metal',
  'alternative metal',
  'progressive metal',
  'industrial metal',
  'folk metal',
  'viking metal',
  'melodic metal',
  // metal subgenres
  'screamo',
  'skramz',
  'mathcore',
  'deathcore',
  'hardcore',
  'post-hardcore',
  // electronic & dance
  'electronic',
  'house',
  'deep house',
  'acid house',
  'tech house',
  'minimal house',
  'progressive house',
  'techno',
  'minimal techno',
  'industrial techno',
  'acid techno',
  'detroit techno',
  'berlijn techno',
  'trance',
  'progressive trance',
  'psytrance',
  'goa trance',
  'downtempo',
  'ambient',
  'dark ambient',
  'drone',
  'ambient techno',
  'IDM',
  'glitch',
  'leftfield',
  'experimental electronic',
  'electroacoustic',
  'musique concrète',
  'industrial',
  'industrial noise',
  'power electronics',
  // electronic dance subgenres
  'dubstep',
  'riddim',
  'brostep',
  'wobble bass',
  'deep dubstep',
  'post-dubstep',
  'drum and bass',
  'jungle',
  'liquid funk',
  'liquid drum and bass',
  'neurofunk',
  'dnb',
  'breakcore',
  'hardcore',
  'happy hardcore',
  'uk garage',
  'dubstep garage',
  'grime',
  'garage',
  'uk funky',
  'complextro',
  'future bass',
  'trap',
  'future trap',
  'cloud rap',
  'witch house',
  'crunk',
  'electro house',
  'electro',
  'electro swing',
  'big room house',
  'progressive electro house',
  // hip-hop & rap
  'hip-hop',
  'rap',
  'underground hip-hop',
  'abstract hip-hop',
  'conscious hip-hop',
  'boom bap',
  'cloud rap',
  'emo rap',
  'emo hip-hop',
  'trap',
  'southern trap',
  'chicago trap',
  'memphis trap',
  'atlanta trap',
  'plugg',
  'plugg beats',
  'melodic trap',
  'dark trap',
  'future trap',
  'trap metal',
  'horrorcore',
  'gangsta rap',
  'west coast hip-hop',
  'east coast hip-hop',
  'midwest hip-hop',
  'southern hip-hop',
  'crunk',
  'snap music',
  'chopped and screwed',
  'phonk',
  'vaporhop',
  'jerk',
  'stepper',
  'digicore',
  'rage beats',
  'nerdcore',
  // experimental & niche
  'experimental',
  'noise',
  'avant-garde',
  'art music',
  'classical',
  'contemporary classical',
  'neo-classical',
  'minimalism',
  'symphonic',
  'orchestral',
  'chamber music',
  'baroque',
  'romantic',
  'opera',
  'musical theater',
  'soundtrack',
  'video game music',
  'chiptune',
  '8-bit',
  '16-bit',
  'bitpop',
  'demoscene',
  'breakbeat',
  'big beat',
  'trip hop',
  'downtempo',
  'lofi',
  'lo-fi hip-hop',
  'sample-based',
  'beat tape',
  'jazz fusion',
  'fusion',
  'world fusion',
  'ethno-jazz',
  'acid jazz',
  'smooth jazz',
  'jazz fusion',
  // specialty
  'comedy',
  'novelty',
  'children music',
  'spoken word',
  'poetry',
  'audiobook',
  'asmr',
  'vaporwave',
  'vaporhop',
  'hyperpunk',
  'hyperpop',
  'rage beats',
  'dark hyperpop',
  'metalblackgaze',
  'indietronica',
  'folktronica',
  'folkwave',
  'britwave',
  'hypermusicology',
  'maximalist',
  'minimalism',
  'microtonality',
  'aleatoric',
  'spectral music',
  'semiotics',
  'concrète',
  'live coding',
  // user-created or very niche
  'singer-songwriter',
  'acoustic',
  'unplugged',
  'stripped',
  'lo-fi acoustic',
  'folk rock',
  'contemporary folk',
  'anti-folk',
  'alt folk',
  'indie folk',
  'art rock',
  'avant-pop',
  'chamber pop',
  'chamber rock',
  'indie pop',
  'twee pop',
  'steampunk',
  'goblin core',
  'goblin music',
  'meme music',
  'dariacore',
  'hyperflip',
  'bubble bass',
  'cutecore',
  'kawaii metal',
  'furry',
  'pirate metal',
  'pirate black metal',
  'circus metal',
  'deathjazz',
  'fluxus',
  'happening',
  'performance art',
  'live art',
  'ritual ambient',
  'dark folk',
  'witch house',
  'darkwave',
  'coldwave',
  'ethereal wave',
  'new wave',
  'synth-punk',
  'synth-pop',
  'elektropunk',
  'pixel metal',
  'nintendocore',
  'gameboy music',
  'tracker music',
  'modular',
  'patch music',
  'patch sessions',
  'prepared piano',
  'extended techniques',
  'plunderphonics',
  'collage',
  'montage',
  'cut-up',
  'mashup',
  'bootleg',
  'parody',
  'satire',
  'absurdist music',
  'surreal',
  'oneiric',
  'dream music',
  'liminal',
  'backrooms',
  'uncanny valley',
  'proto-industrial',
  'pre-industrial',
  'post-industrial',
  'cyber',
  'cyberpunk',
  'synthgoth',
  'futurepop',
  'electro-goth',
  'medieval synth',
  'renaissance faire',
  'viking music',
  'celtic ambient',
  'druidic',
  'pagan',
  'neofolk',
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
  // assign random tag to each slot
  const slotTags: (typeof PACK_TAGS)[number][] = []
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
    themeTag: sampleOne(slotTags) ?? PACK_TAGS[0],
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
