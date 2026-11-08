import { describe, it, expect, beforeEach } from 'vitest'
import { respond, resetConversation } from '@/engine/conversation'

describe('Conversation Engine', () => {
  beforeEach(() => {
    resetConversation()
  })

  it('should respond to greetings', () => {
    const response = respond('hello')
    expect(response.s).toContain('Hello')
  })

  it('should handle empty input', () => {
    const response = respond('')
    expect(response.s).toBeDefined()
  })

  it('should respond to yes for follow-up', () => {
    // First ask a question
    respond('What has he built?')
    // Then say yes
    const response = respond('yes')
    expect(response.s).toBeDefined()
    expect(response.c).toBeDefined()
  })

  it('should handle stop command', () => {
    const response = respond('stop')
    expect(response.s).toContain('stopping')
  })

  it('should handle repeat command', () => {
    const first = respond('hello')
    const repeated = respond('repeat')
    expect(repeated.s).toBe(first.s)
  })

  it('should handle unmatched questions', () => {
    const response = respond('xyz random unmatched query')
    expect(response.s).toContain('not sure')
  })

  it('should match agent-related questions', () => {
    const response = respond('Tell me about agents')
    expect(response.s.toLowerCase()).toContain('agent')
  })
})
