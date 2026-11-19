/**
 * Typed question input ("Skip voice, use text").
 *
 * Adds a text field and a send button for visitors who prefer not to talk.
 * Voice stays the default for everyone else; this is an additional route.
 */
export interface TypedEls {
  row: HTMLDivElement
  input: HTMLInputElement
  send: HTMLButtonElement
}

export function initTyped(onSend: (_question: string) => void): TypedEls | null {
  const deck = document.querySelector('.deck')
  if (!deck) return null

  const row = document.createElement('div')
  row.className = 'typed'
  row.id = 'typed'
  row.hidden = true

  const input = document.createElement('input')
  input.type = 'text'
  input.id = 'typed-input'
  input.className = 'typed-input'
  input.placeholder = 'Type your question, then press Enter'
  input.setAttribute('aria-label', 'Type your question instead of speaking')
  input.autocomplete = 'off'
  input.maxLength = 300

  const send = document.createElement('button')
  send.type = 'button'
  send.id = 'typed-send'
  send.className = 'typed-send'
  send.textContent = 'Send'
  send.setAttribute('aria-label', 'Send typed question')

  const submit = (): void => {
    const value = input.value.trim()
    if (!value) return
    input.value = ''
    onSend(value)
  }

  send.addEventListener('click', submit)
  input.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      submit()
    }
  })

  row.append(input, send)
  deck.before(row)
  return { row, input, send }
}

/**
 * Show or hide the typed input row. Returns the new visibility.
 */
export function setTypedVisible(els: TypedEls | null, visible: boolean): boolean {
  if (!els) return false
  els.row.hidden = !visible
  if (visible) {
    els.input.focus()
  }
  return visible
}