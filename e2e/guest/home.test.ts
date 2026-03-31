import { expect, test } from '@playwright/test'

// Pack opening calls Convex → Last.fm (server-side). Allow generous time.
const PACK_TIMEOUT = 45_000

test.describe('Home page — sealed state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows sealed pack card', async ({ page }) => {
    await expect(page.getByText('sealed pack')).toBeVisible()
  })

  test('shows "click card to open" prompt', async ({ page }) => {
    await expect(page.getByText('click card to open')).toBeVisible()
  })

  test('sealed pack card is not disabled on load', async ({ page }) => {
    // Button becomes enabled once Clerk and hydration are ready
    await expect(
      page.locator('button:has-text("click card to open")'),
    ).not.toBeDisabled({ timeout: 10_000 })
  })
})

test.describe('Home page — pack opening', () => {
  // These tests open a real pack via Convex + Last.fm; run serially to avoid
  // rate-limiting and to keep localStorage state isolated.
  test.describe.configure({ mode: 'serial' })

  test('clicking sealed card opens a pack and shows carousel', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('button:has-text("click card to open")').click()

    // Loading indicator
    await expect(page.getByText('opening pack...')).toBeVisible()

    // Carousel counter appears once the pack loads
    await expect(page.getByText('1/5')).toBeVisible({ timeout: PACK_TIMEOUT })
  })

  test('carousel shows next/previous arrow buttons', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("click card to open")').click()
    await expect(page.getByText('1/5')).toBeVisible({ timeout: PACK_TIMEOUT })

    await expect(
      page.getByRole('button', { name: 'Show next card' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Show previous card' }),
    ).toBeVisible()
  })

  test('previous arrow is disabled on the first card', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("click card to open")').click()
    await expect(page.getByText('1/5')).toBeVisible({ timeout: PACK_TIMEOUT })

    await expect(
      page.getByRole('button', { name: 'Show previous card' }),
    ).toBeDisabled()
  })

  test('next arrow advances to card 2/5', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("click card to open")').click()
    await expect(page.getByText('1/5')).toBeVisible({ timeout: PACK_TIMEOUT })

    await page.getByRole('button', { name: 'Show next card' }).click()
    await expect(page.getByText('2/5')).toBeVisible()
  })

  test('previous arrow goes back to 1/5 from 2/5', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("click card to open")').click()
    await expect(page.getByText('1/5')).toBeVisible({ timeout: PACK_TIMEOUT })

    await page.getByRole('button', { name: 'Show next card' }).click()
    await expect(page.getByText('2/5')).toBeVisible()

    await page.getByRole('button', { name: 'Show previous card' }).click()
    await expect(page.getByText('1/5')).toBeVisible()
  })

  test('next arrow is disabled on the last card', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("click card to open")').click()
    await expect(page.getByText('1/5')).toBeVisible({ timeout: PACK_TIMEOUT })

    // Navigate to last card
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Show next card' }).click()
    }
    await expect(page.getByText('5/5')).toBeVisible()

    await expect(
      page.getByRole('button', { name: 'Show next card' }),
    ).toBeDisabled()
  })

  test('"back to pack" button dismisses the carousel', async ({ page }) => {
    await page.goto('/')
    await page.locator('button:has-text("click card to open")').click()
    await expect(page.getByText('1/5')).toBeVisible({ timeout: PACK_TIMEOUT })

    await page.getByRole('button', { name: 'back to pack' }).click()

    // Carousel is gone
    await expect(page.getByText('1/5')).not.toBeVisible()
    // Guest quota is now exhausted after 1 pull, so the sign-up screen shows
    await expect(page.getByText('sealed pack')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Sign up to keep opening' }),
    ).toBeVisible()
  })

  test('guest pack is restored from localStorage on reload', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('button:has-text("click card to open")').click()
    await expect(page.getByText('1/5')).toBeVisible({ timeout: PACK_TIMEOUT })

    // Reload: saved pack should restore
    await page.reload()
    await expect(page.getByText('1/5')).toBeVisible({ timeout: 10_000 })
  })
})
