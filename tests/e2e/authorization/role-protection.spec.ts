import { test, expect } from '@playwright/test'
import { loginAsParent, loginAsTeacher, PARENT_ACCOUNTS } from '../../helpers/auth'

/**
 * Role Protection Tests
 * 
 * Critical: Verifies that role-based access control works correctly.
 * Users should not be able to access pages for other roles.
 */
test.describe('Role Protection', () => {
  test('Parent cannot access admin dashboard', async ({ page }) => {
    await loginAsParent(page, PARENT_ACCOUNTS.joy.email, PARENT_ACCOUNTS.joy.password)
    
    // Try to navigate directly to admin dashboard
    await page.goto('/admin/dashboard')
    
    // Should redirect to parent dashboard (not admin)
    await expect(page).toHaveURL('/parent/dashboard', { timeout: 10000 })
    await expect(page.locator('h1')).not.toContainText('Admin Dashboard')
  })

  test('Parent cannot access teacher pages', async ({ page }) => {
    await loginAsParent(page, PARENT_ACCOUNTS.joy.email, PARENT_ACCOUNTS.joy.password)
    
    // Try to navigate to teacher dashboard
    await page.goto('/teacher/admin')
    
    // Should redirect to parent dashboard
    await expect(page).toHaveURL('/parent/dashboard', { timeout: 10000 })
  })

  test('Teacher cannot access admin dashboard', async ({ page }) => {
    await loginAsTeacher(page)
    
    // Try to navigate to admin dashboard
    await page.goto('/admin/dashboard')
    
    // Should redirect to teacher dashboard (not admin)
    await expect(page).toHaveURL('/teacher/admin', { timeout: 10000 })
    await expect(page.locator('h1')).not.toContainText('Admin Dashboard')
  })

  test('Teacher cannot access parent pages', async ({ page }) => {
    await loginAsTeacher(page)
    
    // Try to navigate to parent dashboard
    await page.goto('/parent/dashboard')
    
    // Should redirect to teacher dashboard
    await expect(page).toHaveURL('/teacher/admin', { timeout: 10000 })
  })

  test('Unauthenticated user redirects to login for admin routes', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    
    await page.goto('/admin/users')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('Unauthenticated user redirects to login for teacher routes', async ({ page }) => {
    await page.goto('/teacher/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    
    await page.goto('/teacher/students')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('Unauthenticated user redirects to login for parent routes', async ({ page }) => {
    await page.goto('/parent/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    
    await page.goto('/parent/homework')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('Parent stays parent after browser refresh', async ({ page }) => {
    await loginAsParent(page, PARENT_ACCOUNTS.joy.email, PARENT_ACCOUNTS.joy.password)
    await page.waitForLoadState('networkidle')
    
    // Verify we're on parent dashboard
    await expect(page.locator('text=Parent').first()).toBeVisible({ timeout: 10000 })
    
    // Refresh the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    // Should still be parent, not logged out
    await expect(page).toHaveURL('/parent/dashboard', { timeout: 10000 })
    await expect(page.locator('text=Parent').first()).toBeVisible()
  })
})

