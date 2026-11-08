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

  if (settings.voiceIndex >= voices.length) {
    settings.voiceIndex = 0
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
 * Speak the given text
 */
export function speak(text: string, onComplete?: () => void): void {
  if (!synth) {
    if (onComplete) onComplete()
    return
  }

  cancel()

  const utterance = new SpeechSynthesisUtterance(text)

  const selectedVoice = voices[settings.voiceIndex] || null
  if (selectedVoice) {
    utterance.voice = selectedVoice
  }

  utterance.rate = settings.rate
  utterance.pitch = 1

  utterance.onstart = () => {
    if (onSpeechStart) onSpeechStart()
  }

  utterance.onboundary = () => {
    if (onBoundary) onBoundary()
  }

  utterance.onend = () => {
    if (onSpeechEnd) onSpeechEnd()
    if (onComplete) onComplete()
  }

  utterance.onerror = () => {
    if (onSpeechEnd) onSpeechEnd()
    if (onComplete) onComplete()
  }

  synth.speak(utterance)
}

/**
 * Cancel current speech
 */
export function cancel(): void {
  if (synth) {
    synth.cancel()
  }
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
 * Cycle to next voice
 */
export function nextVoice(): void {
  if (voices.length === 0) return
  settings.voiceIndex = (settings.voiceIndex + 1) % voices.length
}

/**
 * Set speech rate
 */
export function setRate(rate: number): void {
  settings.rate = rate
}

/**
 * Get current rate
 */
export function getRate(): number {
  return settings.rate
}

/**
 * Toggle captions
 */
export function setCaptions(enabled: boolean): void {
  settings.captionsEnabled = enabled
}

/**
 * Get captions state
 */
export function getCaptionsEnabled(): boolean {
  return settings.captionsEnabled
}

/**
 * Toggle hands-free mode
 */
export function setHandsFree(enabled: boolean): void {
  settings.handsFreeEnabled = enabled
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
