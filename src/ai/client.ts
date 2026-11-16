// Client AI module (Phase 6, task 3): streaming ask + fallback chain.
//
// Chain (plan 6.7 task 5): AI answer -> local rules answer -> friendly
// "I'm not sure" with chips. The browser never sees the API key: it only
// talks to /api/ask.
import { respond } from '@/engine/conversation'

export interface AskMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiReply {
  say: string
  caption: string
  show: string[]
  followUp: string
  source: 'ai' | 'rules' | 'fallback'
}

export interface AskOptions {
  endpoint?: string
  timeoutMs?: number
  history?: AskMessage[]
  sessionId?: string
}

export class AiClientError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Split a streamed answer into sentences as they arrive. */
export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g) ?? []
  return parts.map((s) => s.trim()).filter(Boolean)
}

/**
 * Ask the AI backend. Throws AiClientError for transport/HTTP failures;
 * the caller decides whether to fall back to the rules engine.
 */
export async function ask(question: string, opts: AskOptions = {}): Promise<AiReply> {
  const endpoint = opts.endpoint ?? '/api/ask'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000)
  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        question,
        history: opts.history ?? [],
        sessionId: opts.sessionId ?? 'anonymous'
      }),
      signal: controller.signal
    })
  } catch (err) {
    clearTimeout(timer)
    throw new AiClientError(0, err instanceof Error ? err.message : 'network error')
  }
  clearTimeout(timer)
  if (!res.ok) {
    throw new AiClientError(res.status, `ask failed with ${res.status}`)
  }
  const body = (await res.json()) as {
    say?: unknown
    caption?: unknown
    show?: unknown
    followUp?: unknown
  }
  const say = typeof body.say === 'string' ? body.say : ''
  const caption = typeof body.caption === 'string' ? body.caption : say
  const show = Array.isArray(body.show)
    ? (body.show.filter((t): t is string => typeof t === 'string') as string[])
    : []
  const followUp = typeof body.followUp === 'string' ? body.followUp : ''
  return { say, caption, show, followUp, source: 'ai' }
}

/**
 * Fallback chain (plan 6.7 task 5):
 *   1. AI answer from /api/ask
 *   2. local rules engine (Phase 5)
 *   3. friendly "I'm not sure" with suggestion chips
 */
export async function askWithFallback(
  question: string,
  opts: AskOptions = {}
): Promise<AiReply> {
  try {
    return await ask(question, opts)
  } catch {
    const rules = respond(question)
    if (rules.s && !/didn't catch/i.test(rules.s)) {
      return {
        say: rules.s,
        caption: rules.c,
        show: [],
        followUp: '',
        source: 'rules'
      }
    }
    return {
      say: "I'm not sure about that. Try asking about my projects, experience, results, or how to reach me.",
      caption: "I'm not sure about that. Try asking about my projects, experience, results, or how to reach me.",
      show: [],
      followUp: '',
      source: 'fallback'
    }
  }
}

/**
 * Speak a reply sentence by sentence (plan 6.1 step 6: start speaking after
 * the first sentence, do not wait for the full answer). The endpoint returns
 * one JSON document, so the client splits it and feeds sentences to the
 * Speaker queue immediately — the first sentence starts while the rest are
 * still being queued.
 */
export function speakStreaming(
  text: string,
  speak: (chunk: string, onComplete?: () => void) => void,
  onAllDone?: () => void
): void {
  const sentences = splitSentences(text)
  if (sentences.length === 0) {
    onAllDone?.()
    return
  }
  let index = 0
  const next = (): void => {
    const sentence = sentences[index]
    index += 1
    if (!sentence) {
      onAllDone?.()
      return
    }
    speak(sentence, () => next())
  }
  next()
}
