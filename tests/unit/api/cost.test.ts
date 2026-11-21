import { describe, it, expect, beforeEach } from 'vitest'
import { CostDashboard, estimateCost, PRICES } from '../../../server/cost'

describe('CostDashboard', () => {
  let clock: number
  let dash: CostDashboard
  beforeEach(() => {
    clock = Date.parse('2026-11-16T09:00:00Z')
    dash = new CostDashboard(1.0, () => clock)
  })

  it('starts empty', () => {
    const s = dash.snapshot()
    expect(s.requests).toBe(0)
    expect(s.estimatedUsd).toBe(0)
  })

  it('accumulates requests and estimated spend', () => {
    dash.record('openai/gpt-oss-120b', 1000, 2000)
    const s = dash.snapshot()
    expect(s.requests).toBe(1)
    expect(s.inputTokens).toBe(1000)
    expect(s.outputTokens).toBe(2000)
    expect(s.estimatedUsd).toBeCloseTo((1000 * 0.15 + 2000 * 0.60) / 1e6, 10)
  })

  it('alerts when the daily threshold is crossed', () => {
    // Grok 4.7: $2 in / $6 out per MTok. One million of each passes $1.00.
    let crossed = false
    for (let i = 0; i < 2; i++) crossed = dash.record('openai/gpt-oss-120b', 1_000_000, 1_000_000) || crossed
    expect(crossed).toBe(true)
    expect(dash.getAlerts().length).toBeGreaterThan(0)
  })

  it('rolls over at a new day', () => {
    dash.record('openai/gpt-oss-120b', 1000, 1000)
    clock = Date.parse('2026-11-17T09:00:00Z')
    const s = dash.snapshot()
    expect(s.requests).toBe(0)
    expect(s.estimatedUsd).toBe(0)
  })

  it('falls back to Groq pricing for unknown models', () => {
    dash.record('grok-unknown', 1_000_000, 0)
    expect(dash.snapshot().estimatedUsd).toBeCloseTo(0.15, 10)
  })

  it('estimateCost matches ledger math', () => {
    expect(estimateCost('openai/gpt-oss-120b', 500_000, 100_000)).toBeCloseTo(0.5 * 0.15 + 0.1 * 0.60, 10)
  })

  it('prices the Groq model tier', () => {
    expect(PRICES['openai/gpt-oss-120b'].inputPerMTok).toBe(0.15)
    expect(PRICES['openai/gpt-oss-120b'].outputPerMTok).toBe(0.60)
  })
})
