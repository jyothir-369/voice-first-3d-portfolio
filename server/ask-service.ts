// /api/ask — Phase 6 AI backend.
// Request flow (plan 6.1): validate -> rate limit -> retrieve facts ->
// call the LLM with strict system prompt -> parse structured JSON ->
// drop unknown object tags -> return say/caption/show/followUp.
import OpenAI from 'openai'
import { GROQ_BASE_URL } from './prompt.js'

export type OpenAIClient = OpenAI
import { CostDashboard } from './cost.js'
import {
  ALLOWED_OBJECT_KEYS,
  buildSystemPrompt,
  loadFactSources,
  isRefusalTopic,
  MAX_INPUT_CHARS,
  MAX_TOKENS,
  HISTORY_TURNS,
  MODEL_DEFAULT,
  MODEL_COMPLEX,
  COMPLEX_QUESTION_CHARS,
  type FactSource
} from './prompt.js'

export interface AskReply {
  say: string
  caption: string
  show: string[]
  followUp: string
  model: string
}

export interface AskRequest {
  question: string
  history?: { role: 'user' | 'assistant'; content: string }[]
  sessionId?: string
}

export interface AskDeps {
  client?: OpenAI
  now?: () => number
}

export class AskError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// ──────────────────────────────────────────────
// Validation and input rules (plan 6.1 step 2, 6.6)
// ──────────────────────────────────────────────

const OFFENSIVE_PATTERN = /\b(fuck|shit|cunt|bitch|bastard|nigger|fag(?:got)?|damn|stupid|idiot|dumb)\b/i

export function validateQuestion(raw: unknown): string {
  if (typeof raw !== 'string') throw new AskError(400, 'question must be a string')
  const q = raw.trim()
  if (!q) throw new AskError(400, 'question is required')
  if (q.length > MAX_INPUT_CHARS) throw new AskError(400, `question exceeds ${MAX_INPUT_CHARS} characters`)
  if (OFFENSIVE_PATTERN.test(q)) throw new AskError(400, 'offensive input is not accepted')
  return q
}

export function sanitizeHistory(raw: unknown): { role: 'user' | 'assistant'; content: string }[] {
  if (!Array.isArray(raw)) return []
  const out: { role: 'user' | 'assistant'; content: string }[] = []
  for (const item of raw.slice(-HISTORY_TURNS)) {
    if (!item || typeof item !== 'object') continue
    const role = (item as { role?: unknown }).role
    const content = (item as { content?: unknown }).content
    if ((role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim()) {
      out.push({ role, content: content.trim().slice(0, MAX_INPUT_CHARS) })
    }
  }
  return out
}

export function pickModel(question: string, history: { role: string; content: string }[]): string {
  const longQuestion = question.length > COMPLEX_QUESTION_CHARS
  const multiPart = history.length >= 4 || /\s+(and|or|also|versus|vs\.?|compared|difference)\s/i.test(question)
  return longQuestion || multiPart ? MODEL_COMPLEX : MODEL_DEFAULT
}

export function normalizeSessionId(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim().slice(0, 64)
  return 'anonymous'
}

// ──────────────────────────────────────────────
// Rate limiting: per-IP, per-session, and per-instance daily request cap.
// In-memory: correct for a single serverless instance; document as such.
// ──────────────────────────────────────────────

export const RATE_WINDOW_MS = 60_000
export const RATE_PER_WINDOW = 10
export const DAILY_CAP = 500

interface LimiterRow { windowStart: number; count: number }
interface DailyRow { date: string; count: number }

export class RateLimiter {
  private windows = new Map<string, LimiterRow>()
  private daily = new Map<string, DailyRow>()
  private now: () => number

  constructor(now?: () => number) {
    this.now = now ?? (() => Date.now())
  }

  /** Returns true when the request is allowed. */
  allow(key: string): boolean {
    const t = this.now()
    const row = this.windows.get(key)
    if (!row || t - row.windowStart >= RATE_WINDOW_MS) {
      this.windows.set(key, { windowStart: t, count: 1 })
    } else if (row.count >= RATE_PER_WINDOW) {
      return false
    } else {
      row.count += 1
    }
    return true
  }

  /** Daily request cap per function instance; this is not a monetary spend cap. */
  allowDay(key: string): boolean {
    const date = new Date(this.now()).toISOString().slice(0, 10)
    const row = this.daily.get(key)
    if (!row || row.date !== date) {
      this.daily.set(key, { date, count: 1 })
      return true
    }
    if (row.count >= DAILY_CAP) return false
    row.count += 1
    return true
  }

  reset(): void {
    this.windows.clear()
    this.daily.clear()
  }
}

// ──────────────────────────────────────────────
// Retrieval (plan 6.1 step 3): small corpus -> keyword scoring over
// the verified FAQ facts. No embeddings needed at this corpus size.
// ──────────────────────────────────────────────

// Function words that appear in every question and must not score a match.
const RETRIEVAL_STOP_WORDS = new Set([
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'the', 'and', 'are', 'you', 'your', 'can', 'could', 'should', 'would',
  'did', 'does', 'have', 'has', 'was', 'were', 'tell', 'about', 'please',
  'with', 'for', 'from', 'that', 'this', 'any', 'all', 'not', 'but', 'out'
])

export function retrieveFacts(question: string, facts: FactSource[], limit = 5): FactSource[] {
  const qTokens = new Set(
    question
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !RETRIEVAL_STOP_WORDS.has(w))
  )
  const scored = facts.map((f) => {
    const text = `${f.question} ${f.spoken}`.toLowerCase()
    let score = 0
    for (const tok of qTokens) if (text.includes(tok)) score += 1
    return { f, score }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.f)
}

// ──────────────────────────────────────────────
// Structured reply parser (plan 6.3) + object-tag validator
// ──────────────────────────────────────────────

export interface ParsedReply {
  say: string
  caption: string
  show: string[]
  followUp: string
}

/** Extract the JSON payload the model produced, tolerating markdown fences. */
export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced && fenced[1]) return fenced[1].trim()
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start >= 0 && end > start) return raw.slice(start, end + 1)
  return raw.trim()
}

