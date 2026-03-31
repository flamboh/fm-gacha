import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright'
import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const AUTH_FILE = 'playwright/.clerk/user.json'

setup.describe.configure({ mode: 'serial' })

setup('global clerk setup', async () => {
  await clerkSetup()
})

setup('authenticate test user', async ({ page }) => {
  const email = process.env.CLERK_TEST_USER_EMAIL
  const code = process.env.CLERK_TEST_USER_CODE

  if (!email || !code) {
    console.warn(
      '\n⚠ Skipping auth setup: CLERK_TEST_USER_EMAIL / CLERK_TEST_USER_CODE not set.\n' +
        '  Authenticated tests (e2e/auth/**) will be skipped.\n' +
        '  Add a +clerk_test email and code (424242) to .env.local.\n',
    )
    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })
    fs.writeFileSync(AUTH_FILE, '{}')
    return
  }

  await setupClerkTestingToken({ page })
  await page.goto('/')

  // Open sign-in modal via the header button
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Clerk sign-in form — email+code (OTP) flow
  await page.getByLabel('Email address').fill(email)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('Enter verification code').fill(code)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // Wait for sign-in to complete: Sign in button disappears from header
  await expect(page.getByRole('button', { name: 'Sign in' })).not.toBeVisible({
    timeout: 15_000,
  })

  await page.context().storageState({ path: AUTH_FILE })
})
