import { describe, it, expect } from 'vitest'
import { CUES, findCue } from '../../../src/stage/cues'

describe('Cue rules', () => {
  it('maps "agents" to the agents object', () => {
    expect(findCue('agents')?.objectType).toBe('agents')
  })

  it('maps "agent" (singular) to agents', () => {
    expect(findCue('agent')?.objectType).toBe('agents')
  })

  it('maps "agentic" to agents', () => {
    expect(findCue('agentic')?.objectType).toBe('agents')
  })

  it('maps "orbit" to agents', () => {
    expect(findCue('orbit')?.objectType).toBe('agents')
  })

  it('maps "autopilot" to clock', () => {
    expect(findCue('autopilot')?.objectType).toBe('clock')
  })

  it('maps "hours" to clock', () => {
    expect(findCue('hours')?.objectType).toBe('clock')
  })

  it('maps "plantly" to plant', () => {
    expect(findCue('plantly')?.objectType).toBe('plant')
  })

  it('maps "khatakit" to ledger', () => {
    expect(findCue('khatakit')?.objectType).toBe('ledger')
  })

  it('maps "ledger" to ledger', () => {
    expect(findCue('ledger')?.objectType).toBe('ledger')
  })

  it('maps "notesnest" to notes', () => {
    expect(findCue('notesnest')?.objectType).toBe('notes')
  })

  it('maps "model" to model', () => {
    expect(findCue('model')?.objectType).toBe('model')
  })

  it('maps "fine-tunes" to model', () => {
    expect(findCue('fine-tunes')?.objectType).toBe('model')
  })

  it('maps "testing" to tests', () => {
    expect(findCue('testing')?.objectType).toBe('tests')
  })

  it('maps "revenue" to bars', () => {
    expect(findCue('revenue')?.objectType).toBe('bars')
  })

  it('maps "stack" to tower', () => {
    expect(findCue('stack')?.objectType).toBe('tower')
  })

  it('maps "pre-seed" to rocket', () => {
    expect(findCue('pre-seed')?.objectType).toBe('rocket')
  })

  it('maps "six" to team', () => {
    expect(findCue('six')?.objectType).toBe('team')
  })

  it('maps "email" to mail', () => {
    expect(findCue('email')?.objectType).toBe('mail')
  })

  it('maps "ludhiana" to person', () => {
    expect(findCue('ludhiana')?.objectType).toBe('person')
  })

  it('maps "voice" to voice', () => {
    expect(findCue('voice')?.objectType).toBe('voice')
  })

  it('maps "mcp" to hub', () => {
    expect(findCue('mcp')?.objectType).toBe('hub')
  })

  it('maps "device" to phone', () => {
    expect(findCue('device')?.objectType).toBe('phone')
  })

  it('returns null for unknown words', () => {
    expect(findCue('unknown')).toBeNull()
    expect(findCue('')).toBeNull()
    expect(findCue('hello')).toBeNull()
  })

  it('is case-sensitive (no partial matches)', () => {
    expect(findCue('AGENTS')).toBeNull()
    expect(findCue('Agents')).toBeNull()
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