/** Parse and validate the model reply. Unknown object tags are dropped. */
export function parseReply(rawText: string, fallbackSay: string): ParsedReply {
  let parsed: unknown
  try {
    parsed = JSON.parse(extractJson(rawText))
  } catch {
    return { say: fallbackSay, caption: fallbackSay, show: [], followUp: '' }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { say: fallbackSay, caption: fallbackSay, show: [], followUp: '' }
  }
  const obj = parsed as Record<string, unknown>
  const say = typeof obj.say === 'string' && obj.say.trim() ? obj.say.trim() : fallbackSay
  const caption = typeof obj.caption === 'string' && obj.caption.trim() ? obj.caption.trim() : say
  const rawShow = Array.isArray(obj.show) ? obj.show : []
  const show = rawShow.filter(
    (k): k is string => typeof k === 'string' && ALLOWED_OBJECT_KEYS.includes(k)
  )
  const followUp = typeof obj.followUp === 'string' ? obj.followUp.trim() : ''
  return { say, caption, show, followUp }
}

/** Cap `show` to at most 3 distinct catalogue tags. */
export function capShowTags(show: string[]): string[] {
  return [...new Set(show)].slice(0, 3)
}

// ──────────────────────────────────────────────
// Orchestration
// ──────────────────────────────────────────────

export const FALLBACK_SAY =
  "I'm not sure about that. Everything I can tell you is on this page — try asking about my projects, experience, results, or how to reach me."

export interface AskResult {
  reply: AskReply
  usedFallback: boolean
  latencyMs: number
}

export interface AskOptions extends AskDeps {
  limiter?: RateLimiter
  ip?: string
  facts?: FactSource[]
  cost?: CostDashboard
}

export async function askQuestion(
  request: AskRequest,
  opts: AskOptions = {}
): Promise<AskResult> {
  const now = opts.now ?? (() => Date.now())
  const limiter = opts.limiter ?? new RateLimiter(now)

  // Validate input BEFORE constructing any client or consuming rate budget.
  const question = validateQuestion(request.question)
  const sessionId = normalizeSessionId(request.sessionId)
  const history = sanitizeHistory(request.history)

  if (isRefusalTopic(question)) {
    return {
      reply: {
        say: FALLBACK_SAY,
        caption: FALLBACK_SAY,
        show: [],
        followUp: '',
        model: 'none'
      },
      usedFallback: true,
      latencyMs: 0
    }
  }

  const ipKey = opts.ip?.trim() || 'ip-unknown'
  const sessionKey = `${sessionId}:${ipKey}`

  // Separate buckets prevent visitors from bypassing the IP limit by
  // changing their client-provided session ID.
  if (
    !limiter.allow(`ip:${ipKey}`) ||
    !limiter.allow(`session:${sessionKey}`) ||
    !limiter.allowDay('daily')
  ) {
    throw new AskError(429, 'Too many requests. Please slow down.')
  }

  const client = opts.client ?? new OpenAI({ apiKey: process.env.GROQ_API_KEY || 'test-key', baseURL: GROQ_BASE_URL })
  const facts = opts.facts ?? loadFactSources()
  const retrieved = retrieveFacts(question, facts)
  const factBlock = retrieved
    .map((f) => `[${f.id}] Q: ${f.question} A: ${f.spoken}`)
    .join('\n')
  const system = buildSystemPrompt(facts)
  const model = pickModel(question, history)

  const started = now()
  let rawText: string
  try {
    const response = await client.responses.create({
      model,
      instructions: system,
      input: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        {
          role: 'user',
          content: `FACTS FOR THIS QUESTION:\n${factBlock || '(none retrieved — answer only from the FACTS in the system prompt)'}\n\nQUESTION: ${question}`
        }
      ],
      max_output_tokens: MAX_TOKENS
    })
    const textParts = response.output
      .filter((item) => item.type === 'message')
      .flatMap((item) => (item as { content?: unknown }).content ?? [])
      .filter((c) => (c as { type?: string }).type === 'output_text') as { type: string; text: string }[]
    rawText = textParts.map((p) => p.text).join('')
    if (opts.cost) {
      const u = response.usage
      opts.cost.record(model, u?.input_tokens ?? 0, u?.output_tokens ?? 0)
    }
  } catch (err) {
    const status = (err as { status?: number }).status
    if (status && status >= 500) {
      throw new AskError(502, `Groq API error: ${(err as Error).message}`)
    }
    throw new AskError(502, `Groq API unreachable: ${err instanceof Error ? err.message : 'unknown error'}`)
  }

  const parsed = parseReply(rawText, FALLBACK_SAY)
  return {
    reply: {
      say: parsed.say,
      caption: parsed.caption,
      show: capShowTags(parsed.show),
      followUp: parsed.followUp,
      model
    },
    usedFallback: parsed.say === FALLBACK_SAY,
    latencyMs: now() - started
  }
}
