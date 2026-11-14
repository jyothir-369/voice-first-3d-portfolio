import type { VoiceSettings } from '@/types'

const synth = window.speechSynthesis
let voices: SpeechSynthesisVoice[] = []
const settings: VoiceSettings = {
  voiceIndex: 0,
  rate: 1,
  captionsEnabled: true,
  handsFreeEnabled: false
}

// Callback hooks
let onSpeechStart: (() => void) | null = null
let onSpeechEnd: (() => void) | null = null
let onBoundary: (() => void) | null = null

// Speech queue for chunked utterances
let utteranceQueue: SpeechSynthesisUtterance[] = []
let isCurrentlySpeaking = false
let currentCompletionCallback: (() => void) | null = null

const MAX_CHUNK_LENGTH = 200 // Characters per chunk (Phase 2 requirement)

/**
 * Split text into chunks at sentence boundaries (Phase 2 requirement: task 3)
 * Prevents browser cutoff on long utterances
 */
function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) {
    return [text]
  }

  const chunks: string[] = []
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

  let currentChunk = ''
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= MAX_CHUNK_LENGTH) {
      currentChunk += sentence
    } else {
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = sentence
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim())
  return chunks.length > 0 ? chunks : [text]
}

/**
 * Load available voices and prioritize English variants
 */
export function loadVoices(): void {
  if (!synth) return

  const allVoices = synth.getVoices() || []
  voices = allVoices.filter(v => /^en/i.test(v.lang))

  // Sort: en-IN first, then en-GB, then others
  voices.sort((a, b) => {
    const rank = (v: SpeechSynthesisVoice): number => {
      if (/en[-_]IN/i.test(v.lang)) return 0
      if (/en[-_]GB/i.test(v.lang)) return 1
      return 2
    }
    return rank(a) - rank(b)
  })

  // Try to restore saved voice from localStorage (Phase 2: task 2)
  try {
    const saved = localStorage.getItem('voice-settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (typeof parsed.voiceIndex === 'number' && parsed.voiceIndex < voices.length) {
        settings.voiceIndex = parsed.voiceIndex
      }
      if (typeof parsed.rate === 'number') {
        settings.rate = parsed.rate
      }
      if (typeof parsed.captionsEnabled === 'boolean') {
        settings.captionsEnabled = parsed.captionsEnabled
      }
      if (typeof parsed.handsFreeEnabled === 'boolean') {
        settings.handsFreeEnabled = parsed.handsFreeEnabled
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  if (settings.voiceIndex >= voices.length) {
    settings.voiceIndex = 0
  }
}

/**
 * Save settings to localStorage (Phase 2: task 2)
 */
function saveSettings(): void {
  try {
    localStorage.setItem('voice-settings', JSON.stringify(settings))
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Initialize speaker and load voices
 */
export function initSpeaker(): void {
  if (!synth) return
  loadVoices()
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices
  }
}

/**
 * Process the next utterance in the queue
 */
function processQueue(): void {
  if (!synth || utteranceQueue.length === 0 || isCurrentlySpeaking) {
    return
  }

  const utterance = utteranceQueue.shift()
  if (!utterance) return

  isCurrentlySpeaking = true

  utterance.onend = () => {
    isCurrentlySpeaking = false

    // If queue is empty, we're done
    if (utteranceQueue.length === 0) {
      if (onSpeechEnd) onSpeechEnd()
      if (currentCompletionCallback) {
        currentCompletionCallback()
        currentCompletionCallback = null
      }
    } else {
      // Process next chunk
      processQueue()
    }
  }

  utterance.onerror = () => {
    isCurrentlySpeaking = false
    utteranceQueue = [] // Clear queue on error
    if (onSpeechEnd) onSpeechEnd()
    if (currentCompletionCallback) {
      currentCompletionCallback()
      currentCompletionCallback = null
    }
  }

  synth.speak(utterance)
}

/**
 * Speak the given text with automatic chunking for long answers
 * (Phase 2: task 3 - prevent browser cutoff)
 */
export function speak(text: string, onComplete?: () => void): void {
  if (!synth) {
    if (onComplete) onComplete()
    return
  }

  cancel()

  const chunks = chunkText(text)
  currentCompletionCallback = onComplete || null

  // Create utterances for each chunk
  chunks.forEach((chunk, index) => {
    const utterance = new SpeechSynthesisUtterance(chunk)

    const selectedVoice = voices[settings.voiceIndex] || null
    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.rate = settings.rate
    utterance.pitch = 1

    // Only fire onStart for the first chunk
    if (index === 0) {
      utterance.onstart = () => {
        if (onSpeechStart) onSpeechStart()
      }
    }

    utterance.onboundary = () => {
      if (onBoundary) onBoundary()
    }

    utteranceQueue.push(utterance)
  })

  processQueue()
}

/**
 * Cancel current speech and clear queue
 * (Phase 2: task 5 - interruption rules)
 */
export function cancel(): void {
  if (synth) {
    synth.cancel()
  }
  utteranceQueue = []
  isCurrentlySpeaking = false
  currentCompletionCallback = null
}

/**
 * Audio unlock for iOS/Safari (Phase 2: task 4)
 * Call this inside a user gesture (tap/click) to unlock audio
 */
export function unlockAudio(): Promise<void> {
  return new Promise((resolve) => {
    if (!synth) {
      resolve()
      return
    }

    // Speak a very short utterance to unlock audio
    const utterance = new SpeechSynthesisUtterance(' ')
    utterance.volume = 0.01
    utterance.rate = 10

    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()

    synth.speak(utterance)

    // Timeout fallback
    setTimeout(resolve, 100)
  })
}

/**
 * Check if synthesis is available
 */
export function isAvailable(): boolean {
  return !!synth
}

/**
 * Get current voice name
 */
export function getCurrentVoiceName(): string {
  const voice = voices[settings.voiceIndex]
  if (!voice) return 'Voice'
  const name = voice.name
  return name.replace(/Microsoft |Google /, '').split(' ')[0] || 'Voice'
}

/**
 * Cycle to next voice and persist choice
 */
export function nextVoice(): void {
  if (voices.length === 0) return
  settings.voiceIndex = (settings.voiceIndex + 1) % voices.length
  saveSettings()
}

/**
 * Set speech rate and persist choice
 */
export function setRate(rate: number): void {
  settings.rate = rate
  saveSettings()
}

/**
 * Get current rate
 */
export function getRate(): number {
  return settings.rate
}

/**
 * Toggle captions and persist choice
 */
export function setCaptions(enabled: boolean): void {
  settings.captionsEnabled = enabled
  saveSettings()
}

/**
 * Get captions state
 */
export function getCaptionsEnabled(): boolean {
  return settings.captionsEnabled
}

/**
 * Toggle hands-free mode and persist choice
 */
export function setHandsFree(enabled: boolean): void {
  settings.handsFreeEnabled = enabled
  saveSettings()
}

/**
 * Get hands-free state
 */
export function getHandsFreeEnabled(): boolean {
  return settings.handsFreeEnabled
}

/**
 * Set event callbacks
 */
export function setCallbacks(callbacks: {
  onStart?: () => void
  onEnd?: () => void
  onBoundary?: () => void
}): void {
  if (callbacks.onStart) onSpeechStart = callbacks.onStart
  if (callbacks.onEnd) onSpeechEnd = callbacks.onEnd
  if (callbacks.onBoundary) onBoundary = callbacks.onBoundary
}
