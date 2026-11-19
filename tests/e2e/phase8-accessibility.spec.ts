/**
 * Phase 8 Accessibility — Playwright E2E verification.
 * Tests WCAG 2.2 AA requirements from the v12 implementation plan.
 */
import { test, expect } from '@playwright/test'

test.describe('Phase 8: Accessibility', () => {
  test('skip-link is first keyboard target (WCAG 2.4.1)', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const firstFocusable = await page.locator(':focus')
    const tag = await firstFocusable.evaluate(el => el.tagName)
    expect(tag).toBe('A')
    const text = await firstFocusable.textContent()
    expect(text).toContain('Skip')
  })

  test('should have aria-live polite region for AI replies', async ({ page }) => {
    await page.goto('/')
    await page.click('button.begin')
    await page.waitForTimeout(500)
    const liveRegion = page.locator('[aria-live="polite"]')
    expect(await liveRegion.count()).toBeGreaterThan(0)
  })

  test('should have captions toggle and theme toggle visible', async ({ page }) => {
    await page.goto('/')
    // Intro overlay intercepts clicks; dismiss it first (matches phase7 pattern)
    await page.click('button.begin')
    await expect(page.locator('#oc')).toBeVisible()
    await page.click('#oc')
    await expect(page.locator('#oc')).toBeVisible()
    await page.click('#ot')
    await expect(page.locator('#ot')).toBeVisible()
  })

  test('should show privacy notice before first mic use', async ({ page }) => {
    await page.goto('/')
    const notice = page.locator('#privacy-notice')
    expect(await notice.count()).toBeGreaterThan(0)
    await expect(notice).toContainText('how your voice data is handled')
  })
})