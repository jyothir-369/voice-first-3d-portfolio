import type { AppState } from '@/types'

const elements = {
  intro: document.getElementById('intro') as HTMLDivElement,
  begin: document.getElementById('begin') as HTMLButtonElement,
  mic: document.getElementById('mic') as HTMLButtonElement,
  you: document.getElementById('you') as HTMLDivElement,
  ai: document.getElementById('ai') as HTMLDivElement,
  cap: document.getElementById('cap') as HTMLDivElement,
  chips: document.getElementById('chips') as HTMLDivElement,
  stx: document.getElementById('stx') as HTMLSpanElement,
  oc: document.getElementById('oc') as HTMLButtonElement,
  ov: document.getElementById('ov') as HTMLButtonElement,
  os: document.getElementById('os') as HTMLButtonElement,
  oh: document.getElementById('oh') as HTMLButtonElement
}

/**
 * Set application state and update UI
 */
export function setState(state: AppState): void {
  document.body.dataset.s = state

  const statusText: Record<AppState, string> = {
    idle: 'TAP TO TALK',
    listening: 'LISTENING',
    speaking: 'SPEAKING',
    thinking: 'THINKING',
    intro: 'IDLE'
  }

  elements.stx.textContent = statusText[state]
}

/**
 * Show user input in caption area
 */
export function showUserInput(text: string): void {
  elements.you.textContent = text
}

/**
 * Show AI response in caption area with typewriter effect
 */
export function showAIResponse(text: string, durationMs: number, onCue?: (_word: string) => void): void {
  const words = text.split(' ')
  let index = 0
  const stepMs = Math.max(60, durationMs / words.length)

  elements.ai.textContent = ''

  const interval = setInterval(() => {
    const word = words[index]
    if (!word) {
      clearInterval(interval)
      return
    }

    elements.ai.textContent += (index ? ' ' : '') + word

    if (onCue) {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9@.-]/g, '').replace(/\.$/, '')
      onCue(cleanWord)
    }

    index++

    if (index >= words.length) {
      clearInterval(interval)
    }
  }, stepMs)

  return
}

/**
 * Set AI response text directly (no animation)
 */
export function setAIText(text: string): void {
  elements.ai.textContent = text
}

/**
 * Clear AI response
 */
export function clearAIText(): void {
  elements.ai.textContent = ''
}

/**
 * Hide intro screen
 */
export function hideIntro(): void {
  elements.intro.classList.add('gone')
}

/**
 * Toggle captions visibility
 */
export function toggleCaptions(enabled: boolean): void {
  elements.cap.classList.toggle('off', !enabled)
  elements.oc.setAttribute('aria-pressed', String(enabled))
  elements.oc.textContent = enabled ? 'Captions on' : 'Captions off'
}

/**
 * Update voice picker button
 */
export function updateVoiceButton(voiceName: string): void {
  elements.ov.textContent = `Voice: ${voiceName}`
}

/**
 * Update speed button
 */
export function updateSpeedButton(rate: number): void {
  elements.os.textContent = `Speed ${rate}x`
}

/**
 * Toggle hands-free button
 */
export function toggleHandsFree(enabled: boolean): void {
  elements.oh.setAttribute('aria-pressed', String(enabled))
  elements.oh.textContent = enabled ? 'Hands-free on' : 'Hands-free off'
}

/**
 * Add question chips
 */
export function addQuestionChips(questions: string[], onClick: (_question: string) => void): void {
  questions.forEach(question => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = question
    button.onclick = () => onClick(question)
    elements.chips.appendChild(button)
  })
}

/**
 * Get UI elements for direct manipulation
 */
export function getElements() {
  return elements
}
