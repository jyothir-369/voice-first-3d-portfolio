import { EMAIL_ADDRESS } from '../content'


/**
 * Contact moment: after the "how do I hire you" answer, show a prominent,
 * tappable email button with copy-to-clipboard. Voice alone is never the
 * only way to reach the owner (plan Phase 7, task 6).
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
  link.href = `mailto:${EMAIL_ADDRESS}`
  link.textContent = EMAIL_ADDRESS

  const copy = document.createElement('button')
  copy.type = 'button'
  copy.className = 'contact-copy'
  copy.textContent = 'Copy email'
  copy.setAttribute('aria-label', `Copy email address ${EMAIL_ADDRESS} to clipboard`)
  copy.addEventListener('click', async () => {
    const done = async (ok: boolean): Promise<void> => {
      copy.textContent = ok ? 'Copied' : 'Copy email'
      copy.setAttribute('aria-label', ok ? 'Email address copied' : `Copy email address ${EMAIL_ADDRESS} to clipboard`)
      window.setTimeout(() => {
        copy.textContent = 'Copy email'
        copy.setAttribute('aria-label', `Copy email address ${EMAIL_ADDRESS} to clipboard`)
      }, 2000)
    }
    try {
      await navigator.clipboard.writeText(EMAIL_ADDRESS)
      await done(true)
    } catch {
      try {
        const area = document.createElement('textarea')
        area.value = EMAIL_ADDRESS
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
  open.href = `mailto:${EMAIL_ADDRESS}`
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
