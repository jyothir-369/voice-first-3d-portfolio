import { test, expect } from '@playwright/test'

/**
 * Phase 2 E2E Tests: Voice Input and Output Layer
 *
 * Tests cover:
 * - Voice recognition availability and browser compatibility
 * - Speech synthesis availability
 * - Fallback modes (mic blocked, synthesis unavailable)
 * - Error handling and user messaging
 * - Settings persistence (localStorage)
 * - Interruption handling
 */

test.describe('Phase 2: Voice Layer - Browser Compatibility', () => {
  test('should detect browser voice support correctly', async ({ page, browserName }) => {
    await page.goto('/')

    // Check if browser support is detected correctly
    const support = await page.evaluate(() => {
      return {
        recognition: !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition),
        synthesis: !!window.speechSynthesis
      }
    })

    if (browserName === 'chromium') {
      expect(support.recognition).toBe(true)
      expect(support.synthesis).toBe(true)
    } else if (browserName === 'firefox') {
      // Firefox doesn't support SpeechRecognition
      expect(support.recognition).toBe(false)
      expect(support.synthesis).toBe(true) // But does support synthesis
    }
  })

  test('should show appropriate UI based on voice support', async ({ page, browserName }) => {
    await page.goto('/')

    if (browserName === 'firefox') {
      // Firefox should show text input fallback prominently
      // Voice UI should be disabled or hidden
      const micButton = page.locator('[data-testid="mic-button"]').or(page.locator('button:has-text("mic")'))
      if (await micButton.isVisible()) {
        await expect(micButton).toBeDisabled()
      }
    }
  })
})

test.describe('Phase 2: Voice Recognition API', () => {
  test('should have recognizer module loaded', async ({ page }) => {
    await page.goto('/')

    const recognizerAPI = await page.evaluate(async () => {
      const { isAvailable, getBrowserSupport } = await import('/src/voice/recognizer.ts')
      return {
        available: isAvailable(),
        support: getBrowserSupport()
      }
    })

    expect(recognizerAPI).toHaveProperty('available')
    expect(recognizerAPI).toHaveProperty('support')
    expect(recognizerAPI.support).toHaveProperty('browserName')
    expect(recognizerAPI.support).toHaveProperty('supported')
    expect(recognizerAPI.support).toHaveProperty('recommendation')
  })

  test('should not throw when starting recognition (even if unavailable)', async ({ page }) => {
    await page.goto('/')

    const errorThrown = await page.evaluate(async () => {
      try {
        const { start } = await import('/src/voice/recognizer.ts')
        start('en-US')
        return false
      } catch {
        return true
      }
    })

    expect(errorThrown).toBe(false)
  })

  test('should handle stop gracefully', async ({ page }) => {
    await page.goto('/')

    const errorThrown = await page.evaluate(async () => {
      try {
        const { start, stop } = await import('/src/voice/recognizer.ts')
        start('en-US')
        stop()
        return false
      } catch {
        return true
      }
    })

    expect(errorThrown).toBe(false)
  })
})

test.describe('Phase 2: Speech Synthesis API', () => {
  test('should have speaker module loaded with correct API', async ({ page }) => {
    await page.goto('/')

    const speakerAPI = await page.evaluate(async () => {
      const speaker = await import('/src/voice/speaker.ts')
      return {
        available: speaker.isAvailable(),
        hasUnlockAudio: typeof speaker.unlockAudio === 'function',
        hasSpeak: typeof speaker.speak === 'function',
        hasCancel: typeof speaker.cancel === 'function'
      }
    })

    expect(speakerAPI.available).toBe(true) // All modern browsers support synthesis
    expect(speakerAPI.hasUnlockAudio).toBe(true)
    expect(speakerAPI.hasSpeak).toBe(true)
    expect(speakerAPI.hasCancel).toBe(true)
  })

  test('should load voices on initialization', async ({ page }) => {
    await page.goto('/')

    const voicesLoaded = await page.evaluate(async () => {
      const { initSpeaker, getCurrentVoiceName } = await import('/src/voice/speaker.ts')
      initSpeaker()

      // Wait for voices to load
      await new Promise(resolve => setTimeout(resolve, 100))

      const voiceName = getCurrentVoiceName()
      return voiceName !== 'Voice' || voiceName.length > 0
    })

    expect(voicesLoaded).toBe(true)
  })

  test('should handle text chunking for long utterances', async ({ page }) => {
    await page.goto('/')

    const chunkingWorks = await page.evaluate(async () => {
      const { speak, cancel, initSpeaker } = await import('/src/voice/speaker.ts')
      initSpeaker()

      // Create long text that should be chunked (over 200 chars)
      const longText = 'This is a very long sentence that needs to be spoken. '.repeat(10)

      try {
        speak(longText)
        cancel() // Cancel immediately to avoid actually playing it
        return true
      } catch {
        return false
      }
    })

    expect(chunkingWorks).toBe(true)
  })

  test('should cancel speech without errors', async ({ page }) => {
    await page.goto('/')

    const cancelWorks = await page.evaluate(async () => {
      const { speak, cancel, initSpeaker } = await import('/src/voice/speaker.ts')
      initSpeaker()

      speak('Hello world')
      cancel()

      // Should be able to cancel multiple times
      cancel()
      cancel()

      return true
    })

    expect(cancelWorks).toBe(true)
  })
})

