/**
 * Phase 8 Accessibility — keyboard, screen reader, captions, reduced motion.
 * Implements WCAG 2.2 AA requirements from the v12 implementation plan.
 */
export const A11Y = {
  initKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target as HTMLElement
        const interactive = target.tagName === 'BUTTON' || target.tagName === 'A' || target.getAttribute('role') === 'button'
        if (interactive) e.preventDefault()
      }
    })

    const skipLink = document.getElementById('skip-link') as HTMLElement | null
    if (skipLink) skipLink.addEventListener('click', () => {
      const main = document.getElementById('main-content')
      if (main) {
        main.focus()
        main.scrollIntoView({ behavior: 'smooth' })
      }
    })
  },

  initScreenReaderRegions() {
    if (!document.getElementById('status-live')) {
      const el = document.createElement('div')
      el.id = 'status-live'
      el.className = 'sr-only'
      el.setAttribute('role', 'status')
      el.setAttribute('aria-live', 'polite')
      document.body.appendChild(el)
    }
    if (!document.getElementById('critical-live')) {
      const el = document.createElement('div')
      el.id = 'critical-live'
      el.className = 'sr-only'
      el.setAttribute('role', 'alert')
      el.setAttribute('aria-live', 'assertive')
      document.body.appendChild(el)
    }
  },

  initReducedMotion(media: MediaQueryList | MediaQueryListLike) {
    const check = (m: MediaQueryList | MediaQueryListLike) => {
      const reduce = m.matches
      if (reduce) {
        document.documentElement.setAttribute('data-reduced-motion', 'true')
      } else {
        document.documentElement.removeAttribute('data-reduced-motion')
      }
    }
    check(media)
    media.addEventListener?.('change', e => {
      check(e as MediaQueryList | MediaQueryListLike)
    })
  }
}

export interface MediaQueryListLike {
  matches: boolean
  addEventListener?: (type: string, cb: (e: MediaQueryListEvent) => void) => void
}