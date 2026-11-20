/**
 * Phase 8 Accessibility — unit tests for privacy module + keyboard handling.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { initPrivacyNotice, micNoticeAcknowledged, acknowledgeMicNotice } from '@/ui/privacy'

describe('Phase 8 Accessibility', () => {
  it('should provide keyboard shortcut handler', async () => {
    const { A11Y } = await import('@/ui/a11y')
    expect(A11Y).toBeDefined()
    expect(typeof A11Y.initKeyboardShortcuts).toBe('function')
    expect(typeof A11Y.initScreenReaderRegions).toBe('function')
    expect(typeof A11Y.initReducedMotion).toBe('function')
  })

  describe('initPrivacyNotice', () => {
    beforeEach(() => {
      document.body.innerHTML = '<section class="intro"><button class="begin">Begin</button></section>'
    })

    it('creates a notice element and returns it', () => {
      const result = initPrivacyNotice()
      expect(result).not.toBeNull()
      expect(result!.notice).toBeInstanceOf(HTMLParagraphElement)
      expect(result!.link).toBeInstanceOf(HTMLAnchorElement)
    })

    it('inserts notice into the DOM with correct id', () => {
      initPrivacyNotice()
      const el = document.getElementById('privacy-notice')
      expect(el).not.toBeNull()
      expect(el!.tagName).toBe('P')
    })

    it('notice contains a link to /privacy.html with descriptive text', () => {
      initPrivacyNotice()
      const link = document.getElementById('privacy-link') as HTMLAnchorElement | null
      expect(link).not.toBeNull()
      expect(link!.href).toContain('privacy.html')
      expect(link!.textContent).toContain('how your voice data is handled')
    })

    it('does not duplicate the notice on a second call', () => {
      initPrivacyNotice()
      initPrivacyNotice()
      const notices = document.querySelectorAll('#privacy-notice')
      expect(notices.length).toBe(1)
    })
  })

  describe('mic notice acknowledgement', () => {
    beforeEach(() => {
      sessionStorage.removeItem('vp-mic-notice')
    })

    it('starts unacknowledged', () => {
      expect(micNoticeAcknowledged()).toBe(false)
    })

    it('acknowledgeMicNotice sets the acknowledged flag', () => {
      acknowledgeMicNotice()
      expect(micNoticeAcknowledged()).toBe(true)
    })
  })
})
