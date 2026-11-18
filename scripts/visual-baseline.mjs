/**
 * Phase 7 visual regression baseline.
 * Captures the intro and main screens in light and dark at desktop and phone
 * sizes into docs/PHASE_7_BASELINE/. Re-run after any visual change:
 *   node scripts/visual-baseline.mjs
 * Starts its own dev server on :3000 and tears it down afterwards.
 */
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = `${ROOT}/docs/PHASE_7_BASELINE`
const URL = 'http://localhost:3000'

function startServer() {
  const child = spawn('npx', ['vite', '--port', '3000', '--strictPort'], {
    cwd: ROOT,
    shell: true,
    stdio: 'ignore'
  })
  return child
}

async function waitServer(tries = 60) {
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(URL)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`dev server did not start at ${URL}`)
}

async function main() {
  mkdirSync(OUT, { recursive: true })
  const server = startServer()
  try {
    await waitServer()
    const browser = await chromium.launch()
    const views = [
      ['desktop', { width: 1280, height: 800 }],
      ['phone', { width: 390, height: 844 }]
    ]
    for (const [name, viewport] of views) {
      const page = await browser.newPage({ viewport })
      await page.goto(URL)
      await page.waitForTimeout(900)
      await page.screenshot({ path: `${OUT}/${name}-intro-light.png` })

      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(700)
      await page.screenshot({ path: `${OUT}/${name}-main-light.png` })

      // Two clicks: null -> explicit light -> dark.
      await page.locator('#ot').click()
      await page.waitForTimeout(250)
      await page.locator('#ot').click()
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${OUT}/${name}-main-dark.png` })
      await page.close()
    }
    await browser.close()
    console.log(`baseline written to ${OUT}`)
  } finally {
    server.kill()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
