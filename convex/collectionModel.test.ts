import { describe, expect, it } from 'vitest'
import {
  getRarityRank,
  getSongKey,
  normalizeCollectionValue,
} from './collectionModel'

describe('normalizeCollectionValue', () => {
  it('lowercases', () => {
    expect(normalizeCollectionValue('The Beatles')).toBe('the beatles')
  })

  it('trims leading/trailing whitespace', () => {
    expect(normalizeCollectionValue('  Radiohead  ')).toBe('radiohead')
  })

  it('handles empty string', () => {
    expect(normalizeCollectionValue('')).toBe('')
  })

  it('preserves spaces within value', () => {
    expect(normalizeCollectionValue('OK Computer')).toBe('ok computer')
  })
})

describe('getSongKey', () => {
  it('generates normalized artist::title key', () => {
    expect(getSongKey('The Beatles', 'Yesterday')).toBe(
      'the beatles::yesterday',
    )
  })

  it('normalizes both parts', () => {
    expect(getSongKey('  RADIOHEAD  ', '  Creep  ')).toBe('radiohead::creep')
  })

  it('separates artist and title with ::', () => {
    const key = getSongKey('Artist', 'Title')
    expect(key).toContain('::')
    const [artist, title] = key.split('::')
    expect(artist).toBe('artist')
    expect(title).toBe('title')
  })

  it('same song different casings produce identical key', () => {
    expect(getSongKey('Blur', 'Song 2')).toBe(getSongKey('BLUR', 'SONG 2'))
  })
})

describe('getRarityRank', () => {
  it('returns 0 for common', () => {
    expect(getRarityRank('common')).toBe(0)
  })

  it('returns 1 for uncommon', () => {
    expect(getRarityRank('uncommon')).toBe(1)
  })

  it('returns 2 for rare', () => {
    expect(getRarityRank('rare')).toBe(2)
  })

  it('returns 3 for mythic', () => {
    expect(getRarityRank('mythic')).toBe(3)
  })

  it('ranks are strictly increasing', () => {
    expect(getRarityRank('common')).toBeLessThan(getRarityRank('uncommon'))
    expect(getRarityRank('uncommon')).toBeLessThan(getRarityRank('rare'))
    expect(getRarityRank('rare')).toBeLessThan(getRarityRank('mythic'))
  })
})
