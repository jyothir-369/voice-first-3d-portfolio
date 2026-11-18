import { expect, test } from '@playwright/test'

/**
 * Phase 7 E2E: content gates, text input route, contact moment,
 * branding assets, and theme switching.
 */

test.describe('Phase 7: content and UI polish', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /tap to begin/i }).click()
    await page.waitForTimeout(600)
  })

  test('no placeholder or persona strings in the rendered page', async ({ page }) => {
    const body = await page.locator('body').innerText()
    const banned = ['NEEDS INPUT', 'TBD', 'TODO', 'lorem', 'Aarav', 'aarav.dev', 'Ludhiana', 'Plantly', 'Orbit', 'Autopilot', 'KhataKit', 'NotesNest', 'pre-seed']
    for (const b of banned) {
      expect(body.toLowerCase(), `page contains banned string "${b}"`).not.toContain(b.toLowerCase())
    }
  })

  test('question chips match the verified FAQ corpus', async ({ page }) => {
    const chips = page.locator('.chips button')
    const count = await chips.count()
    expect(count).toBeGreaterThan(0)
    const first = await chips.first().innerText()
    expect(first.length).toBeGreaterThan(0)
    expect(first).not.toMatch(/NEEDS INPUT|TBD|TODO|lorem/i)
  })

  test('skip voice toggle reveals a typed input that answers a question', async ({ page }) => {
    // Skip voice lives on the intro screen; use it instead of "Tap to begin".
    // The shared beforeEach dismisses the intro, so start from a fresh page.
    await page.goto('/')
    const skip = page.getByRole('button', { name: /skip voice, use text/i })
    await expect(skip).toBeVisible()
    await skip.click()
    await expect(page.locator('#typed')).toBeVisible()
    await expect(page.locator('#intro')).toBeHidden()

    const input = page.locator('#typed-input')
    await expect(input).toBeVisible()
    await input.fill('What do you build?')
    await page.locator('#typed-send').click()

    await page.waitForTimeout(1500)
    const ai = await page.locator('#ai').innerText()
    expect(ai.length).toBeGreaterThan(0)
  })

  test('hire question reveals the contact panel with a working mailto route', async ({ page }) => {
    const contact = page.locator('#contact')
    await expect(contact).toBeHidden()

    await page.locator('.chips button', { hasText: /how do i hire you/i }).click()
    await page.waitForTimeout(1500)

    await expect(contact).toBeVisible()
    const mail = contact.locator('a.contact-mail')
    expect(await mail.getAttribute('href')).toBe('mailto:jyothirraghavalu369@gmail.com')
    expect(await mail.innerText()).toBe('jyothirraghavalu369@gmail.com')

    const copy = contact.locator('button.contact-copy')
    await expect(copy).toBeVisible()
    await copy.click()
    await expect(copy).toHaveText('Copied', { timeout: 4000 })
  })

  test('email route is reachable from the intro About panel', async ({ page }) => {
    // The About panel lives on the intro screen, before "Tap to begin".
    await page.goto('/')
    const aboutMail = page.locator('.about a[href^="mailto:"]')
    await expect(aboutMail).toHaveAttribute('href', 'mailto:jyothirraghavalu369@gmail.com')
  })

  test('branding assets: title, description, theme colour and favicon', async ({ page }) => {
    await expect(page).toHaveTitle(/Talk to My Work — Jyothir Raghavalu Bhogi/)
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
    const themeColor = await page.locator('meta[name="theme-color"]').first().getAttribute('content')
    expect(themeColor).toBeTruthy()
    const icon = await page.locator('link[rel="icon"]').getAttribute('href')
    expect(icon).toBeTruthy()
  })

  test('theme toggle switches light and dark', async ({ page }) => {
    const toggle = page.locator('#ot')
    await expect(toggle).toBeVisible()

    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    await toggle.click()
    await page.waitForTimeout(300)
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))

    const applied = after ?? 'null-follows-system'
    const was = before ?? 'null-follows-system'
    expect(applied).not.toBe(was)
    expect(['light', 'dark']).toContain(after)
  })
})
