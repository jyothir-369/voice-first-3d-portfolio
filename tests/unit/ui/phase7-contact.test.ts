import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Phase 7: the contact moment after the hire question.
 * The panel is hidden by default, appears after a hire/contact question,
 * and its mailto link always points at the verified email.
 */

const EMAIL = 'jyothirraghavalu369@gmail.com'

async function loadModule() {
  vi.resetModules()
  const mod = await import('@/ui/contact')
  return mod
}

function setupDom(): void {
  document.body.innerHTML = '<div class="cap"></div>'
}

describe('Phase 7: contact moment', () => {
  beforeEach(() => {
    setupDom()
  })

  it('starts hidden and carries a mailto route for the verified email', async () => {
    const { initContact } = await loadModule()
    const els = initContact()
    expect(els).not.toBeNull()
    if (!els) return
    expect(els.panel.hidden).toBe(true)
    const link = els.panel.querySelector('a.contact-mail') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe(`mailto:${EMAIL}`)
    expect(link.textContent).toBe(EMAIL)
  })

  it('shows and hides on demand', async () => {
    const { initContact, setContactVisible } = await loadModule()
    const els = initContact()
    expect(els).not.toBeNull()
    if (!els) return
    expect(setContactVisible(els, true)).toBe(true)
    expect(els.panel.hidden).toBe(false)
    expect(setContactVisible(els, false)).toBe(false)
    expect(els.panel.hidden).toBe(true)
  })

  it('copy button puts the verified email on the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { initContact } = await loadModule()
    const els = initContact()
    expect(els).not.toBeNull()
    if (!els) return
    await els.copy.click()
    expect(writeText).toHaveBeenCalledWith(EMAIL)
    expect(els.copy.textContent).toBe('Copied')
    vi.unstubAllGlobals()
  })
})
