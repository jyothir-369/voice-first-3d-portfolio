/**
 * Browser compatibility detection
 * Phase 2: task 6 - meter must not conflict with speech recognition
 */
function getBrowserSupport(): { canUseMeter: boolean; browserName: string } {
  const ua = navigator.userAgent
  const isChrome = /Chrome|Chromium/.test(ua) && !/Edg/.test(ua)
  const isEdge = /Edg/.test(ua)
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)

  // Only enable meter on Chrome/Edge where it's confirmed not to conflict
  return {
    canUseMeter: isChrome || isEdge,
    browserName: isChrome ? 'Chrome' : isEdge ? 'Edge' : isSafari ? 'Safari' : 'Other'
  }
}

const browserSupport = getBrowserSupport()

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let mediaStream: MediaStream | null = null
let dataArray: Float32Array | null = null
let lastError: string | null = null

/**
 * Initialize microphone meter for Chrome/Edge browsers only
 * Phase 2: task 6 - disable on browsers where it conflicts with recognition
 */
export async function start(): Promise<void> {
  // Skip if browser doesn't support meter or if already initialized
  if (!browserSupport.canUseMeter || audioContext || !navigator.mediaDevices) {
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStream = stream

    audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 512

    source.connect(analyser)
    dataArray = new Float32Array(analyser.fftSize)
    lastError = null
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Failed to start meter'
    stop()
  }
}

/**
 * Check if meter can be used in this browser
 */
export function isSupported(): boolean {
  return browserSupport.canUseMeter
}

/**
 * Get last error if any
 */
export function getLastError(): string | null {
  return lastError
}

/**
 * Stop microphone meter and release resources
 */
export function stop(): void {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }

  if (audioContext) {
    try {
      audioContext.close()
    } catch {
      // Ignore close errors
    }
    audioContext = null
  }

  analyser = null
  dataArray = null
}

/**
 * Get current microphone amplitude (0-1 range)
 */
export function getAmplitude(): number {
  if (!analyser || !dataArray || dataArray.length === 0) {
    return 0
  }

  analyser.getFloatTimeDomainData(dataArray)

  let sum = 0
  for (let i = 0; i < dataArray.length; i++) {
    const value = dataArray[i]
    if (value !== undefined) {
      sum += value * value
    }
  }

  const rms = Math.sqrt(sum / dataArray.length)
  return Math.min(1, rms * 8)
}

/**
 * Check if meter is active
 */
export function isActive(): boolean {
  return !!analyser
}
