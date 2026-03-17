type StoredGuestPack = {
  themeTag: string
  cards: Array<{
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
    rarity: 'common' | 'uncommon' | 'rare' | 'mythic'
  }>
}

type GuestPackState = {
  packsOpened: number
  lastPack: StoredGuestPack | null
}

const GUEST_PACK_STATE_KEY = 'fm-gacha.guest-pack-state'

export const GUEST_PACK_LIMIT = 1

export function readGuestPackState(): GuestPackState {
  const storedState = window.localStorage.getItem(GUEST_PACK_STATE_KEY)
  if (!storedState) {
    return {
      packsOpened: 0,
      lastPack: null,
    }
  }

  return JSON.parse(storedState) as GuestPackState
}

export function saveGuestPack(pack: StoredGuestPack, packsOpened: number) {
  const nextState = {
    packsOpened,
    lastPack: pack,
  } satisfies GuestPackState

  window.localStorage.setItem(GUEST_PACK_STATE_KEY, JSON.stringify(nextState))
  return nextState
}

export function clearGuestPackState() {
  window.localStorage.removeItem(GUEST_PACK_STATE_KEY)
}
