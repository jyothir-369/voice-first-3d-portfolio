import { describe, it, expect } from 'vitest'
import { scoreQuestion, getTopic, getNextTopicIndex, TOPICS } from '@/engine/knowledge'

describe('Knowledge Base', () => {
  it('should score questions correctly', () => {
    const score1 = scoreQuestion('What has he built?')
    expect(score1).toBeGreaterThanOrEqual(0)

    const score2 = scoreQuestion('Tell me about agents')
    expect(score2).toBeGreaterThanOrEqual(0)
  })

  it('should return -1 for unmatched questions', () => {
    const score = scoreQuestion('xyz random unmatched query')
    expect(score).toBeLessThan(0)
  })

  it('should return topic data', () => {
    const topic = getTopic(0)
    expect(topic).toHaveProperty('s')
    expect(topic).toHaveProperty('c')
    expect(typeof topic.s).toBe('string')
    expect(typeof topic.c).toBe('string')
  })

  it('should return next topic index', () => {
    const next = getNextTopicIndex(0)
    expect(typeof next).toBe('number')
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
