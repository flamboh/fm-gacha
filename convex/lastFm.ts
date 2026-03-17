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

export const lastFmError = (
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

const fetchLastFm = async <T extends LastFmErrorResponse>(
  apiKey: string,
  method: string,
  params: Record<string, string>,
  errorConfig: LastFmErrorConfig,
) => {
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

const normalizeGenre = (genre: string) => genre.trim().toLowerCase()

const dedupeGenres = (genres: string[]) => {
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

export const fetchTrackInfo = async (
  apiKey: string,
  artist: string,
  track: string,
) =>
  fetchLastFm<LastFmTrackInfoResponse>(
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

export const fetchArtistGenres = async (apiKey: string, artist: string) => {
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
