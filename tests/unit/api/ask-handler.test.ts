// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import { request as httpRequest } from 'node:http'
import { createAskHandler, type OpenAIClient } from '../../../api/ask'
import { RateLimiter } from '../../../server/ask-service'

interface HttpResult {
  status: number
  headers: Record<string, string | string[] | undefined>
  body: Record<string, unknown>
}

function fakeClient(payload: string): OpenAIClient {
  return {
    responses: {
      create: vi.fn().mockResolvedValue({
        output: [{ type: 'message', content: [{ type: 'output_text', text: payload }] }],
        usage: { input_tokens: 12, output_tokens: 5 }
      })
    }
  } as unknown as OpenAIClient
}

async function start(
  handler: (req: IncomingMessage, res: import('node:http').ServerResponse) => Promise<void>,
  configureRequest?: (req: IncomingMessage) => void
): Promise<{
  server: Server
  request: (method: string, body?: string) => Promise<HttpResult>
}> {
  const server = createServer((req, res) => {
    configureRequest?.(req)
    void handler(req, res)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('test server did not bind')

  return {
    server,
    request: (method, body) => new Promise<HttpResult>((resolve, reject) => {
      const req = httpRequest({
        host: '127.0.0.1',
        port: address.port,
        path: '/api/ask',
        method,
        headers: body ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } : undefined
      }, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
          })
        })
      })
      req.on('error', reject)
      if (body) req.write(body)
      req.end()
    })
  }
}

describe('Vercel Node Function: POST /api/ask', () => {
  const originalKey = process.env.GROQ_API_KEY
  const servers: Server[] = []

  afterEach(async () => {
    if (originalKey === undefined) delete process.env.GROQ_API_KEY
    else process.env.GROQ_API_KEY = originalKey
    await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))))
  })

  it('returns 503 when the server-only API key is absent', async () => {
    delete process.env.GROQ_API_KEY
    const app = await start(createAskHandler())
    servers.push(app.server)

    const response = await app.request('POST', JSON.stringify({ question: 'What do you build?' }))
    expect(response.status).toBe(503)
    expect(response.body).toEqual({ error: 'backend not configured' })
  })

  it('rejects methods other than POST without contacting the provider', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    const provider = vi.fn()
    const app = await start(createAskHandler({ clientFactory: provider }))
    servers.push(app.server)

    const response = await app.request('GET')
    expect(response.status).toBe(405)
    expect(response.headers.allow).toBe('POST')
    expect(response.body).toEqual({ error: 'method not allowed' })
    expect(provider).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON before creating an OpenAI client', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    const provider = vi.fn()
    const app = await start(createAskHandler({ clientFactory: provider }))
    servers.push(app.server)

    const response = await app.request('POST', '{not-json')
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'invalid JSON body' })
    expect(provider).not.toHaveBeenCalled()
  })

  it('returns 400 when the Vercel parsed-body getter throws', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    const provider = vi.fn()

    const app = await start(
      createAskHandler({ clientFactory: provider }),
      (req) => {
        Object.defineProperty(req, 'body', {
          configurable: true,
          get() {
            throw new SyntaxError('Malformed JSON')
          }
        })
      }
    )
    servers.push(app.server)

    const response = await app.request('POST', JSON.stringify({
      question: 'What do you build?'
    }))

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'invalid JSON body' })
    expect(provider).not.toHaveBeenCalled()
  })
  it('returns a validated grounded reply for a successful request', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    const client = fakeClient(JSON.stringify({
      say: 'I build grounded AI systems.',
      caption: 'I build grounded AI systems.',
      show: ['agents', 'unknown-object'],
      followUp: 'Want an example?'
    }))
    const app = await start(createAskHandler({ clientFactory: () => client }))
    servers.push(app.server)

    const response = await app.request('POST', JSON.stringify({
      question: 'What do you build?',
      sessionId: 'integration-test'
    }))
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({
      say: 'I build grounded AI systems.',
      caption: 'I build grounded AI systems.',
      show: ['agents'],
      followUp: 'Want an example?'
    })
    expect(response.headers['cache-control']).toBe('no-store')
  })

  it('enforces the rate limit across requests in one function instance', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    const limiter = new RateLimiter()
    const app = await start(createAskHandler({
      clientFactory: () => fakeClient(JSON.stringify({ say: 'Grounded reply', show: [] })),
      limiter
    }))
    servers.push(app.server)

    for (let i = 0; i < 10; i++) {
      expect((await app.request('POST', JSON.stringify({ question: 'What do you build?', sessionId: 'limited' }))).status).toBe(200)
    }
    const response = await app.request('POST', JSON.stringify({ question: 'What do you build?', sessionId: 'rotated-session' }))
    expect(response.status).toBe(429)
    expect(response.body).toEqual({ error: 'Too many requests. Please slow down.' })
  })

  it('returns 502 for a Groq provider error without exposing details', async () => {
    process.env.GROQ_API_KEY = 'test-key'
    const client = {
      responses: {
        create: vi.fn().mockRejectedValue(new Error('upstream unavailable'))
      }
    } as unknown as OpenAIClient
    const app = await start(createAskHandler({ clientFactory: () => client }))
    servers.push(app.server)

    const response = await app.request('POST', JSON.stringify({ question: 'What do you build?' }))
    expect(response.status).toBe(502)
    expect(response.body).toEqual({ error: 'AI service unavailable' })
  })
})
