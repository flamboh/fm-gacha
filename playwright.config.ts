import { defineConfig, devices } from '@playwright/test'

const AUTH_FILE = 'playwright/.clerk/user.json'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Runs once: signs in and saves auth state to AUTH_FILE.
    // Requires E2E_CLERK_USER_EMAIL and E2E_CLERK_USER_PASSWORD in .env.local.
    {
      name: 'setup',
      testMatch: '**/global.setup.ts',
    },

    // Unauthenticated flows. No auth state, no dependency on setup.
    {
      name: 'guest',
      testMatch: '**/guest/**/*.test.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // Authenticated flows. Depends on setup having run first.
    {
      name: 'authenticated',
      testMatch: '**/auth/**/*.test.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'bun dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
