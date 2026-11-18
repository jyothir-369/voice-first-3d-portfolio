import { describe, it, expect } from 'vitest'
import faqData from '../../../content/faq.json'
import profileData from '../../../content/profile.json'

/**
 * Phase 7 content gates: no placeholders, no fabricated demo content,
 * and the question chips derive from the verified FAQ corpus.
 */

const PLACEHOLDERS = ['NEEDS INPUT', 'TBD', 'TODO', 'PLACEHOLDER', 'lorem', 'LOREM', 'XXX', 'FIXME']
const BANNED_PERSONA = ['Aarav', 'aarav', 'hello@aarav.dev', 'Ludhiana', 'ludhiana', 'Orbit', 'Autopilot', 'Plantly', 'KhataKit', 'NotesNest', 'pre-seed', '312 tests', '18L', '99.9%']

function walkStrings(value: unknown, sink: string[]): void {
  if (typeof value === 'string') {
    sink.push(value)
  } else if (Array.isArray(value)) {
    value.forEach(v => walkStrings(v, sink))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(v => walkStrings(v, sink))
  }
}

describe('Phase 7: content files carry no placeholders', () => {
  it('faq.json has no placeholder or banned persona strings', () => {
    const strings: string[] = []
    walkStrings(faqData, strings)
    for (const text of strings) {
      for (const p of PLACEHOLDERS) {
        expect(text, `faq.json contains placeholder "${p}"`).not.toContain(p)
      }
      for (const b of BANNED_PERSONA) {
        expect(text, `faq.json contains banned persona string "${b}"`).not.toContain(b)
      }
    }
  })

  it('profile.json has no placeholder strings', () => {
    const strings: string[] = []
    walkStrings(profileData, strings)
    for (const text of strings) {
      for (const p of PLACEHOLDERS) {
        expect(text, `profile.json contains placeholder "${p}"`).not.toContain(p)
      }
    }
  })

  it('every core question is a non-empty string (chip source)', () => {
    const questions = (faqData as { coreQuestions?: { question?: string }[] }).coreQuestions ?? []
    expect(questions.length).toBeGreaterThanOrEqual(10)
    questions.forEach(q => {
      expect(typeof q.question).toBe('string')
      expect((q.question ?? '').trim().length).toBeGreaterThan(0)
    })
  })

  it('contact email is present in profile and used by faq hire answer', () => {
    const email = profileData.contact.email
    expect(email).toBe('jyothirraghavalu369@gmail.com')
    const hire = ((faqData as { coreQuestions?: { id: string; answer: { spoken: string }[] }[] }).coreQuestions ?? [])
      .find(q => q.id === 'q8')
    expect(hire?.answer.spoken).toContain('jyothir raghavalu three sixty nine')
  })

  it('owner name is the verified name everywhere it appears', () => {
    expect(profileData.displayName).toBe('Jyothir Raghavalu Bhogi')
    const strings: string[] = []
    walkStrings(faqData, strings)
    strings.forEach(s => {
      expect(s).not.toContain('Aarav')
    })
  })
})
