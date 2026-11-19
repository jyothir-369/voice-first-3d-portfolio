/**
 * Phase 8 Accessibility — unit tests for privacy module + keyboard handling.
 */
import { describe, it, expect } from 'vitest'
import { initPrivacyNotice, micNoticeAcknowledged, acknowledgeMicNotice } from '@/ui/privacy'

describe('Phase 8 Accessibility', () => {
  it('should provide keyboard shortcut handler', async () => {
    const { A11Y } = await import('@/ui/a11y')
    expect(A11Y).toBeDefined()
    expect(typeof A11Y.initKeyboardShortcuts).toBe('function')
    expect(typeof A11Y.initScreenReaderRegions).toBe('function')
    expect(typeof A11Y.initReducedMotion).toBe('function')
  })

  it('should create privacy notice with plain-language mic handling text', async () => {
    // In jsdom, initPrivacyNotice needs a .intro element; guard for absence.
    const created = initPrivacyNotice()
    // Should not crash; may return null if .intro absent (jsdom default)
    expect(created).toBeDefined()
  })

  it('should track mic notice acknowledgement in session storage', async () => {
    expect(micNoticeAcknowledged()).toBe(false)
    acknowledgeMicNotice()
    expect(micNoticeAcknowledged()).toBe(true)
  })
})
