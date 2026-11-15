import type { IntentResult, ResponseData } from '@/types'
import type { ConversationMemory } from './memory'
import {
  scoreEntries,
  CONFIDENCE_THRESHOLD,
  applyCorrections
} from './knowledge-base'

const GREETING_RESPONSES = [
  "Hello! I can tell you about my work in AI, my projects, experience, or how to get in touch.",
  "Hi there! Ask me about my AI systems, skills, or anything about my background.",
  "Namaste! I'm ready to talk about my work. What would you like to know?"
]

const THANKS_RESPONSES = [
  "You're welcome! Ask anything else you'd like to know.",
  "Happy to help! Anything else I can tell you?",
  "Of course! Let me know if you have more questions."
]

const HELP_RESPONSES = [
  "You can ask: 'What do you build?', 'Tell me about your experience', 'What's your tech stack?', or 'How do I hire you?'",
  "Try asking about my AI projects, my tech stack, my experience at flickDone or Know AI, or how to contact me.",
  "Good questions include: what I build, my best projects, my results, or how to reach me."
]

const LOW_CONFIDENCE_RESPONSES = [
  "I'm not sure I caught that. Try asking about my projects, experience, skills, or contact info.",
  "That one's a bit unclear. Ask about my AI work, tech stack, or how to reach me.",
  "I didn't quite get that. You can ask about what I build, my background, or how to hire me."
]

const STOP_RESPONSES = [
  "Okay, stopping.",
  "Sure, I'll stop here.",
  "Done."
]

const REFUSAL_PATTERNS: Array<{ keywords: string[]; spoken: string; caption: string }> = [
  {
    keywords: ['salary', 'pay', 'compensation', 'rate', 'price', 'cost', 'charge', 'money', 'fee'],
    spoken: "I prefer to discuss compensation after understanding the role and scope. Let's talk about the project first.",
    caption: "Compensation discussed after project scope is clear."
  },
  {
    keywords: ['confidential', 'private', 'nda', 'client names', 'secret'],
    spoken: "I can't share details about confidential work, but I'm happy to discuss similar public projects.",
    caption: "Confidential work not disclosed. Ask about public projects instead."
  },
  {
    keywords: ['research paper', 'manuscript', 'publication', 'ieee', 'journal', 'academic paper'],
    spoken: "I focus on production systems rather than academic research. Ask me about my engineering work instead.",
    caption: "Focus on production systems, not academic research."
  }
]

let _varietyIndex = 0

function pick<T>(arr: T[]): T {
  const val = arr[_varietyIndex % arr.length]
  _varietyIndex++
  return val as T
}

function makeResponse(spoken: string, caption?: string): ResponseData {
  return { s: spoken, c: caption ?? spoken }
}

function checkRefusal(normalized: string): ResponseData | null {
  for (const r of REFUSAL_PATTERNS) {
    if (r.keywords.some((kw) => normalized.includes(kw))) {
      return makeResponse(r.spoken, r.caption)
    }
  }
  return null
}

const YES_PATTERN = /^(yes|yeah|yep|yup|sure|okay|ok|please|go ahead|why not|absolutely|definitely|tell me more|what else|go on|continue|more details|elaborate|and then|what about that)\b/
const NO_PATTERN = /^(no|nope|not now|skip|nah)\b/

function hasPendingFollowUp(memory: ConversationMemory): boolean {
  return typeof memory.pendingFollowUpFaqId === "string" && memory.pendingFollowUpFaqId.length > 0
}

export function routeIntent(text: string, memory: ConversationMemory): IntentResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { intent: "unknown", response: makeResponse("I did not catch that."), confidence: 0 }
  }

  const normalized = trimmed.toLowerCase()
  const corrected = applyCorrections(normalized)

  // 1. STOP and cancel words
  if (/\b(stop|quiet|enough|cancel|nevermind|never mind)\b/.test(normalized)) {
    return { intent: "stop", response: makeResponse(pick(STOP_RESPONSES)), confidence: 1 }
  }

  // 2. REPEAT and say-again
  if (/\b(repeat|again|say that|say again|what did you say)\b/.test(normalized)) {
    return { intent: "repeat", response: makeResponse(""), confidence: 1 }
  }

  // 3. YES / NO - only as answers to a pending follow-up.
  //    As openers ("tell me about X", "no ai") they fall through to knowledge/refusal.
  if (hasPendingFollowUp(memory) && YES_PATTERN.test(normalized)) {
    return { intent: "yes", response: makeResponse(""), confidence: 1 }
  }
  if (hasPendingFollowUp(memory) && NO_PATTERN.test(normalized)) {
    return { intent: "no", response: makeResponse("Alright, ask me anything else!"), confidence: 1 }
  }

  // 4. GREETINGS
  if (/^(hi|hello|hey|namaste|good morning|good afternoon|good evening|howdy|greetings)\b/.test(normalized)) {
    return { intent: "greeting", response: makeResponse(pick(GREETING_RESPONSES)), confidence: 1 }
  }

  // THANKS
  if (/\b(thanks|thank you|cheers|appreciate it|great job|well done)\b/.test(normalized)) {
    return { intent: "thanks", response: makeResponse(pick(THANKS_RESPONSES)), confidence: 1 }
  }

  // 5. HELP
  if (/\b(help|what can i ask|options|what should i ask|what can you tell|guide me)\b/.test(normalized)) {
    return { intent: "help", response: makeResponse(pick(HELP_RESPONSES)), confidence: 1 }
  }

  // 6. OUT-OF-SCOPE / REFUSED TOPICS
  const refusalResponse = checkRefusal(corrected)
  if (refusalResponse) {
    return { intent: "refusal", response: refusalResponse, confidence: 1 }
  }

  // 7. KNOWLEDGE LOOKUP
  const matches = scoreEntries(text)
  const best = matches[0]

  if (!best || best.confidence < 0.3) {
    const suggestions = matches.slice(0, 2).map((m) => m.entry.question)
    return {
      intent: "unknown",
      response: makeResponse(pick(LOW_CONFIDENCE_RESPONSES)),
      confidence: 0,
      suggestions
    }
  }

  if (best.confidence < CONFIDENCE_THRESHOLD) {
    const suggestions = matches.slice(0, 2).map((m) => m.entry.question)
    const s1 = suggestions[0] ?? ""
    const s2 = suggestions[1]
    const spoken = `I am not sure I got that. Did you mean: "${s1}"${s2 ? ` or "${s2}"` : ""}?`
    return { intent: "unknown", response: makeResponse(spoken), confidence: best.confidence, suggestions }
  }

  const entry = best.entry
  return {
    intent: "knowledge",
    response: makeResponse(entry.answer.spoken, entry.answer.caption),
    faqId: entry.id,
    confidence: best.confidence,
    objects: entry.answer.objects,
    followUp: entry.answer.followUp || undefined
  }
}

export { GREETING_RESPONSES, THANKS_RESPONSES, HELP_RESPONSES, LOW_CONFIDENCE_RESPONSES, STOP_RESPONSES }
