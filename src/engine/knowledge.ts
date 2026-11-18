import type { TopicData } from '@/types'

// Scoring helpers only. The v12 prototype's pre-written TOPICS array was
// removed at the owner's instruction: every answer in it was fabricated demo
// content about a fictional person. Live answers come from content/faq.json
// via knowledge-base.ts; this module's scoring is kept for the tests that
// exercise match quality.

export const TOPICS: TopicData[] = []

// Synonym map for better matching
export const SYNONYMS: Record<string, string> = {
  bot: 'agent',
  built: 'build',
  shipped: 'build',
  money: 'revenue',
  coder: 'technical',
  code: 'technical'
}

/**
 * Score a question against all topics and return the best match index
 */
export function scoreQuestion(question: string): number {
  const words = (question.toLowerCase().match(/[a-z0-9]+/g) || [])
  const expanded: string[] = []

  words.forEach(word => {
    expanded.push(word)
    if (SYNONYMS[word]) {
      expanded.push(SYNONYMS[word])
    }
  })

  let bestIndex = -1
  let bestScore = 0

  TOPICS.forEach((topic, index) => {
    const keywords = topic.k.split(' ')
    let score = 0

    expanded.forEach(word => {
      if (word.length < 3) return

      keywords.forEach(keyword => {
        if (
          keyword === word ||
          (word.length > 3 && keyword.indexOf(word) === 0) ||
          (keyword.length > 3 && word.indexOf(keyword) === 0)
        ) {
          score++
        }
      })
    })

    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return bestIndex
}

/**
 * Get a topic response by index
 */
export function getTopic(index: number): { s: string; c: string } {
  const topic = TOPICS[index]
  if (!topic) {
    return {
      s: '',
      c: ''
    }
  }

  const followUp = topic.q ? ' ' + topic.q : ''
  return {
    s: topic.s + followUp,
    c: (topic.c || topic.s) + followUp
  }
}

/**
 * Get the next topic index from the current topic index
 */
export function getNextTopicIndex(currentIndex: number): number | null {
  const topic = TOPICS[currentIndex]
  return topic ? topic.next : null
}
