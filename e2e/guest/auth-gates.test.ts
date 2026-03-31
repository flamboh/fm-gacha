import { expect, test } from '@playwright/test'

// Both /collection and /profile show Clerk's <SignUp /> component for guests.
// We verify the page is gated and the sign-up UI is rendered.

test.describe('Auth gates for unauthenticated users', () => {
  test('/collection shows sign-up UI', async ({ page }) => {
    await page.goto('/collection')
    // Clerk's SignUp component renders a sign-in/sign-up prompt
    await expect(
      page.locator(
        '[data-clerk-component], .cl-rootBox, .cl-signUp-root, .cl-component',
      ),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('/profile shows sign-up UI', async ({ page }) => {
    await page.goto('/profile')
    await expect(
      page.locator(
        '[data-clerk-component], .cl-rootBox, .cl-signUp-root, .cl-component',
      ),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('/collection does not show "Collection" heading when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/collection')
    await expect(
      page.getByRole('heading', { name: 'Collection' }),
    ).not.toBeVisible()
  })

  test('/profile does not show "Last.fm" heading when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/profile')
    await expect(
      page.getByRole('heading', { name: 'Last.fm' }),
    ).not.toBeVisible()
  })

  test('header shows "Sign in" button when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible({
      timeout: 10_000,
    })
  })

  test('header does not show "Profile" link when unauthenticated', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Profile' })).not.toBeVisible()
  })
})
