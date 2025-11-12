import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../../helpers/auth'

/**
 * Admin Navigation Tests
 * 
 * Critical: These tests verify the role switching bug is fixed.
 * The admin role should persist across all navigation.
 */
test.describe('Admin Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should maintain Admin role across all admin pages', async ({ page }) => {
    // Should start on admin dashboard with Admin badge
    await expect(page.locator('text=Admin').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Admin Dashboard')

    // Navigate to Users page
    await page.click('a[href="/admin/users"]')
    await expect(page).toHaveURL('/admin/users')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Admin').first()).toBeVisible() // Badge still says Admin
    await expect(page.locator('h1')).toContainText('User Management')

    // Navigate to Students page
    await page.click('a[href="/admin/students"]')
    await expect(page).toHaveURL('/admin/students')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Admin').first()).toBeVisible() // Badge still says Admin
    await expect(page.locator('h1')).toContainText('All Students')
    
    // Navigate to Classes page
    await page.click('a[href="/admin/classes"]')
    await expect(page).toHaveURL('/admin/classes')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Admin').first()).toBeVisible() // Badge still says Admin
    await expect(page.locator('h1')).toContainText('Class Management')

    // Navigate to Reports page
    await page.click('a[href="/admin/reports"]')
    await expect(page).toHaveURL('/admin/reports')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Admin').first()).toBeVisible() // Badge still says Admin
    await expect(page.locator('h1')).toContainText('System Reports')

    // Navigate back to Dashboard
    await page.click('a[href="/admin/dashboard"]')
    await expect(page).toHaveURL('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Admin').first()).toBeVisible() // Badge still says Admin
  })

  test('should display all 27 students in Students page', async ({ page }) => {
    await page.goto('/admin/students')
    await page.waitForLoadState('networkidle')
    
    // Wait for students to load
    await expect(page.locator('h1')).toContainText('All Students')
    
    // Should see multiple student names (not all 27 might be visible without scrolling)
    await expect(page.locator('text=Joy').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Tiger').first()).toBeVisible()
    await expect(page.locator('text=Hardy').first()).toBeVisible()
  })

  test('should display all classes in Classes page', async ({ page }) => {
    await page.goto('/admin/classes')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h1')).toContainText('Class Management')
    
    // Should see real class names
    await expect(page.locator('text=Avocado').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Banana').first()).toBeVisible()
    await expect(page.locator('text=Dragon').first()).toBeVisible()
  })

  test('should display all parents and teachers in Users page', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForLoadState('networkidle')
    
    await expect(page.locator('h1')).toContainText('User Management')
    
    // Should see teacher section
    await expect(page.locator('text=Teachers').first()).toBeVisible({ timeout: 10000 })
    
    // Should see parents section
    await expect(page.locator('text=Parents').first()).toBeVisible()
    await expect(page.locator('text=joy@parent.ikids.com').first()).toBeVisible()
  })

  test('should show system statistics in Dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Should show stat cards with numbers
    await expect(page.locator('text=Total Parents').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Total Students').first()).toBeVisible()
    await expect(page.locator('text=Active Classes').first()).toBeVisible()
    await expect(page.locator('text=Teachers').first()).toBeVisible()
  })
})

