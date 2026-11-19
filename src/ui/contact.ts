/**
 * Phase 8 Contact Panel — mailto link, open-email-app button, copy-to-clipboard.
 * Appears after hire/contact questions so voice is never the only route.
 */
export interface ContactEls {
  panel: HTMLDivElement
  copy: HTMLButtonElement
}

export function initContact(): ContactEls | null {
  const anchor = document.querySelector('.cap')
  if (!anchor) return null

  const panel = document.createElement('div')
  panel.className = 'contact'
  panel.id = 'contact'
  panel.hidden = true

  const label = document.createElement('span')
  label.className = 'contact-label'
  label.textContent = 'Prefer text? Reach me here:'

  const link = document.createElement('a')
  link.className = 'contact-mail'
  link.href = 'mailto:jyothirraghavalu369@gmail.com'
  link.textContent = 'jyothirraghavalu369@gmail.com'

  const copy = document.createElement('button')
  copy.type = 'button'
  copy.className = 'contact-copy'
  copy.textContent = 'Copy email'
  copy.setAttribute('aria-label', `Copy email address jyothirraghavalu369@gmail.com to clipboard`)
  copy.addEventListener('click', async () => {
    const done = async (ok: boolean): Promise<void> => {
      copy.textContent = ok ? 'Copied' : 'Copy email'
      copy.setAttribute('aria-label', ok ? 'Email address copied' : `Copy email address jyothirraghavalu369@gmail.com to clipboard`)
      window.setTimeout(() => {
        copy.textContent = 'Copy email'
        copy.setAttribute('aria-label', `Copy email address jyothirraghavalu369@gmail.com to clipboard`)
      }, 2000)
    }
    try {
      await navigator.clipboard.writeText('jyothirraghavalu369@gmail.com')
      await done(true)
    } catch {
      try {
        const area = document.createElement('textarea')
        area.value = 'jyothirraghavalu369@gmail.com'
        document.body.appendChild(area)
        area.select()
        document.execCommand('copy')
        area.remove()
        await done(true)
      } catch {
        await done(false)
      }
    }
  })

  const open = document.createElement('a')
  open.className = 'contact-open'
  open.href = 'mailto:jyothirraghavalu369@gmail.com'
  open.textContent = 'Open email app'

  panel.append(label, link, copy, open)
  anchor.after(panel)
  return { panel, copy }
}

/**
 * Show or hide the contact panel. Returns the new visibility.
 */
export function setContactVisible(els: ContactEls | null, visible: boolean): boolean {
  if (!els) return false
  els.panel.hidden = !visible
  return visible
}