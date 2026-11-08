import type { ResponseData } from '@/types'
import { scoreQuestion, getTopic, getNextTopicIndex } from './knowledge'

let pendingTopicIndex: number | null = null
let lastResponse: ResponseData | null = null

/**
 * Handle user input and generate appropriate response
 */
export function respond(text: string): ResponseData {
  const trimmed = text.trim()
  if (!trimmed) {
    return {
      s: "I didn't catch that.",
      c: "I didn't catch that."
    }
  }

  const normalized = trimmed.toLowerCase()

  // Check for affirmative follow-up
  if (/^(yes|yeah|yep|yup|sure|okay|ok|please|go ahead|tell me|why not)\b/.test(normalized) && pendingTopicIndex !== null) {
    const response = getTopic(pendingTopicIndex)
    pendingTopicIndex = getNextTopicIndex(pendingTopicIndex)
    lastResponse = response
    return response
  }

  // Check for stop command
  if (/\b(stop|quiet|enough|cancel)\b/.test(normalized)) {
    pendingTopicIndex = null
    return {
      s: 'Okay, stopping.',
      c: 'Okay, stopping.'
    }
  }

  // Check for repeat command
  if (/\b(repeat|again|say that)\b/.test(normalized) && lastResponse) {
    return lastResponse
  }

  // Check for greeting
  if (/^(hi|hello|hey|namaste)\b/.test(normalized)) {
    pendingTopicIndex = 0
    const response = {
      s: "Hello! Ask me about his AI products, his skills, his results, or how to hire him.",
      c: "Hello! Ask me about his AI products, his skills, his results, or how to hire him."
    }
    lastResponse = response
    return response
  }

  // Try to match against knowledge base
  const topicIndex = scoreQuestion(text)

  if (topicIndex < 0) {
    pendingTopicIndex = 0
    const response = {
      s: "I'm not sure about that one. You could ask about his AI products, his skills, his results, or how to hire him.",
      c: "I'm not sure about that one. Ask about his AI products, skills, results, or how to hire him."
    }
    lastResponse = response
    return response
  }

  const response = getTopic(topicIndex)
  pendingTopicIndex = getNextTopicIndex(topicIndex)
  lastResponse = response
  return response
}

/**
 * Reset conversation state
 */
export function resetConversation(): void {
  pendingTopicIndex = null
  lastResponse = null
}
