import { afterEach, describe, expect, it } from 'vitest'
import {
  GUEST_PACK_LIMIT,
  clearGuestPackState,
  readGuestPackState,
  saveGuestPack,
} from './guest-pack-storage'

const PACK: Parameters<typeof saveGuestPack>[0] = {
  themeTag: 'indie',
  cards: [
    {
      slot: 1,
      title: 'Creep',
      artist: 'Radiohead',
      lastFmUrl: 'https://www.last.fm/music/Radiohead/_/Creep',
      listeners: 5_000_000,
      playcount: 25_000_000,
      sourceTag: 'indie',
      rarity: 'rare',
    },
  ],
}

afterEach(() => {
  localStorage.clear()
})

describe('readGuestPackState', () => {
  it('returns defaults when storage is empty', () => {
    const state = readGuestPackState()
    expect(state.packsOpened).toBe(0)
    expect(state.lastPack).toBeNull()
  })
})

describe('saveGuestPack', () => {
  it('persists state that readGuestPackState returns', () => {
    saveGuestPack(PACK, 1)
    const state = readGuestPackState()
    expect(state.packsOpened).toBe(1)
    expect(state.lastPack).toEqual(PACK)
  })

  it('returns the saved state', () => {
    const result = saveGuestPack(PACK, 1)
    expect(result.packsOpened).toBe(1)
    expect(result.lastPack).toEqual(PACK)
  })

  it('overwrites previous state on second save', () => {
    saveGuestPack(PACK, 1)
    const updatedPack = { ...PACK, themeTag: 'rock' }
    saveGuestPack(updatedPack, 2)
    const state = readGuestPackState()
    expect(state.packsOpened).toBe(2)
    expect(state.lastPack?.themeTag).toBe('rock')
  })
})

describe('clearGuestPackState', () => {
  it('resets to defaults after clearing', () => {
    saveGuestPack(PACK, 1)
    clearGuestPackState()
    const state = readGuestPackState()
    expect(state.packsOpened).toBe(0)
    expect(state.lastPack).toBeNull()
  })

  it('is safe to call when storage is already empty', () => {
    expect(() => clearGuestPackState()).not.toThrow()
  })
})

describe('GUEST_PACK_LIMIT', () => {
  it('is a positive integer', () => {
    expect(GUEST_PACK_LIMIT).toBeGreaterThan(0)
    expect(Number.isInteger(GUEST_PACK_LIMIT)).toBe(true)
  })
})
