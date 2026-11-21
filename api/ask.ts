import OpenAI from 'openai'

export type OpenAIClient = OpenAI
import type { IncomingMessage, ServerResponse } from 'node:http'

export const config = { api: { bodyParser: { sizeLimit: '64kb' } } }
import {
  AskError,
  RateLimiter,
  askQuestion,
  type AskRequest
} from '../server/ask-service.js'
import { CostDashboard } from '../server/cost.js'

const MAX_BODY_BYTES = 64 * 1024

export interface AskHandlerDependencies {
  clientFactory?: (apiKey: string) => OpenAI
  limiter?: RateLimiter
  cost?: CostDashboard
}

interface ParsedBody {
  question?: unknown
  history?: unknown
  sessionId?: unknown
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(payload))
}

function getClientIp(req: IncomingMessage): string | undefined {
  const forwarded = req.headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return value?.split(',')[0]?.trim() || req.socket.remoteAddress
}

async function readJson(req: IncomingMessage): Promise<ParsedBody> {
  // Vercel's Node function body parser may already have consumed the stream.
  // Use its parsed body when present; retain stream parsing for local tests.
  let parsedBody: unknown

  try {
    parsedBody = (req as IncomingMessage & { body?: unknown }).body
  } catch {
    throw new AskError(400, 'invalid JSON body')
  }

  if (parsedBody !== undefined) {
    const serialized = JSON.stringify(parsedBody)

    if (Buffer.byteLength(serialized ?? '') > MAX_BODY_BYTES) {
      throw new AskError(413, 'request body is too large')
    }

    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      throw new AskError(400, 'JSON body must be an object')
    }

    return parsedBody as ParsedBody
  }

  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.length
    if (size > MAX_BODY_BYTES) {
      throw new AskError(413, 'request body is too large')
    }
    chunks.push(bytes)
  }

  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) throw new AskError(400, 'invalid JSON body')

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new AskError(400, 'JSON body must be an object')
    }
    return parsed as ParsedBody
  } catch (error) {
    if (error instanceof AskError) throw error
    throw new AskError(400, 'invalid JSON body')
  }
}

/**
 * Vercel-compatible Node.js Function handler for POST /api/ask.
 * The API key is read only here, from the server runtime environment.
 */
export function createAskHandler(deps: AskHandlerDependencies = {}) {
  const limiter = deps.limiter ?? new RateLimiter()
  const cost = deps.cost ?? new CostDashboard()
  // Explicit key injection prevents SDK credential fallbacks (such as a local
  // profile) from making a production function appear configured.
  const clientFactory = deps.clientFactory ?? ((apiKey: string) =>
    new OpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' }))

  return async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== 'POST') {
      res.setHeader('allow', 'POST')
      sendJson(res, 405, { error: 'method not allowed' })
      return
    }

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      sendJson(res, 503, { error: 'backend not configured' })
      return
    }

    try {
      const body = await readJson(req)
      const result = await askQuestion(
        {
          question: body.question as AskRequest['question'],
          history: body.history as AskRequest['history'],
          sessionId: body.sessionId as AskRequest['sessionId']
        },
        {
          client: clientFactory(apiKey),
          limiter,
          cost,
          ip: getClientIp(req)
        }
      )
      sendJson(res, 200, result.reply)
    } catch (error) {
      if (error instanceof AskError) {
        // Validation and rate-limit messages are safe for callers; upstream
        // provider details are not.
        const message = error.status >= 500 ? 'AI service unavailable' : error.message
        sendJson(res, error.status, { error: message })
        return
      }
      sendJson(res, 500, { error: 'internal error' })
    }
  }
}

export default createAskHandler()
