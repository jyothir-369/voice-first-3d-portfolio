import { describe, it, expect, beforeEach } from 'vitest'
import { routeIntent } from '@/engine/intent'
import { scoreEntries } from '@/engine/knowledge-base'
import { getMemory, resetMemory, setPendingFollowUp } from '@/engine/memory'
import { respond } from '@/engine/conversation'

describe('Conversational Intelligence: paraphrase and contextual routing', () => {
  beforeEach(() => {
    resetMemory()
  })

  describe('paraphrase handling via knowledge-base', () => {
    it('routes "what do you make" to the same topic as "what do you build"', () => {
      const matches = scoreEntries('what do you make')
      expect(matches[0]?.entry?.id).toBe('q1')
    })

    it('routes "are you a developer" to the same topic as "are you technical"', () => {
      const matches = scoreEntries('are you a developer')
      expect(matches[0]?.entry?.id).toBe('q2')
    })

    it('routes "how can I contact you" to the same topic as "how do I hire you"', () => {
      const matches = scoreEntries('how can I contact you')
      expect(matches[0]?.entry?.id).toBe('q8')
    })

    it('routes "what email do I use" to the same topic as "what email" (q8)', () => {
      const matches = scoreEntries('what email do I use')
      expect(matches[0]?.entry?.id).toBe('q8')
    })
  })

  describe('contextual follow-up routing', () => {
    it('routes "tell me more" to the pending follow-up', () => {
      setPendingFollowUp('q2')
      expect(routeIntent('tell me more', getMemory()).intent).toBe('yes')
    })

    it('routes a short topic reference to the pending follow-up', () => {
      setPendingFollowUp('q2')
      expect(routeIntent('what about that', getMemory()).intent).toBe('yes')
    })

    it('does not turn an explicit RAG question into a generic continuation', () => {
      setPendingFollowUp('q2')
      const result = routeIntent('what about the rag system', getMemory())
      expect(result.faqId).toBe('q14')
    })
  })

  describe('knowledge routing still works after changes', () => {
    it('routes "what do you build" correctly', () => {
      const result = routeIntent('what do you build', getMemory())
      expect(result.intent).toBe('knowledge')
    })

    it('routes "what results have you gotten" correctly', () => {
      const result = routeIntent('what results have you gotten', getMemory())
      expect(result.intent).toBe('knowledge')
    })

    it('handles empty input gracefully', () => {
      const result = routeIntent('', getMemory())
      expect(result.intent).toBe('unknown')
      expect(result.response.s).toBeDefined()
    })
  })
})
