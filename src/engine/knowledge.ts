import type { TopicData } from '@/types'

// Pre-written knowledge base from v12 prototype
export const TOPICS: TopicData[] = [
  {
    k: 'build built agent agents products research automate workflow orbit autopilot ai bot chatbot shipped projects',
    s: "Aarav builds AI systems that do real work. Orbit is a team of agents that writes a cited research brief in two minutes. Autopilot gives small business owners about eight hours back every week.",
    next: 1,
    q: 'Want to hear about the apps he has launched?'
  },
  {
    k: 'app apps users plantly khatakit notes dispatch launched consumer mobile',
    s: "He has shipped nine products. Plantly reached twelve thousand monthly users, KhataKit runs in eight hundred shops, and NotesNest finished third on Product Hunt.",
    next: 3,
    q: 'Want to hear about the results?'
  },
  {
    k: 'technical code engineer stack python skills model train fine-tune cost rag retrieval evaluation test smart expert',
    s: "He fine-tunes small models that cut running costs by about sixty two percent, builds retrieval over private documents, and runs fourteen agents in production. Nothing ships without automated tests, and all three hundred twelve pass.",
    next: 4,
    q: 'Want to know why that beats an agency?'
  },
  {
    k: 'results revenue money traction proof profit sales numbers uptime',
    s: "His companies earned eighteen lakh rupees in the first year, with ninety nine point nine percent uptime across systems.",
    next: 5,
    q: 'Want to hear about funding and the team?'
  },
  {
    k: 'why agency different freelancer unique better compare ownership',
    s: "He owns the whole stack from data to deployment, ships in about nine days, and is paid for outcomes, not hours.",
    next: 7,
    q: 'Want to know how to hire him?'
  },
  {
    k: 'funding investor raise capital preseed backed investment team',
    s: "He raised a pre-seed round at nineteen and now leads a team of six.",
    next: 7,
    q: 'Want to know how to hire him?'
  },
  {
    k: 'who about aarav yourself story age background founder ludhiana started',
    s: "Aarav is twenty one, from Ludhiana. He started coding at fourteen, sold his first app at seventeen, and now builds AI systems for businesses.",
    next: 0,
    q: 'Want to hear what he builds?'
  },
  {
    k: 'hire contact email reach talk together collaborate call book start project price work',
    s: "The fastest way is email. It's hello at aarav dot dev. Tell him the problem in two lines and he replies within a day.",
    c: 'Email hello@aarav.dev with the problem in two lines. He replies within a day.',
    next: null,
    q: ''
  },
  {
    k: 'trending trend trends latest future hot agentic mcp protocol voice device small models evals new today',
    s: "Right now the big shifts in AI are agentic systems that take action, open protocols like M C P that plug agents into tools, voice agents like this one, small models that run on the device, and serious testing before release. Aarav builds around all five.",
    c: 'Right now the big shifts in AI are agentic systems that take action, open protocols like MCP that plug agents into tools, voice agents like this one, small models that run on the device, and serious testing before release. Aarav builds around all five.',
    next: 0,
    q: 'Want to hear what he builds?'
  }
]

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
 * Get the next topic index from the current topic
 */
export function getNextTopicIndex(currentIndex: number): number | null {
  const topic = TOPICS[currentIndex]
  return topic ? topic.next : null
}
