import { describe, it, expect } from 'vitest'
import { CUES, findCue } from '../../../src/stage/cues'

describe('Cue rules', () => {
  it('maps agents/agent/agentic to agents', () => {
    expect(findCue('agents')?.objectType).toBe('agents')
    expect(findCue('agent')?.objectType).toBe('agents')
    expect(findCue('agentic')?.objectType).toBe('agents')
  })

  it('maps clock to clock', () => {
    expect(findCue('clock')?.objectType).toBe('clock')
  })

  it('maps plant to plant', () => {
    expect(findCue('plant')?.objectType).toBe('plant')
  })

  it('maps ledger/invoicing/billing to ledger (Ledgerly domain)', () => {
    expect(findCue('ledger')?.objectType).toBe('ledger')
    expect(findCue('invoicing')?.objectType).toBe('ledger')
    expect(findCue('billing')?.objectType).toBe('ledger')
  })

  it('maps notes to notes', () => {
    expect(findCue('notes')?.objectType).toBe('notes')
  })

  it('maps model/rag/retrieval to model', () => {
    expect(findCue('model')?.objectType).toBe('model')
    expect(findCue('rag')?.objectType).toBe('model')
    expect(findCue('retrieval')?.objectType).toBe('model')
  })
  it('maps tests/testing/automated to tests', () => {
    expect(findCue('testing')?.objectType).toBe('tests')
    expect(findCue('tests')?.objectType).toBe('tests')
    expect(findCue('automated')?.objectType).toBe('tests')
  })

  it('maps results/records/verification to bars', () => {
    expect(findCue('results')?.objectType).toBe('bars')
    expect(findCue('records')?.objectType).toBe('bars')
    expect(findCue('verification')?.objectType).toBe('bars')
  })

  it('maps stack/fastapi/docker to tower', () => {
    expect(findCue('stack')?.objectType).toBe('tower')
    expect(findCue('fastapi')?.objectType).toBe('tower')
    expect(findCue('docker')?.objectType).toBe('tower')
  })

  it('maps hackathon to rocket', () => {
    expect(findCue('hackathon')?.objectType).toBe('rocket')
  })

  it('maps team to team', () => {
    expect(findCue('team')?.objectType).toBe('team')
  })
  it('maps email/contact/hire to mail', () => {
    expect(findCue('email')?.objectType).toBe('mail')
    expect(findCue('contact')?.objectType).toBe('mail')
    expect(findCue('hire')?.objectType).toBe('mail')
  })

  it('maps hyderabad/india/coding to person', () => {
    expect(findCue('hyderabad')?.objectType).toBe('person')
    expect(findCue('india')?.objectType).toBe('person')
    expect(findCue('coding')?.objectType).toBe('person')
  })

  it('maps the removed placeholder city ludhiana to nothing', () => {
    expect(findCue('ludhiana')).toBeNull()
  })

  it('maps voice to voice', () => {
    expect(findCue('voice')?.objectType).toBe('voice')
  })

  it('maps mcp to hub', () => {
    expect(findCue('mcp')?.objectType).toBe('hub')
  })

  it('maps device to phone', () => {
    expect(findCue('device')?.objectType).toBe('phone')
  })

  it('returns null for unknown words', () => {
    expect(findCue('unknown')).toBeNull()
    expect(findCue('')).toBeNull()
    expect(findCue('orbit')).toBeNull()
    expect(findCue('plantly')).toBeNull()
    expect(findCue('aarav')).toBeNull()
  })

  it('rejects demo product names and fabricated metrics', () => {
    const labels = CUES.map(c => c.label).join(' ')
    for (const banned of ['ORBIT', 'AUTOPILOT', 'PLANTLY', 'KHATAKIT', 'NOTESNEST', '312', 'PRE-SEED', 'AARAV', 'AARAV.DEV', 'SIX']) {
      expect(labels).not.toContain(banned)
    }
  })

  it('covers all 16 distinct object types', () => {
    const types = new Set(CUES.map(c => c.objectType))
    expect(types.size).toBe(16)
  })

  it('every cue has a non-empty label', () => {
    for (const cue of CUES) {
      expect(cue.label.length).toBeGreaterThan(0)
    }
  })
})