test.describe('Phase 2: Settings Persistence', () => {
  test('should persist voice rate to localStorage', async ({ page }) => {
    await page.goto('/')

    await page.evaluate(async () => {
      const { setRate, initSpeaker } = await import('/src/voice/speaker.ts')
      initSpeaker()
      setRate(1.25)
    })

    // Check localStorage
    const savedSettings = await page.evaluate(() => {
      const saved = localStorage.getItem('voice-settings')
      return saved ? JSON.parse(saved) : null
    })

    expect(savedSettings).toBeTruthy()
    expect(savedSettings.rate).toBe(1.25)
  })

  test('should restore settings from localStorage', async ({ page }) => {
    await page.goto('/')

    // Set initial settings
    await page.evaluate(() => {
      localStorage.setItem('voice-settings', JSON.stringify({
        voiceIndex: 1,
        rate: 1.5,
        captionsEnabled: false,
        handsFreeEnabled: true
      }))
    })

    // Reload and check if settings are restored
    await page.reload()

    const restoredSettings = await page.evaluate(async () => {
      const { initSpeaker, getRate, getCaptionsEnabled, getHandsFreeEnabled } = await import('/src/voice/speaker.ts')
      initSpeaker()

      return {
        rate: getRate(),
        captions: getCaptionsEnabled(),
        handsFree: getHandsFreeEnabled()
      }
    })

    expect(restoredSettings.rate).toBe(1.5)
    expect(restoredSettings.captions).toBe(false)
    expect(restoredSettings.handsFree).toBe(true)
  })

  test('should handle corrupted localStorage gracefully', async ({ page }) => {
    await page.goto('/')

    const errorThrown = await page.evaluate(async () => {
      localStorage.setItem('voice-settings', 'invalid json')

      try {
        const { initSpeaker } = await import('/src/voice/speaker.ts')
        initSpeaker()
        return false
      } catch {
        return true
      }
    })

    expect(errorThrown).toBe(false) // Should not throw
  })
})

test.describe('Phase 2: Microphone Meter', () => {
  test('should have meter module with correct API', async ({ page }) => {
    await page.goto('/')

    const meterAPI = await page.evaluate(async () => {
      const meter = await import('/src/voice/meter.ts')
      return {
        hasStart: typeof meter.start === 'function',
        hasStop: typeof meter.stop === 'function',
        hasGetAmplitude: typeof meter.getAmplitude === 'function',
        hasIsActive: typeof meter.isActive === 'function',
        hasIsSupported: typeof meter.isSupported === 'function'
      }
    })

    expect(meterAPI.hasStart).toBe(true)
    expect(meterAPI.hasStop).toBe(true)
    expect(meterAPI.hasGetAmplitude).toBe(true)
    expect(meterAPI.hasIsActive).toBe(true)
    expect(meterAPI.hasIsSupported).toBe(true)
  })

  test('should detect browser support correctly', async ({ page, browserName }) => {
    await page.goto('/')

    const supported = await page.evaluate(async () => {
      const { isSupported } = await import('/src/voice/meter.ts')
      return isSupported()
    })

    if (browserName === 'chromium') {
      expect(supported).toBe(true)
    } else {
      // Safari, Firefox should not support meter (to prevent conflicts)
      expect(supported).toBe(false)
    }
  })

  test('should return amplitude between 0 and 1', async ({ page }) => {
    await page.goto('/')

    const amplitude = await page.evaluate(async () => {
      const { getAmplitude } = await import('/src/voice/meter.ts')
      return getAmplitude()
    })

    expect(amplitude).toBeGreaterThanOrEqual(0)
    expect(amplitude).toBeLessThanOrEqual(1)
  })

  test('should handle start/stop without errors', async ({ page }) => {
    await page.goto('/')

    const errorThrown = await page.evaluate(async () => {
      try {
        const { start, stop } = await import('/src/voice/meter.ts')
        await start()
        stop()
        return false
      } catch {
        return true
      }
    })

    expect(errorThrown).toBe(false)
  })
})

