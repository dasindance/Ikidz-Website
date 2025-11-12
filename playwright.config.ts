import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for iKids Portal E2E tests
 * Tests role-based access, navigation, and data display
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests serially to avoid session conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Retry once on failure
  workers: 1, // Single worker to avoid parallel session conflicts
  reporter: 'html',
  timeout: 60 * 1000, // Increase default timeout to 60s
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15 * 1000, // 15s for actions
    navigationTimeout: 30 * 1000, // 30s for navigation
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Each test gets a fresh browser context
        contextOptions: {
          ignoreHTTPSErrors: true,
        },
      },
    },
  ],

  // Start dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})

