import type { ResponseData } from '@/types'
import { scoreQuestion, getTopic, getNextTopicIndex } from './knowledge'
import { routeIntent } from './intent'
import { getFaqById, getFaqEntries } from './knowledge-base'
import {
  getMemory,
  setLastFaq,
  setPendingFollowUp,
  addRecentQuestion,
  resetMemory
} from './memory'

let _lastResponse: ResponseData | null = null

function resolveNextFaqId(currentFaqId: string): string | null {
  const all = getFaqEntries()
  const idx = all.findIndex((e) => e.id === currentFaqId)
  if (idx >= 0 && idx + 1 < all.length) {
    const next = all[idx + 1]
    return next ? next.id : null
  }
  return null
}

/**
 * Handle user input and generate a response.
 */
export function respond(text: string): ResponseData {
  const trimmed = text.trim()
  if (!trimmed) {
    return { s: "I didn't catch that.", c: "I didn't catch that." }
  }

  addRecentQuestion(trimmed)
  const memory = getMemory()
  const result = routeIntent(trimmed, memory)

  switch (result.intent) {
    case 'stop': {
      setPendingFollowUp(null)
      _lastResponse = result.response
      return result.response
    }

    case 'repeat': {
      return _lastResponse ?? { s: "I haven't said anything yet!", c: "I haven't said anything yet!" }
    }

    case 'yes': {
      const followId = memory.pendingFollowUpFaqId
      if (followId) {
        const entry = getFaqById(followId)
        if (entry) {
          const response: ResponseData = { s: entry.answer.spoken, c: entry.answer.caption }
          setLastFaq(followId)
          setPendingFollowUp(resolveNextFaqId(followId))
          _lastResponse = response
          return response
        }
      }
      // No pending follow-up
      return { s: "Sure! What would you like to know?", c: "Sure! What would you like to know?" }
    }

    case 'no': {
      setPendingFollowUp(null)
      _lastResponse = result.response
      return result.response
    }

    case 'greeting':
    case 'thanks':
    case 'help':
    case 'refusal':
    case 'unknown': {
      _lastResponse = result.response
      return result.response
    }

    case 'knowledge': {
      if (result.faqId) {
        setLastFaq(result.faqId)
        if (result.followUp) {
          setPendingFollowUp(resolveNextFaqId(result.faqId))
        } else {
          setPendingFollowUp(null)
        }
      }
      _lastResponse = result.response
      return result.response
    }
  }
}

export function resetConversation(): void {
  resetMemory()
  _lastResponse = null
}

// Keep legacy exports for existing tests
export { scoreQuestion, getTopic, getNextTopicIndex }
