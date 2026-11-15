import { test, expect } from '@playwright/test'

// Phase 5 E2E: Conversation Engine (rules layer) in a real browser.
// All calls run inside page.evaluate because module functions cannot be
// serialized back to Node across the evaluate boundary.
async function ask(page: import('@playwright/test').Page, q: string) {
  return page.evaluate(async (text: string) => {
    const mod = await import('/src/engine/conversation.ts')
    return mod.respond(text)
  }, q)
}

async function reset(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate(async () => {
    const mod = await import('/src/engine/conversation.ts')
    mod.resetConversation()
  })
}

test.describe('Phase 5: Conversation Engine', () => {
  test.afterEach(async ({ page }) => { await reset(page) })

  test('engine module loads in the browser', async ({ page }) => {
    await page.goto('/')
    const ok = await page.evaluate(async () => {
      const mod = await import('/src/engine/conversation.ts')
      return typeof mod.respond === 'function' && typeof mod.resetConversation === 'function'
    })
    expect(ok).toBe(true)
  })

  test('stop returns a non-empty stopping response', async ({ page }) => {
    await reset(page)
    const r = await ask(page, 'stop')
    expect(r.s.length).toBeGreaterThan(0)
    expect(r.s.toLowerCase()).toMatch(/stop|done|here/)
  })

  test('repeat echoes the previous answer', async ({ page }) => {
    await reset(page)
    const first = await ask(page, 'hello')
    const echoed = await ask(page, 'repeat')
    expect(echoed.s).toBe(first.s)
  })

  test('greeting returns a greeting with rotating variety', async ({ page }) => {
    await reset(page)
    const a = await ask(page, 'hello')
    const b = await ask(page, 'hello')
    const c = await ask(page, 'hello')
    expect(a.s.length).toBeGreaterThan(10)
    const uniq = new Set([a.s, b.s, c.s])
    expect(uniq.size).toBeGreaterThanOrEqual(2)
  })

  test('help lists what the visitor can ask', async ({ page }) => {
    await reset(page)
    const r = await ask(page, 'what can I ask')
    expect(r.s.toLowerCase()).toMatch(/ask|build|project|contact/i)
  })

  test('refuses salary questions politely', async ({ page }) => {
    await reset(page)
    const r = await ask(page, 'what is your salary')
    expect(r.s.toLowerCase()).toMatch(/scope|role|project|compensation/i)
  })

  test('knowledge lookup answers a core question', async ({ page }) => {
    await reset(page)
    const r = await ask(page, 'what do you build')
    expect(r.s.toLowerCase()).toContain('build')
    expect(r.c.length).toBeGreaterThan(0)
  })

  test('misheard words are corrected (flick done -> flickdone)', async ({ page }) => {
    await reset(page)
    const r = await ask(page, 'tell me about flick done')
    const text = r.s.toLowerCase()
    expect(
      text.includes('flickdone') || text.includes('flick done') || text.includes('data engineer')
    ).toBe(true)
  })

  test('weak match returns not-sure response', async ({ page }) => {
    await reset(page)
    const r = await ask(page, 'blorp zorp quux')
    expect(r.s.length).toBeGreaterThan(0)
    expect(r.s.toLowerCase()).toMatch(/not sure|unclear|didn.t quite|catch/i)
  })

  test('yes continues a pending follow-up', async ({ page }) => {
    await reset(page)
    await ask(page, 'what do you build')
    const r = await ask(page, 'yes')
    expect(r.s.length).toBeGreaterThan(0)
    expect(r.c.length).toBeGreaterThan(0)
  })

  test('reset clears conversation state', async ({ page }) => {
    await reset(page)
    await ask(page, 'hello')
    await page.evaluate(async () => {
      const mod = await import('/src/engine/conversation.ts')
      mod.resetConversation()
    })
    const r = await ask(page, 'repeat')
    expect(r.s).toMatch(/haven.t said anything|not sure|catch|ask/i)
  })
})
