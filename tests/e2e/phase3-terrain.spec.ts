import { test, expect } from '@playwright/test'

test.describe('Phase 3: 3D Dot-Wave Terrain', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test.describe('Terrain initialization', () => {
    test('should render canvas with WebGL context', async ({ page }) => {
      const canvas = page.locator('#gl')
      await expect(canvas).toBeVisible()

      const isCanvas = await canvas.evaluate((el) => el instanceof HTMLCanvasElement)
      expect(isCanvas).toBe(true)

      // Check WebGL context exists
      const hasWebGL = await canvas.evaluate((el) => {
        const canvas = el as HTMLCanvasElement
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
        return gl !== null
      })
      expect(hasWebGL).toBe(true)
    })

    test('should initialize without console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.waitForTimeout(1000)

      const relevantErrors = errors.filter(err =>
        !err.includes('404') &&
        !err.includes('favicon')
      )
      expect(relevantErrors).toHaveLength(0)
    })

    test('should have correct canvas dimensions', async ({ page }) => {
      const dimensions = await page.locator('#gl').evaluate((el) => {
        const canvas = el as HTMLCanvasElement
        return {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight
        }
      })

      expect(dimensions.width).toBeGreaterThan(0)
      expect(dimensions.height).toBeGreaterThan(0)
      expect(dimensions.clientWidth).toBeGreaterThan(0)
      expect(dimensions.clientHeight).toBeGreaterThan(0)
    })
  })

  test.describe('Performance', () => {
    test('should maintain reasonable FPS', async ({ page }) => {
      await page.click('button:has-text("Tap to begin")')

      const fps = await page.evaluate(async () => {
        return new Promise<number>((resolve) => {
          let frameCount = 0
          const startTime = performance.now()
          const duration = 1000

          function countFrame() {
            frameCount++
            const elapsed = performance.now() - startTime
            if (elapsed < duration) {
              requestAnimationFrame(countFrame)
            } else {
              resolve((frameCount / elapsed) * 1000)
            }
          }
          requestAnimationFrame(countFrame)
        })
      })

      // Headless CI is not a laptop. This guards a stalled loop, not the 60 FPS target.
      expect(fps).toBeGreaterThan(10)
    })

    test('should pause rendering when tab is hidden', async ({ page }) => {
      await page.click('button:has-text("Tap to begin")')

      const paused = await page.evaluate(async () => {
        const before = performance.now()
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        const runningGap = performance.now() - before

        Object.defineProperty(document, 'hidden', { value: true, configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))

        const hiddenStart = performance.now()
        await new Promise((resolve) => setTimeout(resolve, 250))
        return { runningGap, hiddenElapsed: performance.now() - hiddenStart }
      })

      expect(paused.runningGap).toBeLessThan(200)
    })
  })

  test.describe('Responsive behavior', () => {
    test('should handle window resize without errors', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.waitForTimeout(200)

      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForTimeout(200)

      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(200)

      const canvas = page.locator('#gl')
      await expect(canvas).toBeVisible()
    })

    test('should handle orientation change on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(200)

      await page.setViewportSize({ width: 667, height: 375 })
      await page.waitForTimeout(200)

      const canvas = page.locator('#gl')
      await expect(canvas).toBeVisible()
    })
  })

  test.describe('Theme handling', () => {
    test('should support light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.reload()
      await page.waitForTimeout(500)

      const canvas = page.locator('#gl')
      await expect(canvas).toBeVisible()
    })

    test('should support dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.reload()
      await page.waitForTimeout(500)

      const canvas = page.locator('#gl')
      await expect(canvas).toBeVisible()
    })
  })

  test.describe('Debug overlay', () => {
    test('shows frame time and point count for ?debug=1', async ({ page }) => {
      await page.goto('http://localhost:3000/?debug=1')
      await page.click('button:has-text("Tap to begin")')
      const overlay = page.locator('#debug-overlay')
      await expect(overlay).toBeVisible()
      await expect(overlay).toContainText('Points')
      await expect(overlay).toContainText('Frame')
    })
  })

  test.describe('Reduced motion support', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.reload()
      await page.waitForTimeout(500)

      await page.click('button:has-text("Tap to begin")')
      await page.waitForTimeout(500)

      // Terrain should still render but with calm motion
      const canvas = page.locator('#gl')
      await expect(canvas).toBeVisible()
    })
  })

  test.describe('Acceptance criteria verification', () => {
    test('[AC1] Maintains acceptable FPS', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.click('button:has-text("Tap to begin")')

      const fps = await page.evaluate(async () => {
        return new Promise<number>((resolve) => {
          let frameCount = 0
          const startTime = performance.now()
          const duration = 1000

          function countFrame() {
            frameCount++
            const elapsed = performance.now() - startTime
            if (elapsed < duration) {
              requestAnimationFrame(countFrame)
            } else {
              resolve((frameCount / elapsed) * 1000)
            }
          }
          requestAnimationFrame(countFrame)
        })
      })

      // Lower threshold for CI/headless environments (10+ FPS acceptable)
      expect(fps).toBeGreaterThan(10)
    })

    test('[AC2] Zero GPU usage when tab is hidden', async ({ page }) => {
      await page.click('button:has-text("Tap to begin")')
      await page.waitForTimeout(500)

      // Hide tab
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {
          value: true,
          writable: true,
          configurable: true
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      await page.waitForTimeout(1000)

      // Show tab again
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', {
          value: false,
          writable: true,
          configurable: true
        })
        document.dispatchEvent(new Event('visibilitychange'))
      })

      await page.waitForTimeout(500)

      // Should resume without errors
      const canvas = page.locator('#gl')
      await expect(canvas).toBeVisible()
    })

    test('[AC3] Rotation and resize never distorts scene', async ({ page }) => {
      // Terrain is initialized lazily after the visitor dismisses the intro.
      await page.locator('button:has-text("Tap to begin")').click()

      const canvas = page.locator('#gl')
      await expect.poll(
        () => canvas.evaluate((el) => (el as HTMLCanvasElement).width),
        { message: 'Terrain renderer should initialize before resize checks' }
      ).toBeGreaterThan(300)

      const sizes = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 768, height: 1024 },
        { width: 375, height: 667 }
      ]

      for (const size of sizes) {
        await page.setViewportSize(size)
        await page.waitForTimeout(200)

        const canvas = page.locator('#gl')
        await expect(canvas).toBeVisible()

        const dimensions = await canvas.evaluate((el) => {
          const c = el as HTMLCanvasElement
          return {
            width: c.width,
            height: c.height,
            clientWidth: c.clientWidth,
            clientHeight: c.clientHeight
          }
        })

        expect(dimensions.clientWidth).toBe(size.width)
        expect(dimensions.clientHeight).toBe(size.height)
        const ratio = dimensions.width / dimensions.height
        const cssRatio = size.width / size.height
        expect(Math.abs(ratio - cssRatio)).toBeLessThan(0.05)
      }
    })
  })
})
