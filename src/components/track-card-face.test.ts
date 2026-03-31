import { describe, expect, it } from 'vitest'
import { formatCount } from './track-card-face'

describe('formatCount', () => {
  it('formats zero', () => {
    expect(formatCount(0)).toBe('0')
  })

  it('formats small numbers without suffix', () => {
    expect(formatCount(500)).toBe('500')
    expect(formatCount(999)).toBe('999')
  })

  it('formats thousands with K suffix', () => {
    expect(formatCount(1000)).toBe('1K')
    expect(formatCount(10_000)).toBe('10K')
    expect(formatCount(999_000)).toBe('999K')
  })

  it('includes one decimal for non-round thousands', () => {
    expect(formatCount(1_500)).toBe('1.5K')
    expect(formatCount(2_300)).toBe('2.3K')
  })

  it('formats millions with M suffix', () => {
    expect(formatCount(1_000_000)).toBe('1M')
    expect(formatCount(10_000_000)).toBe('10M')
  })

  it('includes one decimal for non-round millions', () => {
    expect(formatCount(2_500_000)).toBe('2.5M')
    expect(formatCount(1_200_000)).toBe('1.2M')
  })

  it('does not exceed one decimal place', () => {
    // 1234 → compact → "1.2K" (not "1.23K")
    expect(formatCount(1_234)).toBe('1.2K')
    expect(formatCount(1_234_567)).toBe('1.2M')
  })
})
