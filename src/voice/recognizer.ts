declare global {
  interface Window {
    SpeechRecognition?: any
    webkitSpeechRecognition?: any
  }
}

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

let recognition: any = null
let currentTranscript = ''
let lastError = ''
let isAborted = false

// Callback hooks
let onStart: (() => void) | null = null
let onInterim: ((_text: string) => void) | null = null
let onFinal: ((_text: string) => void) | null = null
let onError: ((_error: string, _message: string) => void) | null = null
let onEnd: (() => void) | null = null

/**
 * Error code to human-readable message mapping
 * Based on Phase 2 requirements (section 2.1, task 4)
 */
const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone blocked. Please allow microphone access in your browser settings.',
  'service-not-allowed': 'Microphone blocked. Please allow microphone access in your browser settings.',
  'no-speech': "I didn't catch that. Tap the mic and try again.",
  'audio-capture': "I can't find a microphone. Please check your device.",
  'network': 'Voice needs an internet connection.',
  'aborted': '', // Silent - intentional stop
  'not-supported': 'This browser cannot hear you. Try Chrome, Edge, or Safari.',
  'failed-to-start': "I couldn't start the microphone. Please try again."
}

/**
 * Check if speech recognition is available in this browser
 */
export function isAvailable(): boolean {
  return !!SpeechRecognitionAPI
}

/**
 * Get browser compatibility info
 */
export function getBrowserSupport(): {
  supported: boolean
  browserName: string
  recommendation: string
} {
  const ua = navigator.userAgent
  const isChrome = /Chrome|Chromium/.test(ua) && !/Edg/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)
  const isFirefox = /Firefox/.test(ua)

  if (isChrome) {
    return { supported: true, browserName: 'Chrome', recommendation: 'Full voice support' }
  }
  if (isEdge) {
    return { supported: true, browserName: 'Edge', recommendation: 'Full voice support' }
  }
  if (isSafari) {
    return {
      supported: !!SpeechRecognitionAPI,
      browserName: 'Safari',
      recommendation: 'Voice support available (test carefully)'
    }
  }
  if (isFirefox) {
    return {
      supported: false,
      browserName: 'Firefox',
      recommendation: 'Use text input instead'
    }
  }

  return {
    supported: !!SpeechRecognitionAPI,
    browserName: 'Unknown',
    recommendation: !!SpeechRecognitionAPI ? 'Voice may work' : 'Use text input instead'
  }
}

/**
 * Set the recognition language
 */
export function setLanguage(lang: string): void {
  if (recognition && lang) {
    recognition.lang = lang
  }
}

/**
 * Initialize and start speech recognition
 */
export function start(lang = 'en-IN'): void {
  if (!SpeechRecognitionAPI) {
    if (onError) {
      const message = ERROR_MESSAGES['not-supported'] || 'Speech recognition not available'
      onError('not-supported', message)
    }
    return
  }

  stop()
  lastError = ''
  currentTranscript = ''
  isAborted = false

  recognition = new SpeechRecognitionAPI()
  recognition.lang = lang
  recognition.interimResults = true
  recognition.maxAlternatives = 1
  recognition.continuous = false

  recognition.onstart = () => {
    if (onStart) onStart()
  }

  recognition.onresult = (event: any) => {
    let transcript = ''
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i]?.[0]?.transcript || ''
    }

    currentTranscript = transcript

    if (onInterim) {
      onInterim(transcript)
    }
  }

  recognition.onerror = (event: any) => {
    lastError = event.error || ''
  }

  recognition.onend = () => {
    const finalText = currentTranscript.trim()

    // If aborted intentionally, don't trigger error
    if (isAborted) {
      if (onEnd) onEnd()
      recognition = null
      return
    }

    // If we have text, call onFinal
    if (finalText && onFinal) {
      onFinal(finalText)
    } else if (!finalText && onError && lastError) {
      // Map error code to human message
      const message = ERROR_MESSAGES[lastError] || ERROR_MESSAGES['no-speech'] || "I didn't catch that."
      onError(lastError, message)
    }

    if (onEnd) onEnd()
    recognition = null
  }

  try {
    recognition.start()
  } catch (err) {
    if (onError) {
      const message = ERROR_MESSAGES['failed-to-start'] || "Couldn't start the microphone."
      onError('failed-to-start', message)
    }
    recognition = null
  }
}

/**
 * Stop speech recognition (clean abort)
 */
export function stop(): void {
  if (recognition) {
    isAborted = true
    try {
      recognition.abort()
    } catch {
      // Ignore errors on abort
    }
    recognition = null
  }
}

/**
 * Check if currently listening
 */
export function isListening(): boolean {
  return !!recognition
}

/**
 * Set event callbacks
 */
export function setCallbacks(callbacks: {
  onStart?: () => void
  onInterim?: (_text: string) => void
  onFinal?: (_text: string) => void
  onError?: (_error: string, _message: string) => void
  onEnd?: () => void
}): void {
  if (callbacks.onStart) onStart = callbacks.onStart
  if (callbacks.onInterim) onInterim = callbacks.onInterim
  if (callbacks.onFinal) onFinal = callbacks.onFinal
  if (callbacks.onError) onError = callbacks.onError
  if (callbacks.onEnd) onEnd = callbacks.onEnd
}
