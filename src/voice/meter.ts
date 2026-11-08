const isChrome = /Chrome|Chromium|Edg/.test(navigator.userAgent)

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let mediaStream: MediaStream | null = null
let dataArray: Float32Array | null = null

/**
 * Initialize microphone meter for Chrome-based browsers
 */
export async function start(): Promise<void> {
  if (!isChrome || audioContext || !navigator.mediaDevices) {
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
  } catch {
    // Failed to get microphone access
    stop()
  }
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
