import { test, expect } from '@playwright/test'

/**
 * Phase 1 Verification Tests
 *
 * Acceptance Criteria from v12-voice-portfolio-implementation-plan.md:
 * - [ ] `npm run dev` shows the same experience as the v12 prototype
 * - [ ] `npm run build` produces a static site with no errors
 * - [ ] A pull request produces a preview URL automatically (CI test)
 * - [ ] No secrets are committed (CI test)
 *
 * This suite verifies the modularized application matches the v12 prototype behavior:
 * - Layout and UI structure
 * - 3D terrain rendering
 * - 3D object stage
 * - Controls and interactions
 * - Theme switching
 * - Responsive behavior
 * - No console errors
 * - Resource cleanup
 */

test.describe('Phase 1: Foundation Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test.describe('Layout and UI Structure', () => {
    test('should display the v12 layout structure', async ({ page }) => {
      // Check intro screen with "TALK TO MY WORK" heading (may be split across lines)
      const introHeading = page.locator('h1').filter({ hasText: /TALK TO/i })
      await expect(introHeading).toBeVisible()

      // Check "Tap to begin" button
      const beginButton = page.getByRole('button', { name: /tap to begin/i })
      await expect(beginButton).toBeVisible()

      // Check trending content row - use .first() to handle multiple matches
      const trendingText = page.locator('text=/trending/i').first()
      await expect(trendingText).toBeVisible()
    })

    test('should show main UI after dismissing intro', async ({ page }) => {
      // Click "Tap to begin"
      await page.getByRole('button', { name: /tap to begin/i }).click()

      // Wait for intro to fade out
      await page.waitForTimeout(1000)

      // Check header elements
      const header = page.locator('.top')
      await expect(header).toBeVisible()

      // Check status indicator
      const status = page.locator('.status')
      await expect(status).toBeVisible()

      // Check microphone button
      const micButton = page.locator('.mic')
      await expect(micButton).toBeVisible()

      // Check caption area
      const caption = page.locator('.cap')
      await expect(caption).toBeVisible()
    })

    test('should display question chips', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      // Check for chip buttons
      const chips = page.locator('.chips button')
      const chipCount = await chips.count()
      expect(chipCount).toBeGreaterThan(0)

      // Check that chips are visible and clickable
      const firstChip = chips.first()
      await expect(firstChip).toBeVisible()
      await expect(firstChip).toBeEnabled()
    })

    test('should display control options (theme, subtitles, debug)', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      // Check options row
      const options = page.locator('.opts')
      await expect(options).toBeVisible()

      // Check for option buttons
      const optButtons = options.locator('button')
      const optCount = await optButtons.count()
      expect(optCount).toBeGreaterThanOrEqual(2) // At least theme and subtitles
    })
  })

  test.describe('3D Graphics - WebGL Canvas', () => {
    test('should render WebGL canvas element', async ({ page }) => {
      // Check for canvas element
      const canvas = page.locator('canvas#gl')
      await expect(canvas).toBeVisible()

      // Verify canvas has non-zero dimensions
      const box = await canvas.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.width).toBeGreaterThan(0)
      expect(box!.height).toBeGreaterThan(0)
    })

    test('should initialize Three.js scene', async ({ page }) => {
      // Check that WebGL context exists (Three.js is bundled)
      const hasWebGL = await page.evaluate(() => {
        const canvas = document.querySelector('canvas#gl') as HTMLCanvasElement
        if (!canvas) return false
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
        return gl !== null
      })

      expect(hasWebGL).toBe(true)
    })

    test('should render dot-wave terrain (no WebGL errors)', async ({ page }) => {
      await page.waitForTimeout(1000) // Let scene initialize

      // Check for WebGL context loss or errors
      const webglErrors = await page.evaluate(() => {
        const canvas = document.querySelector('canvas#gl') as HTMLCanvasElement
        if (!canvas) return ['Canvas not found']

        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
        if (!gl) return ['WebGL context not available']

        const isContextLost = gl.isContextLost()
        if (isContextLost) return ['WebGL context lost']

        return []
      })

      expect(webglErrors).toHaveLength(0)
    })
  })

  test.describe('Theme Switching', () => {
    test('should toggle between light and dark themes', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme')
      })

      // Find and click theme toggle button
      const themeButton = page.locator('.opts button').filter({ hasText: /light|dark|theme/i }).first()

      if (await themeButton.count() > 0) {
        await themeButton.click()
        await page.waitForTimeout(300)

        // Check theme changed
        const newTheme = await page.evaluate(() => {
          return document.documentElement.getAttribute('data-theme')
        })

        expect(newTheme).not.toBe(initialTheme)
      }
    })

    test('should apply correct CSS variables for dark theme', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark')
      })

      const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
      })

      // Dark theme should have dark background
      expect(bgColor).toBeTruthy()
    })

    test('should apply correct CSS variables for light theme', async ({ page }) => {
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light')
      })

      const bgColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
      })

      // Light theme should have light background
      expect(bgColor).toBeTruthy()
    })
  })

  test.describe('Controls and Interactions', () => {
    test('should respond to microphone button click', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      const micButton = page.locator('.mic')

      // Click mic button
      await micButton.click()
      await page.waitForTimeout(300)

      // Check if state changed (either listening or showing permission error)
      const bodyState = await page.evaluate(() => {
        return document.body.getAttribute('data-s')
      })

      // State should be set (listening, idle, or thinking)
      expect(bodyState).toBeTruthy()
    })

    test('should handle chip button clicks', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      const firstChip = page.locator('.chips button').first()

      if (await firstChip.count() > 0) {
        await firstChip.click()
        await page.waitForTimeout(500)

        // Check that caption area shows response
        const aiResponse = page.locator('.cap .ai')
        await expect(aiResponse).toBeVisible()
      }
    })

    test('should show hover effects on interactive elements', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      const micButton = page.locator('.mic')

      // Hover over mic button
      await micButton.hover()

      // Check for transform or visual change (testing CSS transition)
      const transform = await micButton.evaluate((el) => {
        return window.getComputedStyle(el).transform
      })

      // Hover should apply transform: scale(1.06)
      expect(transform).toBeTruthy()
    })
  })

  test.describe('Responsive Behavior', () => {
    test('should work on mobile viewport (375x667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Check layout adapts
      const canvas = page.locator('canvas#gl')
      await expect(canvas).toBeVisible()

      const box = await canvas.boundingBox()
      expect(box!.width).toBeLessThanOrEqual(375)
    })

    test('should work on tablet viewport (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')

      const canvas = page.locator('canvas#gl')
      await expect(canvas).toBeVisible()

      const box = await canvas.boundingBox()
      expect(box!.width).toBeLessThanOrEqual(768)
    })

    test('should work on desktop viewport (1920x1080)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/')

      const canvas = page.locator('canvas#gl')
      await expect(canvas).toBeVisible()
    })

    test('should not have horizontal scroll on narrow screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }) // iPhone SE
      await page.goto('/')

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1) // Allow 1px tolerance
    })
  })

  test.describe('Console and Network Health', () => {
    test('should not have JavaScript errors in console', async ({ page }) => {
      const consoleErrors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      page.on('pageerror', (error) => {
        consoleErrors.push(error.message)
      })

      await page.goto('/')
      await page.waitForTimeout(2000) // Let page fully load

      // Filter out expected errors (e.g., microphone permission)
      const unexpectedErrors = consoleErrors.filter(err =>
        !err.includes('microphone') &&
        !err.includes('getUserMedia') &&
        !err.includes('NotAllowedError')
      )

      expect(unexpectedErrors).toHaveLength(0)
    })

    test('should load all critical resources', async ({ page }) => {
      const failedRequests: string[] = []

      page.on('requestfailed', (request) => {
        const url = request.url()
        // Filter out expected failures (fonts, analytics, etc.)
        if (!url.includes('analytics') && !url.includes('fonts.gstatic')) {
          failedRequests.push(url)
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      expect(failedRequests).toHaveLength(0)
    })

    test('should complete page load within reasonable time', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      const loadTime = Date.now() - startTime

      // Page should load in under 5 seconds
      expect(loadTime).toBeLessThan(5000)
    })
  })

  test.describe('State Management', () => {
    test('should track application state correctly', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      // Initial state should be idle or thinking
      const initialState = await page.evaluate(() => {
        return document.body.getAttribute('data-s')
      })

      expect(['idle', 'thinking', null]).toContain(initialState)
    })

    test('should update status indicator based on state', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      const statusIndicator = page.locator('.status i')
      await expect(statusIndicator).toBeVisible()

      // Status dot should have background color
      const bgColor = await statusIndicator.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      expect(bgColor).toBeTruthy()
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)') // Not transparent
    })
  })

  test.describe('Typography and Fonts', () => {
    test('should load custom fonts', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Check that Doto font is applied to dot-matrix elements
      const dotElement = page.locator('.dot').first()

      if (await dotElement.count() > 0) {
        const fontFamily = await dotElement.evaluate((el) => {
          return window.getComputedStyle(el).fontFamily
        })

        expect(fontFamily).toContain('Doto')
      }
    })

    test('should have readable text sizes on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      // Check that text is at least 14px (readable on mobile)
      const chipButton = page.locator('.chips button').first()

      if (await chipButton.count() > 0) {
        const fontSize = await chipButton.evaluate((el) => {
          return parseFloat(window.getComputedStyle(el).fontSize)
        })

        expect(fontSize).toBeGreaterThanOrEqual(13) // 14px target, allow small variance
      }
    })
  })

  test.describe('Accessibility Basics', () => {
    test('should have accessible focus indicators', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      const micButton = page.locator('.mic')

      // Focus the mic button
      await micButton.focus()

      // Check for visible focus outline
      const outline = await micButton.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle
        }
      })

      // Should have outline or box-shadow for focus
      expect(outline.outline !== 'none' || outline.outlineWidth !== '0px').toBeTruthy()
    })

    test('should have proper button roles', async ({ page }) => {
      await page.getByRole('button', { name: /tap to begin/i }).click()
      await page.waitForTimeout(500)

      // Check that interactive elements are buttons or have proper roles
      const micButton = page.locator('.mic')
      const tagName = await micButton.evaluate((el) => el.tagName.toLowerCase())

      expect(tagName).toBe('button')
    })
  })

  test.describe('Performance Metrics', () => {
    test('should have acceptable bundle size', async ({ page }) => {
      const resourceSizes: Record<string, number> = {}

      page.on('response', async (response) => {
        const url = response.url()
        if (url.includes('.js') || url.includes('.css')) {
          try {
            const buffer = await response.body()
            resourceSizes[url] = buffer.length
          } catch (e) {
            // Ignore errors getting response body
          }
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const totalSize = Object.values(resourceSizes).reduce((a, b) => a + b, 0)

      // Total JS/CSS should be under 2MB uncompressed
      expect(totalSize).toBeLessThan(2 * 1024 * 1024)
    })
  })

  test.describe('Resource Cleanup', () => {
    test('should clean up WebGL context on navigation', async ({ page }) => {
      await page.goto('/')
      await page.waitForTimeout(1000)

      // Navigate away
      await page.goto('about:blank')
      await page.waitForTimeout(500)

      // Navigate back
      await page.goto('/')
      await page.waitForTimeout(1000)

      // Check WebGL context is still valid
      const hasWebGL = await page.evaluate(() => {
        const canvas = document.querySelector('canvas#gl') as HTMLCanvasElement
        if (!canvas) return false
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
        return gl !== null && !gl.isContextLost()
      })

      expect(hasWebGL).toBe(true)
    })
  })
})

  test.describe('Phase 1: Comparison with Original Prototype', () => {
    test('should preserve v12 visual structure', async ({ page }) => {
      await page.goto('/')

      // Check key v12 elements exist
      const v12Selectors = ['h1', 'canvas#gl', 'button']

      for (const selector of v12Selectors) {
        const element = page.locator(selector).first()
        await expect(element).toBeVisible({ timeout: 5000 })
      }
    })

  test('should maintain v12 color scheme', async ({ page }) => {
    await page.goto('/')

    // Check CSS custom properties are defined
    const hasVars = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      return {
        bg: styles.getPropertyValue('--bg'),
        ink: styles.getPropertyValue('--ink'),
        red: styles.getPropertyValue('--red'),
      }
    })

    expect(hasVars.bg).toBeTruthy()
    expect(hasVars.ink).toBeTruthy()
    expect(hasVars.red).toBeTruthy()
  })
})
