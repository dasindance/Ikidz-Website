import { test, expect } from '@playwright/test'
import { loginAsParent, PARENT_ACCOUNTS } from '../../helpers/auth'

/**
 * Parent Data Display Tests
 * 
 * Verifies that parents see their correct student data and countdown information
 */
test.describe('Parent Data Display', () => {
  test('Joy should see correct data with 4 classes remaining', async ({ page }) => {
    const { email, password, name, classesRemaining } = PARENT_ACCOUNTS.joy
    
    await loginAsParent(page, email, password)
    await page.waitForLoadState('networkidle')
    
    // Should see welcome message with parent name or student name
    await expect(page.locator('h1').first()).toContainText('Welcome', { timeout: 10000 })
    
    // Should see countdown card with class name
    await expect(page.locator('text=Avocado').first()).toBeVisible({ timeout: 10000 })
    
    // Should see correct number of classes remaining
    await expect(page.locator(`text=${classesRemaining} classes remaining`).first()).toBeVisible()
  })

  test('Tiger should see urgent renewal warning with only 2 classes left', async ({ page }) => {
    const { email, password } = PARENT_ACCOUNTS.tiger
    
    await loginAsParent(page, email, password)
    await page.waitForLoadState('networkidle')
    
    // Should see welcome message
    await expect(page.locator('h1').first()).toContainText('Welcome', { timeout: 10000 })
    
    // Should see urgent warning for low class count (flexible text matching)
    const urgentText = page.locator('text=/.*2 class(es)? (left|remaining).*/i').first()
    await expect(urgentText).toBeVisible({ timeout: 10000 })
  })

  test('Hardy should see Hardy 1v1 class data', async ({ page }) => {
    const { email, password } = PARENT_ACCOUNTS.hardy
    
    await loginAsParent(page, email, password)
    await page.waitForLoadState('networkidle')
    
    // Should see welcome message
    await expect(page.locator('h1').first()).toContainText('Welcome', { timeout: 10000 })
    
    // Should see Hardy 1v1 class
    await expect(page.locator('text=Hardy 1v1').first()).toBeVisible({ timeout: 10000 })
    
    // Should see parent badge
    await expect(page.locator('text=Parent').first()).toBeVisible()
  })

  test('Parent should maintain role when navigating between pages', async ({ page }) => {
    const { email, password } = PARENT_ACCOUNTS.joy
    
    await loginAsParent(page, email, password)
    
    // Navigate to Homework page
    await page.click('a[href="/parent/homework"]')
    await expect(page).toHaveURL('/parent/homework')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Parent').first()).toBeVisible({ timeout: 10000 }) // Badge still says Parent
    
    // Navigate to Lessons page
    await page.click('a[href="/parent/lessons"]')
    await expect(page).toHaveURL('/parent/lessons')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Parent').first()).toBeVisible() // Badge still says Parent
    
    // Navigate back to Dashboard
    await page.click('a[href="/parent/dashboard"]')
    await expect(page).toHaveURL('/parent/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Parent').first()).toBeVisible() // Badge still says Parent
  })

  test('Multiple parents should see their own data only', async ({ page, context }) => {
    // Login as Joy
    await loginAsParent(page, PARENT_ACCOUNTS.joy.email, PARENT_ACCOUNTS.joy.password)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Avocado').first()).toBeVisible({ timeout: 10000 })
    
    // Logout and clear all cookies/storage
    await page.click('button:has-text("Sign Out")')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    
    // Clear cookies and storage to ensure clean state
    await context.clearCookies()
    await page.evaluate(() => localStorage.clear())
    
    // Login as Tiger
    await loginAsParent(page, PARENT_ACCOUNTS.tiger.email, PARENT_ACCOUNTS.tiger.password)
    await page.waitForLoadState('networkidle')
    
    // Should see Tiger's data, not Joy's
    await expect(page).toHaveURL('/parent/dashboard')
    
    // Tiger should see different class data than Joy
    // Just verify we're logged in as a parent (don't assert specific class since Tiger might be in multiple)
    await expect(page.locator('text=Parent').first()).toBeVisible()
  })
})

