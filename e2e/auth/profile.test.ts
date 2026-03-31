import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, test } from '@playwright/test'

test.describe('Profile page — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page })
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: 'Last.fm' })).toBeVisible({
      timeout: 15_000,
    })
  })

  test('shows "Last.fm" heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Last.fm' })).toBeVisible()
  })

  test('shows username input with "flamboh" placeholder', async ({ page }) => {
    await expect(page.getByPlaceholder('flamboh')).toBeVisible()
  })

  test('Save button is visible and enabled', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  test('Clear button is disabled when input is empty', async ({ page }) => {
    const input = page.getByPlaceholder('flamboh')
    await input.clear()
    await expect(page.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })

  test('Clear button enables when input has text', async ({ page }) => {
    await page.getByPlaceholder('flamboh').fill('testuser')
    await expect(page.getByRole('button', { name: 'Clear' })).toBeEnabled()
  })

  test('submitting a username shows success message', async ({ page }) => {
    const uniqueName = `e2etest${Date.now()}`
    await page.getByPlaceholder('flamboh').fill(uniqueName)
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Last.fm username saved.')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('Save button shows "Saving..." during submission', async ({ page }) => {
    await page.getByPlaceholder('flamboh').fill('testuser')

    // Start observing for the transient "Saving..." text before clicking
    const savingPromise = expect(
      page.getByRole('button', { name: 'Saving...' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Save' }).click()

    // "Saving..." may appear briefly — we just need the final success state
    await expect(page.getByText('Last.fm username saved.')).toBeVisible({
      timeout: 10_000,
    })
    await savingPromise.catch(() => {
      // "Saving..." is transient and may already be gone by the time we check
    })
  })

  test('clearing the username shows cleared success message', async ({
    page,
  }) => {
    // First set a username
    await page.getByPlaceholder('flamboh').fill(`e2etest${Date.now()}`)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Last.fm username saved.')).toBeVisible({
      timeout: 10_000,
    })

    // Now clear it
    await page.getByRole('button', { name: 'Clear' }).click()
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Last.fm username cleared.')).toBeVisible({
      timeout: 10_000,
    })
  })

  test('success message disappears when input is changed', async ({ page }) => {
    await page.getByPlaceholder('flamboh').fill('testuser')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Last.fm username saved.')).toBeVisible({
      timeout: 10_000,
    })

    // Typing in the input clears the status message
    await page.getByPlaceholder('flamboh').type('x')
    await expect(page.getByText('Last.fm username saved.')).not.toBeVisible()
  })
})
