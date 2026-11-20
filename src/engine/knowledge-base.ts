import faqData from '../../content/faq.json'
import correctionsRaw from './corrections.json'
import type { FaqEntry } from '@/types'

const CORRECTIONS: Record<string, string> = correctionsRaw as Record<string, string>

// Generic stop-words that appear in many entries and should not score heavily
const STOP_WORDS = new Set([
  'what', 'how', 'are', 'do', 'did', 'is', 'was', 'the', 'your', 'you', 'my', 'me', 'tell', 'about', 'can', 'have', 'for', 'on', 'in', 'at',
  'my', 'me', 'tell', 'about', 'can', 'have', 'me', 'for', 'on', 'in', 'at',
  'an', 'a', 'and', 'not', 'any', 'been', 'has', 'it', 'its', 'more', 'show',
  'work', 'kind', 'type', 'sort', 'use', 'uses', 'using', 'something', 'someone', 'anyone'
])

// Explicit synonym expansions keyed by canonical form
const SYNONYM_MAP: Record<string, string> = {
  built: 'build',
  create: 'build',
  created: 'build',
  develop: 'build',
  developed: 'build',
  ship: 'build',
  shipped: 'build',
  hire: 'hire',
  contact: 'hire',
  reach: 'hire',
  email: 'hire',
  collaborated: 'experience',
  worked: 'experience',
  intern: 'experience',
  job: 'experience',
  career: 'experience',
  role: 'experience',
  technical: 'technical',
  code: 'technical',
  skills: 'technical',
  developer: 'technical',
  engineer: 'technical',
  coder: 'technical',
  results: 'results',
  impact: 'results',
  metrics: 'results',
  achievement: 'results',
  achievements: 'results',
  retrieval: 'retrieval',
  rag: 'retrieval',
  'retrieval augmented': 'retrieval',
  agents: 'agents',
  agent: 'agents',
  agentic: 'agents',
  multi: 'agents',
  autonomous: 'agents',
  trending: 'trending',
  trend: 'trending',
  latest: 'trending',
  new: 'trending',
  future: 'trending',
  location: 'location',
  where: 'location',
  based: 'location',
  city: 'location',
  remote: 'location',
  technologies: 'stack',
  technology: 'stack',
  tools: 'stack',
  frameworks: 'stack',
  languages: 'stack',
  tech: 'stack',
  braille: 'braille',
  accessibility: 'braille',
  visually: 'braille',
  impaired: 'braille',
  know: 'know',
  knows: 'know',
  knew: 'know',
  known: 'know',
  systems: 'system',
  projects: 'project',
  apps: 'app',
  products: 'product',
  users: 'user',
  tests: 'test',
  models: 'model',
  questions: 'question',
  answers: 'answer',
  topics: 'topic',
  roles: 'role',
  jobs: 'job',
  internships: 'internship',
  companies: 'company',
  teams: 'team',
  features: 'feature',
  details: 'detail',
  examples: 'example',
  numbers: 'number',
  goals: 'goal',
  trends: 'trend',
  shifts: 'shift'
}

// Expanded paraphrase patterns for common question rephrasing
const PARAPHRASE_PATTERNS: Array<{ canonical: string; variants: string[] }> = [
  { canonical: 'what do you build', variants: ['what do you make', 'what do you create', 'what do you work on', 'what kind of work', 'what projects', 'what apps', 'what systems'] },
  { canonical: 'what do you do', variants: ['what do you build', 'what do you make', 'what projects', 'what apps'] },
  { canonical: 'are you technical', variants: ['are you a developer', 'can you code', 'do you code', 'your technical skills', 'coding skills'] },
  { canonical: 'your experience', variants: ['tell me about your experience', 'what is your background', 'your career history', 'your work history'] },
  { canonical: 'your results', variants: ['what results have you achieved', 'what impact have you made', 'your metrics', 'your achievements', 'your performance'] },
  { canonical: 'tell me about yourself', variants: ['who are you', 'introduce yourself', 'your background', 'your story', 'tell me about you'] },
  { canonical: 'your education', variants: ['what did you study', 'your degree', 'where did you study', 'your education', 'your university'] },
  { canonical: 'how do i hire you', variants: ['how can i hire you', 'how do i contact you', 'how can i contact you', 'what email', 'your email address', 'email address', 'contact you'] },
  { canonical: 'what makes you different', variants: ['what makes you unique', 'why you', 'why should i hire you', 'what sets you apart', 'what makes you special'] },
  { canonical: 'what is your tech stack', variants: ['what technologies do you use', 'what tools do you use', 'your tech stack', 'technology stack'] },
  { canonical: 'what is trending', variants: ['what ai trends', 'what is hot', 'latest in ai', 'current trends', 'whats new'] },
  { canonical: 'tell me about flick done', variants: ['tell me about flickdone', 'flick done internship', 'your time at flick done', 'worked at flickdone'] },
  { canonical: 'tell me about the braille pipeline', variants: ['braille pipeline', 'your accessibility work', 'accessibility project'] }
]

