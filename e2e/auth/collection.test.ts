import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

// storageState (auth) is set at the project level in playwright.config.ts.
// Each test gets a fresh page that already has a valid Clerk session.

const PACK_TIMEOUT = 45_000

test.describe('Collection page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/collection')
    // Wait for the auth check to resolve and the page to settle
    await expect(page.getByRole('heading', { name: 'Collection' })).toBeVisible(
      { timeout: 15_000 },
    )
  })

  test('shows "Collection" heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Collection' }),
    ).toBeVisible()
  })

  test('shows summary stats bar', async ({ page }) => {
    await expect(page.getByText('songs')).toBeVisible()
    await expect(page.getByText('copies')).toBeVisible()
    await expect(page.getByText('mythic')).toBeVisible()
    await expect(page.getByText('rare')).toBeVisible()
  })

  test('shows sort dropdown with default "Recent" label', async ({ page }) => {
    await expect(page.getByText('Recent')).toBeVisible()
  })

  test('sort dropdown changes label when option is selected', async ({
    page,
  }) => {
    await page.getByText('Recent').click()
    await page.getByRole('menuitemradio', { name: 'Artist' }).click()
    await expect(page.getByText('Artist')).toBeVisible()
  })
})

test.describe('Collection page — with cards (opens a real pack first)', () => {
  test.describe.configure({ mode: 'serial' })

  test('opening a pack populates the collection', async ({ page }) => {
    await setupClerkTestingToken({ page })

    // Open a pack on the home page — it auto-saves for authenticated users
    await page.goto('/')
    await page.locator('button:has-text("click card to open")').click()
    await expect(page.getByText('1/5')).toBeVisible({ timeout: PACK_TIMEOUT })

    // Navigate to collection
    await page.getByRole('link', { name: 'Collection' }).click()
    await expect(page.getByRole('heading', { name: 'Collection' })).toBeVisible(
      { timeout: 10_000 },
    )

    // At least one card should be in the grid
    await expect(
      page.locator('section').filter({ hasText: '' }).locator('button').first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('clicking a card opens the inspect modal', async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/collection')
    await expect(page.getByRole('heading', { name: 'Collection' })).toBeVisible(
      { timeout: 15_000 },
    )

    // Click first card in the grid
    const firstCard = page.locator('section button').first()
    await firstCard.click()

    // Modal backdrop appears
    await expect(
      page.locator('.fixed.inset-0.bg-background\\/80'),
    ).toBeVisible()
  })

  test('pressing Escape closes the modal', async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/collection')
    await expect(page.getByRole('heading', { name: 'Collection' })).toBeVisible(
      { timeout: 15_000 },
    )

    await page.locator('section button').first().click()
    await expect(
      page.locator('.fixed.inset-0.bg-background\\/80'),
    ).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(
      page.locator('.fixed.inset-0.bg-background\\/80'),
    ).not.toBeVisible()
  })

  test('clicking the backdrop closes the modal', async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/collection')
    await expect(page.getByRole('heading', { name: 'Collection' })).toBeVisible(
      { timeout: 15_000 },
    )

    await page.locator('section button').first().click()
    const backdrop = page.locator('.fixed.inset-0.bg-background\\/80')
    await expect(backdrop).toBeVisible()

    await backdrop.click()
    await expect(backdrop).not.toBeVisible()
  })

  test('all sort options are available in the dropdown', async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/collection')
    await expect(page.getByRole('heading', { name: 'Collection' })).toBeVisible(
      { timeout: 15_000 },
    )

    await page.getByText('Recent').click()
    for (const label of ['Recent', 'Artist', 'Title', 'Rarity']) {
      await expect(
        page.getByRole('menuitemradio', { name: label }),
      ).toBeVisible()
    }
  })
})
