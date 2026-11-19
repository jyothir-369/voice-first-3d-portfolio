import './styles/main.css'
import type { AppState } from './types'
import * as UI from './ui/controls'
import * as Recognizer from './voice/recognizer'
import * as Speaker from './voice/speaker'
import * as Meter from './voice/meter'
import * as Terrain from './scene/terrain'
import * as Stage from './stage/stage'
import { findCue } from './stage/cues'
import { respond } from './engine/conversation'
import { askWithFallback } from './ai/client'
import { initTyped, setTypedVisible } from './ui/typed'
import { initContact, setContactVisible } from './ui/contact'
import { initPrivacyNotice } from './ui/privacy'
import { A11Y } from './ui/a11y'
import type { TypedEls } from './ui/typed'
import type { ContactEls } from './ui/contact'
import faqData from '../content/faq.json'

let currentState: AppState = 'intro'
let bumpEnergy = 0
let smoothedAmplitude = 0
let handsFreeMode = false
const cuesShown = new Set<string>()
let objectsThisTurn = 0

// Populated in init(): the typed-input row and the contact panel.
let typedEls: TypedEls | null = null
let contactEls: ContactEls | null = null

/**
 * Set application state
 */
function setState(state: AppState): void {
  currentState = state
  UI.setState(state)
}

/**
 * Handle word cue triggers during text reveal
 */
function handleCue(word: string): void {
  if (objectsThisTurn >= 4) return

  const cue = findCue(word)
  if (cue && !cuesShown.has(cue.objectType)) {
    cuesShown.add(cue.objectType)
    objectsThisTurn++
    Stage.spawnObject(cue.objectType, cue.label)
  }
}

/**
 * Start listening for voice input
 */
function startListening(): void {
  if (!Recognizer.isAvailable()) {
    UI.showUserInput('This browser cannot hear you.')
    UI.setAIText('Tap one of the questions below instead. I will still answer out loud.')
    return
  }

  stopSpeaking()
  Recognizer.start()
}

/**
 * Stop speaking
 */
function stopSpeaking(): void {
  Speaker.cancel()
  if (currentState === 'speaking') {
    setState('idle')
  }
}

/**
 * Process user input and generate response
 */
async function processInput(text: string): Promise<void> {
  stopSpeaking()

  const trimmed = text.trim()
  if (!trimmed) return

  UI.showUserInput(`You: "${trimmed}"`)

  // Check for stop command
  if (/\b(stop|quiet|enough|cancel)\b/.test(trimmed.toLowerCase())) {
    stopSpeaking()
    Stage.clearStage()
    setState('idle')
    UI.setAIText('Okay, stopping.')
    return
  }

  setState('thinking')

  // Phase 6 fallback chain: AI answer, else local rules answer, else the
  // friendly "not sure" reply. askWithFallback never throws.
  const ai = await askWithFallback(trimmed, { history: [] })
  const response = ai.source === 'ai'
    ? { s: ai.say, c: ai.caption }
    : respond(trimmed)
  cuesShown.clear()
  objectsThisTurn = 0

  // Contact moment: after the "how do I hire you" answer, offer a tappable
  // email route. Voice alone is never the only way to reach the owner.
  const askedAboutHiring = /\b(hire|contact|email|reach|work together|collaborate|get in touch)\b/i.test(trimmed)
  setContactVisible(contactEls, askedAboutHiring)

  const spokenDuration = response.s.length / (14 * Speaker.getRate()) * 1000

  setTimeout(() => {
    UI.showAIResponse(response.c, spokenDuration, handleCue)

    if (Speaker.isAvailable()) {
      Speaker.speak(response.s, () => {
        UI.setAIText(response.c)
        if (handsFreeMode && currentState === 'idle') {
          startListening()
        }
      })
    } else {
      setState('idle')
    }
  }, 450)
}

/**
 * Calculate amplitude envelope
 */
function calculateAmplitude(time: number): number {
  bumpEnergy *= 0.93

  let amplitude: number

  if (currentState === 'listening') {
    if (Meter.isActive()) {
      amplitude = Meter.getAmplitude()
    } else {
      amplitude = 0.12 + 0.1 * Math.abs(Math.sin(time * 3))
    }
    amplitude = Math.max(amplitude, bumpEnergy * 0.75)
  } else if (currentState === 'speaking') {
    amplitude = 0.22 + 0.24 * Math.abs(Math.sin(time * 7.3)) * Math.abs(Math.sin(time * 2.1 + 1)) + bumpEnergy * 0.5
  } else if (currentState === 'thinking') {
    amplitude = 0.12 + 0.07 * Math.sin(time * 9)
  } else {
    amplitude = 0.05 + 0.03 * Math.sin(time * 1.2)
  }

  smoothedAmplitude += (amplitude - smoothedAmplitude) * 0.35
  return Math.min(1, smoothedAmplitude)
}

/**
 * Frame sample for the terrain loop.
 * The loop itself stops calling this while the tab is hidden.
 */
function sampleFrame(): { amplitude: number; state: AppState } {
  if (document.hidden) {
    return { amplitude: smoothedAmplitude, state: currentState }
  }
  const time = performance.now() / 1000
  const amplitude = calculateAmplitude(time)
  Stage.updateStage(time, amplitude)
  return { amplitude, state: currentState }
}

/**
 * Initialize the application
 */