/**
 * Expand a question using synonym and paraphrase maps for better semantic matching.
 */
export function expandQuestion(text: string): string {
  const normalized = text.toLowerCase().trim()
  const tokens = normalized.split(/[^a-z0-9+'-]/g).filter(w => w.length >= 2)

  // Build expanded token set
  const expandedTokens = new Set<string>()
  for (const word of tokens) {
    expandedTokens.add(word)
    const syn = SYNONYM_MAP[word]
    if (syn) expandedTokens.add(syn)
  }

  // Check for paraphrase matches
  for (const pattern of PARAPHRASE_PATTERNS) {
    for (const variant of pattern.variants) {
      if (normalized.includes(variant)) {
        // Add canonical form tokens
        const canonicalTokens = pattern.canonical.split(/[^a-z0-9]+/g).filter(w => w.length >= 2)
        for (const ct of canonicalTokens) {
          expandedTokens.add(ct)
        }
        break
      }
    }
  }

  return Array.from(expandedTokens).join(' ')
}

export type { FaqEntry }

let _entries: FaqEntry[] = []
let _idfCache: Map<string, number> | null = null

function loadEntries(): FaqEntry[] {
  if (_entries.length > 0) return _entries
  _entries = (faqData.coreQuestions as FaqEntry[]).filter(
    (e) => e.answer && e.answer.spoken && e.answer.spoken !== 'NEEDS INPUT'
  )
  return _entries
}

export function getFaqEntries(): FaqEntry[] {
  return loadEntries()
}

export function getFaqById(id: string): FaqEntry | undefined {
  return loadEntries().find((e) => e.id === id)
}

/**
 * Apply speech-recognition corrections.
 */
export function applyCorrections(text: string): string {
  let result = text.toLowerCase()
  const phrases = Object.keys(CORRECTIONS).sort((a, b) => b.length - a.length)
  for (const phrase of phrases) {
    if (phrase && CORRECTIONS[phrase] !== undefined) {
      const replacement = CORRECTIONS[phrase]
      try {
        result = result.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replacement)
      } catch {
        // ignore bad regex
      }
    }
  }
  return result
}

/**
 * Normalize text into deduplicated tokens with synonym expansion.
 */
export function tokenize(text: string): string[] {
  const corrected = applyCorrections(text)
  const raw = (corrected.match(/[a-z0-9]+/g) || []).filter((w) => w.length >= 2)
  const expanded = new Set<string>()
  for (const word of raw) {
    expanded.add(word)
    const syn = SYNONYM_MAP[word]
    if (syn) expanded.add(syn)
  }
  return Array.from(expanded)
}

/**
 * Build IDF map: keywords that appear in fewer entries get higher weight.
 */
function buildIdf(): Map<string, number> {
  if (_idfCache) return _idfCache
  const entries = loadEntries()
  const df = new Map<string, number>()

  for (const entry of entries) {
    const kwSet = new Set<string>()
    for (const kw of entry.keywords) {
      for (const token of tokenize(kw)) {
        kwSet.add(token)
      }
    }
    for (const token of kwSet) {
      df.set(token, (df.get(token) ?? 0) + 1)
    }
  }

  const idf = new Map<string, number>()
  const N = entries.length
  for (const [token, count] of df) {
    idf.set(token, Math.log(N / count) + 1)
  }
  _idfCache = idf
  return idf
}

export interface MatchResult {
  entry: FaqEntry
  score: number
  confidence: number
}

/**
 * Score FAQ entries against query using TF-IDF-like approach.
 */
export function scoreEntries(text: string): MatchResult[] {
  // Expand the query using synonym/paraphrase maps for better matching
  const expandedText = expandQuestion(text)
  const queryTokens = tokenize(expandedText)
  const entries = loadEntries()
  const idf = buildIdf()

  return entries
    .map((entry) => {
      // Build keyword token set for this entry
      const kwTokens: string[] = []
      for (const kw of entry.keywords) {
        for (const token of tokenize(kw)) {
          kwTokens.push(token)
        }
      }
      const kwSet = new Set(kwTokens)

      let score = 0
      for (const t of queryTokens) {
        if (STOP_WORDS.has(t)) continue

        const weight = idf.get(t) ?? 1

        // Exact match
        if (kwSet.has(t)) {
          score += 2 * weight
          continue
        }

        // Prefix match (only for non-trivial tokens)
        if (t.length >= 4) {
          for (const kw of kwSet) {
            if (kw.startsWith(t) || t.startsWith(kw)) {
              score += 0.8 * weight
              break
            }
          }
        }
      }

      return { entry, score, confidence: scoreToConfidence(score) }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
}

function scoreToConfidence(score: number): number {
  if (score <= 0) return 0
  if (score < 2) return 0.3
  if (score < 4) return 0.55
  if (score < 6) return 0.7
  return Math.min(0.95, 0.7 + (score - 6) * 0.02)
}

export const CONFIDENCE_THRESHOLD = 0.5

// Reset the IDF cache (for testing)
export function _resetCache(): void {
  _idfCache = null
  _entries = []
}
