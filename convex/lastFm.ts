import { ConvexError } from 'convex/values'

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/'
const ARTIST_GENRE_LIMIT = 3

type LastFmErrorResponse = {
  error?: number
  message?: string
}

export type LastFmTrack = {
  name: string
  playcount?: string
  listeners?: string
  url: string
  artist?: { name?: string } | string
}

export type LastFmTrackInfo = {
  track?: {
    name?: string
    url?: string
    listeners?: string
    playcount?: string
    duration?: string
    album?: {
      title?: string
    }
  }
}

type LastFmTag = {
  name?: string
}

type LastFmTrackInfoResponse = LastFmTrackInfo & LastFmErrorResponse

type LastFmArtistTopTagsResponse = LastFmErrorResponse & {
  toptags?: {
    tag?: LastFmTag[] | LastFmTag
  }
}

type LastFmErrorConfig = {
  requestCode: string
  requestMessage: string
  apiCode: string
  apiMessage: string
}

export function lastFmError(
  code: string,
  message: string,
  extra?: Record<string, string | number>,
): never {
  throw new ConvexError({
    code,
    message,
    ...extra,
  })
}

async function fetchLastFm<T extends LastFmErrorResponse>(
  apiKey: string,
  method: string,
  params: Record<string, string>,
  errorConfig: LastFmErrorConfig,
): Promise<T> {
  const url = new URL(LASTFM_API_URL)
  url.searchParams.set('method', method)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('format', 'json')

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url)
  if (!response.ok) {
    lastFmError(errorConfig.requestCode, errorConfig.requestMessage, {
      status: response.status,
    })
  }

  const data = (await response.json()) as T
  if (data.error) {
    lastFmError(errorConfig.apiCode, data.message ?? errorConfig.apiMessage, {
      lastFmError: data.error,
    })
  }

  return data
}

function normalizeGenre(genre: string): string {
  return genre.trim().toLowerCase()
}

function dedupeGenres(genres: string[]): string[] {
  const seen = new Set<string>()
  const deduped: string[] = []

  for (const genre of genres) {
    const normalized = normalizeGenre(genre)
    if (!normalized || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    deduped.push(normalized)
  }

  return deduped
}

export async function fetchTrackInfo(
  apiKey: string,
  artist: string,
  track: string,
): Promise<LastFmTrackInfo> {
  return fetchLastFm<LastFmTrackInfoResponse>(
    apiKey,
    'track.getInfo',
    {
      artist,
      track,
      autocorrect: '1',
    },
    {
      requestCode: 'TRACK_INFO_REQUEST_FAILED',
      requestMessage: 'Track metadata failed',
      apiCode: 'TRACK_INFO_API_ERROR',
      apiMessage: 'Track metadata fetch failed',
    },
  )
}

export async function fetchArtistGenres(
  apiKey: string,
  artist: string,
): Promise<string[]> {
  const data = await fetchLastFm<LastFmArtistTopTagsResponse>(
    apiKey,
    'artist.getTopTags',
    {
      artist,
      autocorrect: '1',
    },
    {
      requestCode: 'ARTIST_TAGS_REQUEST_FAILED',
      requestMessage: 'Artist tags failed',
      apiCode: 'ARTIST_TAGS_API_ERROR',
      apiMessage: 'Artist tags fetch failed',
    },
  )

  const tags = Array.isArray(data.toptags?.tag)
    ? data.toptags.tag
    : data.toptags?.tag
      ? [data.toptags.tag]
      : []

  return dedupeGenres(
    tags.map((tag) => tag.name).filter((tag): tag is string => Boolean(tag)),
  ).slice(0, ARTIST_GENRE_LIMIT)
}
