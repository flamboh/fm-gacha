import { describe, expect, it } from 'vitest'
import { getStackCardStyle } from './pack-carousel'

describe('getStackCardStyle', () => {
  it('selected card gets zIndex 30', () => {
    const style = getStackCardStyle(2, 0, 2, null)
    expect(style.zIndex).toBe(30)
  })

  it('transitioning-from card gets zIndex 29', () => {
    // card at index 1 is transitioning away (selectedIndex moved to 2)
    const style = getStackCardStyle(1, -1, 2, 1)
    expect(style.zIndex).toBe(29)
  })

  it('selected index beats transitioning when they are the same card', () => {
    const style = getStackCardStyle(2, 0, 2, 2)
    expect(style.zIndex).toBe(30)
  })

  it('cards further from selected have lower zIndex', () => {
    const current = getStackCardStyle(1, 0, 1, null)
    const behind1 = getStackCardStyle(2, 1, 1, null)
    const behind2 = getStackCardStyle(3, 2, 1, null)
    expect(current.zIndex as number).toBeGreaterThan(behind1.zIndex as number)
    expect(behind1.zIndex as number).toBeGreaterThan(behind2.zIndex as number)
  })

  it('transform includes translateX centering', () => {
    const style = getStackCardStyle(0, 0, 0, null)
    expect(style.transform).toContain('translateX(calc(-50%')
  })

  it('card to the left rotates negatively', () => {
    // offset = -1 → direction = -1 → negative rotation
    const style = getStackCardStyle(0, -1, 1, null)
    expect(style.transform).toContain('rotate(-')
  })

  it('card to the right rotates positively', () => {
    // offset = 1 → direction = 1 → positive rotation
    const style = getStackCardStyle(2, 1, 1, null)
    expect(style.transform).not.toContain('rotate(-')
    expect(style.transform).toContain('rotate(')
  })

  it('current card (offset 0) has zero translateY and rotation', () => {
    const style = getStackCardStyle(1, 0, 1, null)
    expect(style.transform).toContain('translateY(0px)')
    expect(style.transform).toContain('rotate(0deg)')
  })

  it('depth increases translateY offset for stacked cards', () => {
    const depth1 = getStackCardStyle(2, 1, 1, null)
    const depth2 = getStackCardStyle(3, 2, 1, null)
    // Both transforms include translateY — depth2 should have larger value
    expect(depth1.transform).toContain('translateY(8px)')
    expect(depth2.transform).toContain('translateY(16px)')
  })
})
