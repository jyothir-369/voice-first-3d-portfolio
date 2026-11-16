import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { splitSentences, ask, askWithFallback, speakStreaming, AiClientError } from '@/ai/client'

const globalFetch = globalThis.fetch

describe('splitSentences', () => {
  it('splits on sentence enders', () => {
    expect(splitSentences('Hello there. I build AI. Yes?')).toEqual(['Hello there.', 'I build AI.', 'Yes?'])
  })
  it('keeps a trailing fragment without punctuation', () => {
    expect(splitSentences('one two. three')).toEqual(['one two.', 'three'])
  })
  it('returns [] for empty text', () => {
    expect(splitSentences('')).toEqual([])
    expect(splitSentences('   ')).toEqual([])
  })
})

describe('ask', () => {
  afterEach(() => {
    globalThis.fetch = globalFetch
    vi.restoreAllMocks()
  })

  function mockFetch(status: number, body: unknown) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body)
    } as Response)
  }

  it('returns an ai reply from a valid payload', async () => {
    mockFetch(200, { say: 'I build agents.', caption: 'I build agents.', show: ['agents'], followUp: 'More?' })
    const r = await ask('What do you build?')
    expect(r.say).toBe('I build agents.')
    expect(r.show).toEqual(['agents'])
    expect(r.source).toBe('ai')
  })

  it('posts question, history and sessionId to /api/ask', async () => {
    mockFetch(200, { say: 'x' })
    await ask('hi', { history: [{ role: 'user', content: 'hello' }], sessionId: 's1' })
    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe('/api/ask')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body).question).toBe('hi')
    expect(JSON.parse(init.body).sessionId).toBe('s1')
  })

  it('throws AiClientError on non-ok status', async () => {
    mockFetch(429, { error: 'Too many requests.' })
    await expect(ask('q')).rejects.toMatchObject({ status: 429 })
  })

  it('throws AiClientError status 0 on network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(ask('q')).rejects.toMatchObject({ status: 0 })
  })

  it('aborts after the timeout', async () => {
    globalThis.fetch = vi.fn().mockImplementation(
      () => new Promise((_resolve, reject) => setTimeout(() => reject(new AiClientError(0, 'aborted')), 50))
    )
    await expect(ask('q', { timeoutMs: 1 })).rejects.toBeInstanceOf(AiClientError)
  })
})

describe('askWithFallback', () => {
  afterEach(() => {
    globalThis.fetch = globalFetch
    vi.restoreAllMocks()
  })

  it('prefers the AI answer', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ say: 'AI answer.', caption: 'AI answer.', show: ['model'], followUp: '' })
    } as Response)
    const r = await askWithFallback('What do you build?')
    expect(r.source).toBe('ai')
    expect(r.say).toBe('AI answer.')
  })

  it('falls back to the rules engine when the AI is unreachable', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('down'))
    const r = await askWithFallback('What do you build?')
    expect(r.source).toBe('rules')
    expect(r.say.length).toBeGreaterThan(0)
  })

  it('uses the rules engine answer for unrecognized input when AI is down', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('down'))
    const r = await askWithFallback('zzzqqq nonsense input')
    expect(r.source).toBe('rules')
    expect(r.say).toMatch(/not sure/i)
  })

  it('never throws to the caller', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('down'))
    await expect(askWithFallback('hello')).resolves.toBeDefined()
  })
})

describe('speakStreaming', () => {
  it('speaks each sentence in order', () => {
    const spoken: string[] = []
    speakStreaming('First sentence. Second sentence.', (chunk, done) => {
      spoken.push(chunk)
      done?.()
    })
    expect(spoken).toEqual(['First sentence.', 'Second sentence.'])
  })

  it('calls onAllDone after the last sentence completes', () => {
    let done = false
    speakStreaming('Only one.', (_c, complete) => complete?.(), () => { done = true })
    expect(done).toBe(true)
  })

  it('handles empty text without speaking', () => {
    const spoken: string[] = []
    let done = false
    speakStreaming('', (c) => { spoken.push(c) }, () => { done = true })
    expect(spoken).toEqual([])
    expect(done).toBe(true)
  })
})
