import { describe, it, expect } from 'vitest'

/**
 * Voice API Surface Tests
 * These tests verify the API structure and basic behavior without deep mocking.
 * Full functional tests are in E2E tests with real browsers.
 */

describe('Voice Recognizer API', () => {
  it('exports expected functions', async () => {
    const recognizer = await import('@/voice/recognizer')

    expect(recognizer.isAvailable).toBeDefined()
    expect(recognizer.getBrowserSupport).toBeDefined()
    expect(recognizer.start).toBeDefined()
    expect(recognizer.stop).toBeDefined()
    expect(recognizer.isListening).toBeDefined()
    expect(recognizer.setCallbacks).toBeDefined()
    expect(recognizer.setLanguage).toBeDefined()
  })

  it('isAvailable returns boolean', async () => {
    const { isAvailable } = await import('@/voice/recognizer')
    expect(typeof isAvailable()).toBe('boolean')
  })

  it('getBrowserSupport returns correct shape', async () => {
    const { getBrowserSupport } = await import('@/voice/recognizer')
    const support = getBrowserSupport()

    expect(support).toHaveProperty('supported')
    expect(support).toHaveProperty('browserName')
    expect(support).toHaveProperty('recommendation')
    expect(typeof support.supported).toBe('boolean')
    expect(typeof support.browserName).toBe('string')
  })

  it('isListening returns false initially', async () => {
    const { isListening } = await import('@/voice/recognizer')
    expect(isListening()).toBe(false)
  })

  it('setCallbacks accepts callback object without throwing', async () => {
    const { setCallbacks } = await import('@/voice/recognizer')

    expect(() => {
      setCallbacks({
        onStart: () => {},
        onInterim: () => {},
        onFinal: () => {},
        onError: () => {},
        onEnd: () => {}
      })
    }).not.toThrow()
  })

  it('start and stop do not throw', async () => {
    const { start, stop } = await import('@/voice/recognizer')

    expect(() => start('en-US')).not.toThrow()
    expect(() => stop()).not.toThrow()
  })
})

describe('Voice Speaker API', () => {
  it('exports expected functions', async () => {
    const speaker = await import('@/voice/speaker')

    expect(speaker.isAvailable).toBeDefined()
    expect(speaker.initSpeaker).toBeDefined()
    expect(speaker.loadVoices).toBeDefined()
    expect(speaker.speak).toBeDefined()
    expect(speaker.cancel).toBeDefined()
    expect(speaker.unlockAudio).toBeDefined()
    expect(speaker.getCurrentVoiceName).toBeDefined()
    expect(speaker.nextVoice).toBeDefined()
    expect(speaker.setRate).toBeDefined()
    expect(speaker.getRate).toBeDefined()
    expect(speaker.setCaptions).toBeDefined()
    expect(speaker.getCaptionsEnabled).toBeDefined()
    expect(speaker.setHandsFree).toBeDefined()
    expect(speaker.getHandsFreeEnabled).toBeDefined()
    expect(speaker.setCallbacks).toBeDefined()
  })

  it('isAvailable returns boolean', async () => {
    const { isAvailable } = await import('@/voice/speaker')
    expect(typeof isAvailable()).toBe('boolean')
  })

  it('getRate returns number', async () => {
    const { getRate } = await import('@/voice/speaker')
    expect(typeof getRate()).toBe('number')
  })

  it('getCaptionsEnabled returns boolean', async () => {
    const { getCaptionsEnabled } = await import('@/voice/speaker')
    expect(typeof getCaptionsEnabled()).toBe('boolean')
  })

  it('getHandsFreeEnabled returns boolean', async () => {
    const { getHandsFreeEnabled } = await import('@/voice/speaker')
    expect(typeof getHandsFreeEnabled()).toBe('boolean')
  })

  it('settings can be updated without throwing', async () => {
    const { setRate, setCaptions, setHandsFree } = await import('@/voice/speaker')

    expect(() => setRate(1.15)).not.toThrow()
    expect(() => setCaptions(false)).not.toThrow()
    expect(() => setHandsFree(true)).not.toThrow()
  })

  it('speak and cancel do not throw', async () => {
    const { speak, cancel } = await import('@/voice/speaker')

    expect(() => speak('test')).not.toThrow()
    expect(() => cancel()).not.toThrow()
  })

  it('unlockAudio returns promise', async () => {
    const { unlockAudio } = await import('@/voice/speaker')
    const result = unlockAudio()

    expect(result).toBeInstanceOf(Promise)
    await result // Should resolve without error
  })
})

describe('Voice Meter API', () => {
  it('exports expected functions', async () => {
    const meter = await import('@/voice/meter')

    expect(meter.start).toBeDefined()
    expect(meter.stop).toBeDefined()
    expect(meter.getAmplitude).toBeDefined()
    expect(meter.isActive).toBeDefined()
    expect(meter.isSupported).toBeDefined()
    expect(meter.getLastError).toBeDefined()
  })

  it('isSupported returns boolean', async () => {
    const { isSupported } = await import('@/voice/meter')
    expect(typeof isSupported()).toBe('boolean')
  })

  it('isActive returns boolean', async () => {
    const { isActive } = await import('@/voice/meter')
    expect(typeof isActive()).toBe('boolean')
  })

  it('getAmplitude returns number', async () => {
    const { getAmplitude } = await import('@/voice/meter')
    const amplitude = getAmplitude()

    expect(typeof amplitude).toBe('number')
    expect(amplitude).toBeGreaterThanOrEqual(0)
    expect(amplitude).toBeLessThanOrEqual(1)
  })

  it('start and stop do not throw', async () => {
    const { start, stop } = await import('@/voice/meter')

    await expect(start()).resolves.toBeUndefined()
    expect(() => stop()).not.toThrow()
  })

  it('getLastError returns string or null', async () => {
    const { getLastError } = await import('@/voice/meter')
    const error = getLastError()

    expect(error === null || typeof error === 'string').toBe(true)
  })
})
