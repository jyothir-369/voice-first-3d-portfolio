import type { CueRule } from '@/types'

/**
 * Cue rules map words to 3D objects that should appear.
 * Words come only from the verified FAQ vocabulary in content/faq.json;
 * demo product names and unverified metrics are excluded by owner instruction.
 */
export const CUES: CueRule[] = [
  { pattern: /^(agents?|agentic)$/, objectType: 'agents', label: 'AGENTS' },
  { pattern: /^clock$/, objectType: 'clock', label: 'CLOCK' },
  { pattern: /^plant$/, objectType: 'plant', label: 'PLANT' },
  { pattern: /^(ledger|invoicing|billing)$/, objectType: 'ledger', label: 'LEDGERLY' },
  { pattern: /^notes$/, objectType: 'notes', label: 'NOTES' },
  { pattern: /^(models?|retrieval|rag)$/, objectType: 'model', label: 'RAG' },
  { pattern: /^(tests?|testing|automated)$/, objectType: 'tests', label: 'TESTING' },
  { pattern: /^(results?|records|verification|speed)$/, objectType: 'bars', label: 'RESULTS' },
  { pattern: /^(stack|deployment|fastapi|docker)$/, objectType: 'tower', label: 'TECH STACK' },
  { pattern: /^hackathon$/, objectType: 'rocket', label: 'HACKATHON' },
  { pattern: /^(team|collaborat)$/, objectType: 'team', label: 'TEAM' },
  { pattern: /^(email|contact|hire)$/, objectType: 'mail', label: 'EMAIL' },
  { pattern: /^(hyderabad|india|coding|engineer)$/, objectType: 'person', label: 'JYOTHIR' },
  { pattern: /^voice$/, objectType: 'voice', label: 'VOICE AGENTS' },
  { pattern: /^(mcp|protocols?)$/, objectType: 'hub', label: 'MCP' },
  { pattern: /^(device|on-device)$/, objectType: 'phone', label: 'ON-DEVICE' }
]

/**
 * Find a cue match for a given word
 */
export function findCue(word: string): CueRule | null {
  for (const cue of CUES) {
    if (cue.pattern.test(word)) {
      return cue
    }
  }
  return null
}
