/**
 * Phase 8 Automated Accessibility Scan — axe-core E2E verification.
 * Tests WCAG 2.2 AA requirements from the v12 implementation plan.
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Phase 8: Automated axe accessibility scan', () => {
  test('intro screen should have no serious/critical axe violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(500)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })

  test('main view after begin should have no serious/critical axe violations', async ({ page }) => {
    await page.goto('/')
    await page.click('button.begin')
    await page.waitForTimeout(500)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })

  test('dark theme should have no serious/critical axe violations', async ({ page }) => {
    await page.goto('/')
    await page.click('button.begin')
    await page.click('#ot') // toggle to dark
    await page.waitForTimeout(300)
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toHaveLength(0)
  })
})