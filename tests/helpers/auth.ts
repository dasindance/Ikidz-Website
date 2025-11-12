import { Page, expect } from '@playwright/test'

/**
 * Authentication helper functions for E2E tests
 * Provides reusable login methods for different user roles
 */

export async function loginAsAdmin(page: Page) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  await page.fill('input[type="email"]', 'admin@ikids.com')
  await page.fill('input[type="password"]', 'admin123')
  
  // Click and wait for navigation
  await Promise.all([
    page.waitForURL('/admin/dashboard', { timeout: 30000 }),
    page.click('button[type="submit"]')
  ])
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle')
}

export async function loginAsTeacher(page: Page) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  await page.fill('input[type="email"]', 'teacher@example.com')
  await page.fill('input[type="password"]', 'teacher123')
  
  // Click and wait for navigation
  await Promise.all([
    page.waitForURL('/teacher/admin', { timeout: 30000 }),
    page.click('button[type="submit"]')
  ])
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle')
}

export async function loginAsParent(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  
  // Click and wait for navigation
  await Promise.all([
    page.waitForURL('/parent/dashboard', { timeout: 30000 }),
    page.click('button[type="submit"]')
  ])
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle')
}

// Predefined parent accounts for testing
export const PARENT_ACCOUNTS = {
  joy: { email: 'joy@parent.ikids.com', password: 'joy123', name: 'Joy', class: 'Avocado', classesRemaining: 4 },
  tiger: { email: 'tiger@parent.ikids.com', password: 'tiger123', name: 'Tiger', class: 'Banana', classesRemaining: 2, urgent: true },
  hardy: { email: 'hardy@parent.ikids.com', password: 'hardy123', name: 'Hardy', class: 'Hardy 1v1', classesRemaining: 21 },
  maysei: { email: 'maysei@parent.ikids.com', password: 'maysei123', name: 'Maysei' },
  cavan: { email: 'cavan@parent.ikids.com', password: 'cavan123', name: 'Cavan', class: 'Dragon' },
}