function init(): void {
  const canvas = document.getElementById('gl') as HTMLCanvasElement

  try {
    // Initialize 3D scene
    Terrain.initTerrain(canvas)
    Stage.initStage(Terrain.getScene())

    // Initialize voice
    Speaker.initSpeaker()
    Speaker.setCallbacks({
      onStart: () => setState('speaking'),
      onEnd: () => {
        if (currentState === 'speaking') setState('idle')
      },
      onBoundary: () => {
        bumpEnergy = 1
      }
    })

    // Initialize speech recognition
    Recognizer.setCallbacks({
      onStart: () => {
        setState('listening')
        UI.showUserInput('Listening…')
        Meter.start()
      },
      onInterim: (text: string) => {
        UI.showUserInput(`You: "${text}"`)
        bumpEnergy = 1
      },
      onFinal: (text: string) => {
        Meter.stop()
        processInput(text)
      },
      onError: (_error: string, message: string) => {
        Meter.stop()
        setState('idle')
        UI.showUserInput(message)

        if (message === 'Microphone blocked.') {
          UI.setAIText('Allow the mic in your browser, or open this page in its own tab. You can also tap a question below.')
        } else if (message === 'No connection to the speech service.') {
          UI.setAIText('Tap a question below instead.')
        } else {
          UI.setAIText('Tap the mic and try again.')
        }
      },
      onEnd: () => {
        Meter.stop()
      }
    })

    // Set up UI controls
    const elements = UI.getElements()

    // Typed input and contact moment (Phase 7).
    typedEls = initTyped(question => processInput(question))
    contactEls = initContact()

    // Phase 8 privacy + accessibility
    initPrivacyNotice()
    A11Y.initKeyboardShortcuts()
    A11Y.initScreenReaderRegions()
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    A11Y.initReducedMotion(prefersReduced)

    elements.begin.onclick = () => {
      UI.hideIntro()
      if (Speaker.isAvailable()) {
        Speaker.loadVoices()
      }
      setState('idle')
      UI.clearAIText()
      processInput('hello')
    }

    elements.mic.onclick = () => {
      if (currentState === 'listening') {
        Recognizer.stop()
      } else {
        startListening()
      }
    }

    elements.oc.onclick = () => {
      const enabled = !Speaker.getCaptionsEnabled()
      Speaker.setCaptions(enabled)
      UI.toggleCaptions(enabled)
    }

    elements.ov.onclick = () => {
      if (!Speaker.isAvailable()) return
      Speaker.nextVoice()
      UI.updateVoiceButton(Speaker.getCurrentVoiceName())
      Speaker.speak('Hi, this is my new voice.', () => {})
    }

    elements.os.onclick = () => {
      const currentRate = Speaker.getRate()
      const newRate = currentRate === 1 ? 1.15 : currentRate === 1.15 ? 0.9 : 1
      Speaker.setRate(newRate)
      UI.updateSpeedButton(newRate)
    }

    elements.oh.onclick = () => {
      handsFreeMode = !handsFreeMode
      Speaker.setHandsFree(handsFreeMode)
      UI.toggleHandsFree(handsFreeMode)
    }

    // "Skip voice, use text": a visible route for visitors who prefer not to
    // talk. Dismissing the intro reveals the typed field, which sends through
    // the same answer path as chips. Voice stays opt-in from here on.
    elements.skipVoice.onclick = () => {
      if (!typedEls) return
      UI.hideIntro()
      setState('idle')
      UI.clearAIText()
      setTypedVisible(typedEls, true)
      elements.skipVoice.setAttribute('aria-pressed', 'true')
    }

    // Theme toggle: light / dark / follow-system, persisted per visitor.
    try {
      const saved = window.localStorage.getItem('vp-theme') as 'light' | 'dark' | null
      if (saved === 'light' || saved === 'dark') {
        UI.applyTheme(saved)
      }
    } catch {
      /* private mode: theme follows the system */
    }
    elements.ot.onclick = () => {
      const next = UI.currentTheme() === 'light' ? 'dark' : 'light'
      UI.applyTheme(next)
      try {
        window.localStorage.setItem('vp-theme', next)
      } catch {
        /* private mode: theme applies for this visit only */
      }
    }

    // About panel: <details> toggle is native; keep aria-expanded in sync
    // for screen readers that announce it.
    elements.about.addEventListener('click', () => {
      const panel = document.getElementById('about')
      if (panel) {
        elements.about.setAttribute('aria-expanded', String(panel.hasAttribute('open')))
      }
    })

    // Question chips come straight from the verified FAQ questions in
    // content/faq.json so the UI can never drift from the answer corpus.
    const questions = (faqData as { coreQuestions?: { question?: string }[] }).coreQuestions ?? []
    const chipLabels = questions
      .map(q => q.question)
      .filter((text): text is string => typeof text === 'string' && text.length > 0)

    UI.addQuestionChips(chipLabels, (question: string) => {
      stopSpeaking()
      processInput(question)
    })

    // Hide voice controls if not available
    if (!Speaker.isAvailable()) {
      elements.ov.hidden = true
      elements.os.hidden = true
    }

    const stopLoop = Terrain.startTerrainLoop(sampleFrame)

    // Cleanup on page hide
    window.addEventListener('pagehide', () => {
      stopSpeaking()
      Meter.stop()
      stopLoop()
      Terrain.disposeTerrain()
    })

  } catch (error) {
    console.error('Failed to initialize 3D scene:', error)
    canvas.style.display = 'none'
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
