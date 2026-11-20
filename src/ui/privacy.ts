/**
 * Phase 8 Privacy — mic consent moment.
 *
 * The plan (§8.2) requires: "a short notice shown before the first listen" and
 * "the 'Tap to begin' screen links to the privacy note". This module injects a
 * compact notice under the begin button; it never blocks the mic on its own —
 * the first `begin` tap still works — but it makes the data flow visible at the
 * exact moment a visitor decides to talk.
 */
export interface PrivacyEls {
  notice: HTMLParagraphElement
  link: HTMLAnchorElement
}

export function initPrivacyNotice(): PrivacyEls | null {
  const intro = document.querySelector('.intro')
  if (!intro) return null

  // Don't duplicate if the markup already ships a notice.
  if (document.getElementById('privacy-notice')) return null

  const notice = document.createElement('p')
  notice.id = 'privacy-notice'
  notice.className = 'privacy-notice'

  const link = document.createElement('a')
  link.id = 'privacy-link'
  link.href = '/privacy.html'
  link.textContent = 'how your voice data is handled'
  link.target = '_blank'
  link.rel = 'noopener'

  notice.append(
    'Your browser may send audio to its speech service to turn your voice into ' +
    'text. This site never records or stores audio. '
  )
  notice.appendChild(link)
  notice.appendChild(document.createTextNode('.'))

  const begin = intro.querySelector('.begin')
  if (begin && begin.nextSibling) {
    intro.insertBefore(notice, begin.nextSibling)
  } else {
    intro.appendChild(notice)
  }

  return { notice, link }
}

/** Returns true when the visitor has already acknowledged the notice this session. */
export function micNoticeAcknowledged(): boolean {
  try {
    return window.sessionStorage.getItem('vp-mic-notice') === '1'
  } catch {
    return false
  }
}

/** Record that the visitor saw the notice (called on the first mic/begin tap). */
export function acknowledgeMicNotice(): void {
  try {
    window.sessionStorage.setItem('vp-mic-notice', '1')
  } catch {
    /* private mode: notice reappears next visit */
  }
}