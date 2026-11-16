// HTTP entrypoint for /api/ask (Phase 6).
// Framework-free Request/Response shape so the same module runs on
// Vercel, Netlify Functions, Cloudflare Pages Functions, and Node.
import { askQuestion, AskError, type AskRequest } from './ask'

interface Env {
  ANTHROPIC_API_KEY?: string
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers }
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405)
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'backend not configured' }, 503)
    }
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return json({ error: 'invalid JSON body' }, 400)
    }
    const { question, history, sessionId } = (body ?? {}) as {
      question?: unknown
      history?: unknown
      sessionId?: unknown
    }
    try {
      const result = await askQuestion(
        {
          question: question as AskRequest['question'],
          history: history as AskRequest['history'],
          sessionId: sessionId as AskRequest['sessionId']
        },
        { ip: request.headers.get('x-forwarded-for') ?? undefined }
      )
      return json(result.reply)
    } catch (err) {
      if (err instanceof AskError) return json({ error: err.message }, err.status)
      return json({ error: 'internal error' }, 500)
    }
  }
}
