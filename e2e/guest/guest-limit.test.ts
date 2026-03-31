import { expect, test } from '@playwright/test'

// Simulate an exhausted guest quota by injecting localStorage before the page
// loads. This avoids making a real API call just to hit the limit.
//
// NOTE: addInitScript callbacks run in the browser context — no outer-scope
// variables. Literals must be used inside them; objects are passed via arg.

const SAVED_PACK = {
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

const EXHAUSTED_STATE = JSON.stringify({ packsOpened: 1, lastPack: null })
const EXHAUSTED_WITH_PACK = JSON.stringify({
  packsOpened: 1,
  lastPack: SAVED_PACK,
})

test.describe('Guest pack limit', () => {
  test('shows "Sign up to keep opening" when guest quota is exhausted', async ({
    page,
  }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('fm-gacha.guest-pack-state', state)
    }, EXHAUSTED_STATE)
    await page.goto('/')

    await expect(
      page.getByRole('button', { name: 'Sign up to keep opening' }),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows guest limit message text', async ({ page }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('fm-gacha.guest-pack-state', state)
    }, EXHAUSTED_STATE)
    await page.goto('/')

    await expect(
      page.getByText('guest pack used. sign up for more pulls'),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('shows "View saved pack" button after navigating back from the carousel', async ({
    page,
  }) => {
    // When lastPack is stored, activePack initialises to it, showing the carousel.
    // "View saved pack" only appears once the user navigates back with "back to pack".
    await page.addInitScript((state) => {
      localStorage.setItem('fm-gacha.guest-pack-state', state)
    }, EXHAUSTED_WITH_PACK)
    await page.goto('/')

    // Carousel is visible immediately (activePack restored from localStorage)
    await expect(page.getByText('1/1')).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'back to pack' }).click()

    await expect(
      page.getByRole('button', { name: 'View saved pack' }),
    ).toBeVisible()
  })

  test('"View saved pack" button restores the carousel', async ({ page }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('fm-gacha.guest-pack-state', state)
    }, EXHAUSTED_WITH_PACK)
    await page.goto('/')

    // Navigate back first so the limit screen is visible
    await expect(page.getByText('1/1')).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: 'back to pack' }).click()

    await page.getByRole('button', { name: 'View saved pack' }).click()

    // Carousel is restored (1/1 since SAVED_PACK has 1 card)
    await expect(page.getByText('1/1')).toBeVisible()
  })

  test('sealed pack button is not shown when quota is exhausted', async ({
    page,
  }) => {
    await page.addInitScript((state) => {
      localStorage.setItem('fm-gacha.guest-pack-state', state)
    }, EXHAUSTED_STATE)
    await page.goto('/')

    await expect(page.getByText('click card to open')).not.toBeVisible()
  })
})
