import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Phase 7: "Skip voice, use text" typed input.
 * Hidden by default, revealed by the toggle, submits on Enter or Send,
 * and sends exactly what the visitor typed.
 */

async function loadModule() {
  vi.resetModules()
  const mod = await import('@/ui/typed')
  return mod
}

function setupDom(): void {
  document.body.innerHTML = '<div class="deck"></div>'
}

describe('Phase 7: typed input route', () => {
  beforeEach(() => {
    setupDom()
  })

  it('starts hidden and has a labelled input plus send button', async () => {
    const { initTyped } = await loadModule()
    const els = initTyped(() => {})
    expect(els).not.toBeNull()
    if (!els) return
    expect(els.row.hidden).toBe(true)
    expect(els.input.getAttribute('aria-label')).toContain('question')
    expect(els.send.textContent).toBe('Send')
  })

  it('sends the typed question on Enter and clears the field', async () => {
    const { initTyped, setTypedVisible } = await loadModule()
    const onSend = vi.fn()
    const els = initTyped(onSend)
    expect(els).not.toBeNull()
    if (!els) return
    setTypedVisible(els, true)
    els.input.value = 'What do you build?'
    els.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(onSend).toHaveBeenCalledWith('What do you build?')
    expect(els.input.value).toBe('')
  })

  it('sends on Send click and ignores empty input', async () => {
    const { initTyped, setTypedVisible } = await loadModule()
    const onSend = vi.fn()
    const els = initTyped(onSend)
    expect(els).not.toBeNull()
    if (!els) return
    setTypedVisible(els, true)
    els.send.click()
    expect(onSend).not.toHaveBeenCalled()
    els.input.value = 'Are you technical?'
    els.send.click()
    expect(onSend).toHaveBeenCalledWith('Are you technical?')
  })

  it('toggle returns the visibility flag it applied', async () => {
    const { initTyped, setTypedVisible } = await loadModule()
    const els = initTyped(() => {})
    expect(els).not.toBeNull()
    if (!els) return
    expect(setTypedVisible(els, true)).toBe(true)
    expect(setTypedVisible(els, false)).toBe(false)
  })
})
