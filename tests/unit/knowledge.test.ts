import { describe, it, expect } from 'vitest'
import { scoreQuestion, getTopic, getNextTopicIndex, TOPICS } from '@/engine/knowledge'

describe('Knowledge Base', () => {  it('should score questions against the (now empty) topic list without crashing', () => {
    // TOPICS is empty: the prototype answers were removed per owner instruction.
    // Scoring must still be total and deterministic.
    const score = scoreQuestion('What has he built?')
    expect(typeof score).toBe('number')
    expect(score).toBe(-1)
  })

  it('should return -1 for unmatched questions', () => {
    const score = scoreQuestion('xyz random unmatched query')
    expect(score).toBeLessThan(0)
  })

  it('should return empty topic data when no topics exist', () => {
    const topic = getTopic(0)
    expect(topic.s).toBe('')
    expect(topic.c).toBe('')
  })

  it('should return null for next topic index when no topics exist', () => {
    const next = getNextTopicIndex(0)
    expect(next).toBeNull()
  })

  it('has no fabricated demo topics', () => {
    // The v12 prototype topic array was removed per owner instruction;
    // live answers come from content/faq.json via knowledge-base.ts.
    expect(TOPICS.length).toBe(0)
    const serialized = JSON.stringify(TOPICS)
    for (const banned of ['Aarav', 'Orbit', 'Autopilot', 'Plantly', 'KhataKit', 'NotesNest', 'hello@aarav.dev', 'pre-seed']) {
      expect(serialized).not.toContain(banned)
    }
  })

  it('should have valid topic structure', () => {
    TOPICS.forEach((topic) => {
      expect(topic).toHaveProperty('k')
      expect(topic).toHaveProperty('s')
      expect(topic).toHaveProperty('next')
      expect(topic).toHaveProperty('q')
      expect(typeof topic.k).toBe('string')
      expect(typeof topic.s).toBe('string')
      expect(typeof topic.q).toBe('string')
    })
  })
})

