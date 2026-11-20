/**
 * Phase 8 axe scan with an explicit light colour scheme, so the
 * light-theme accent contrast is measured rather than relying on the
 * headless browser's default preference.
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.use({ colorScheme: 'light' })

test.describe('Phase 8: axe scan — forced light scheme', () => {
  test('intro screen, light scheme, no serious/critical violations', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(400)
    const results = await new AxeBuilder({ page }).analyze()
    const bad = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    expect(bad, JSON.stringify(bad.map(b => ({ id: b.id, nodes: b.nodes.map(n => n.target) })))).toHaveLength(0)
  })

  test('main view, explicit light theme, no serious/critical violations', async ({ page }) => {
    await page.goto('/')
    await page.click('button.begin')
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
    await page.waitForTimeout(1000)
    const results = await new AxeBuilder({ page }).analyze()
    const bad = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    expect(bad, JSON.stringify(bad.map(b => ({ id: b.id, nodes: b.nodes.map(n => n.target) })))).toHaveLength(0)
  })
})
