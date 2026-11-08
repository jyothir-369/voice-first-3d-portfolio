import type { CueRule } from '@/types'

/**
 * Cue rules map words to 3D objects that should appear
 */
export const CUES: CueRule[] = [
  { pattern: /^orbit$/, objectType: 'agents', label: 'ORBIT' },
  { pattern: /^(agents?|agentic)$/, objectType: 'agents', label: 'AGENTS' },
  { pattern: /^(autopilot|hours)$/, objectType: 'clock', label: 'AUTOPILOT' },
  { pattern: /^plantly$/, objectType: 'plant', label: 'PLANTLY' },
  { pattern: /^(khatakit|ledgers?)$/, objectType: 'ledger', label: 'KHATAKIT' },
  { pattern: /^(notesnest|notes)$/, objectType: 'notes', label: 'NOTESNEST' },
  { pattern: /^(fine-tunes|models?|retrieval)$/, objectType: 'model', label: 'SMALL MODELS' },
  { pattern: /^(tests?|testing|automated)$/, objectType: 'tests', label: '312 TESTS' },
  { pattern: /^(lakh|revenue|earned|uptime)$/, objectType: 'bars', label: 'RESULTS' },
  { pattern: /^(stack|deployment)$/, objectType: 'tower', label: 'FULL STACK' },
  { pattern: /^pre-seed$/, objectType: 'rocket', label: 'PRE-SEED' },
  { pattern: /^six$/, objectType: 'team', label: 'TEAM OF SIX' },
  { pattern: /^(email|hello@aarav\.dev)$/, objectType: 'mail', label: 'HELLO@AARAV.DEV' },
  { pattern: /^(ludhiana|coding)$/, objectType: 'person', label: 'AARAV' },
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
