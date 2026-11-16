import { describe, it, expect, beforeEach } from 'vitest'
import { CostDashboard, estimateCost, PRICES } from '../../../api/cost'

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
    dash.record('claude-haiku-5-5', 1000, 2000)
    const s = dash.snapshot()
    expect(s.requests).toBe(1)
    expect(s.inputTokens).toBe(1000)
    expect(s.outputTokens).toBe(2000)
    expect(s.estimatedUsd).toBeCloseTo((1000 * 0.1 + 2000 * 0.5) / 1e6, 10)
  })

  it('alerts when the daily threshold is crossed', () => {
    // Haiku: $0.10 in / $0.50 out per MTok. Drive spend past $1.00.
    let crossed = false
    for (let i = 0; i < 10; i++) crossed = dash.record('claude-sonnet-5-5', 1_000_000, 1_000_000) || crossed
    expect(crossed).toBe(true)
    expect(dash.getAlerts().length).toBeGreaterThan(0)
  })

  it('rolls over at a new day', () => {
    dash.record('claude-haiku-5-5', 1000, 1000)
    clock = Date.parse('2026-11-17T09:00:00Z')
    const s = dash.snapshot()
    expect(s.requests).toBe(0)
    expect(s.estimatedUsd).toBe(0)
  })

  it('falls back to Haiku pricing for unknown models', () => {
    dash.record('claude-unknown', 1_000_000, 0)
    expect(dash.snapshot().estimatedUsd).toBeCloseTo(0.1, 10)
  })

  it('estimateCost matches ledger math', () => {
    expect(estimateCost('claude-haiku-5-5', 500_000, 100_000)).toBeCloseTo((0.5 * 0.1 + 0.1 * 0.5) / 1, 10)
  })

  it('prices both model tiers', () => {
    expect(PRICES['claude-haiku-5-5'].inputPerMTok).toBe(0.1)
    expect(PRICES['claude-sonnet-5-5'].outputPerMTok).toBe(10.0)
  })
})
