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

// Callback hooks
let onStart: (() => void) | null = null
let onInterim: ((_text: string) => void) | null = null
let onFinal: ((_text: string) => void) | null = null
let onError: ((_error: string, _message: string) => void) | null = null
let onEnd: (() => void) | null = null

/**
 * Check if speech recognition is available
 */
export function isAvailable(): boolean {
  return !!SpeechRecognitionAPI
}

/**
 * Initialize and start speech recognition
 */
export function start(): void {
  if (!SpeechRecognitionAPI) {
    if (onError) {
      onError('not-supported', 'This browser cannot hear you.')
    }
    return
  }

  stop()
  lastError = ''
  currentTranscript = ''

  recognition = new SpeechRecognitionAPI()
  recognition.lang = navigator.language || 'en-IN'
  recognition.interimResults = true
  recognition.maxAlternatives = 1

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

    if (finalText && onFinal) {
      onFinal(finalText)
    } else if (!finalText && onError) {
      // Handle different error cases
      if (lastError === 'not-allowed' || lastError === 'service-not-allowed') {
        onError(lastError, 'Microphone blocked.')
      } else if (lastError === 'network') {
        onError(lastError, 'No connection to the speech service.')
      } else {
        onError(lastError, "I didn't catch that.")
      }
    }

    if (onEnd) onEnd()
    recognition = null
  }

  try {
    recognition.start()
  } catch {
    if (onError) {
      onError('failed-to-start', "I couldn't start the microphone.")
    }
  }
}

/**
 * Stop speech recognition
 */
export function stop(): void {
  if (recognition) {
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