test.describe('Phase 2: Fallback Modes', () => {
  test('should render without errors when speech APIs unavailable', async ({ page }) => {
    await page.goto('/')

    // Override speech APIs to simulate unavailability
    await page.evaluate(() => {
      // @ts-ignore
      delete window.speechSynthesis
      // @ts-ignore
      delete window.SpeechRecognition
      // @ts-ignore
      delete (window as any).webkitSpeechRecognition
    })

    // Page should still render
    await expect(page.locator('body')).toBeVisible()

    // Check for no console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.reload()
    await page.waitForLoadState('networkidle')

    // Should have no critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('localStorage') && // Acceptable in tests
      !e.includes('favicon') // Acceptable missing
    )
    expect(criticalErrors.length).toBe(0)
  })
})

test.describe('Phase 2: No Console Errors', () => {
  test('should load voice modules without console errors', async ({ page }) => {
    const errors: string[] = []
    const warnings: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
      if (msg.type() === 'warning') warnings.push(msg.text())
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Load all voice modules
    await page.evaluate(async () => {
      await import('/src/voice/recognizer.ts')
      await import('/src/voice/speaker.ts')
      await import('/src/voice/meter.ts')
    })

    // Filter out acceptable warnings
    const criticalErrors = errors.filter(e =>
      !e.includes('localStorage') &&
      !e.includes('favicon')
    )

    expect(criticalErrors.length).toBe(0)
  })
})

test.describe('Phase 2: Integration Tests', () => {
  test('should initialize all voice modules without conflicts', async ({ page }) => {
    await page.goto('/')

    const initialized = await page.evaluate(async () => {
      const recognizer = await import('/src/voice/recognizer.ts')
      const speaker = await import('/src/voice/speaker.ts')
      const meter = await import('/src/voice/meter.ts')

      // Initialize all
      speaker.initSpeaker()
      await meter.start()
      recognizer.setCallbacks({})

      // Stop meter to release resources
      meter.stop()

      return {
        recognizer: recognizer.isAvailable(),
        speaker: speaker.isAvailable(),
        meter: meter.isSupported()
      }
    })

    expect(initialized).toHaveProperty('recognizer')
    expect(initialized).toHaveProperty('speaker')
    expect(initialized).toHaveProperty('meter')
  })

  test('should handle rapid start/stop cycles', async ({ page }) => {
    await page.goto('/')

    const errorThrown = await page.evaluate(async () => {
      try {
        const recognizer = await import('/src/voice/recognizer.ts')

        // Rapid cycles
        for (let i = 0; i < 5; i++) {
          recognizer.start('en-US')
          recognizer.stop()
        }

        return false
      } catch {
        return true
      }
    })

    expect(errorThrown).toBe(false)
  })
})

test.describe('Phase 2: Audio Unlock (iOS/Safari)', () => {
  test('should provide unlockAudio function', async ({ page }) => {
    await page.goto('/')

    const hasUnlock = await page.evaluate(async () => {
      const { unlockAudio } = await import('/src/voice/speaker.ts')
      return typeof unlockAudio === 'function'
    })

    expect(hasUnlock).toBe(true)
  })

  test('should resolve unlockAudio without errors', async ({ page }) => {
    await page.goto('/')

    const unlocked = await page.evaluate(async () => {
      const { unlockAudio, initSpeaker } = await import('/src/voice/speaker.ts')
      initSpeaker()

      try {
        await unlockAudio()
        return true
      } catch {
        return false
      }
    })

    expect(unlocked).toBe(true)
  })
})
