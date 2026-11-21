// Cost dashboard (plan 6.7 task 6): daily request count, estimated spend,
// and an alert threshold. Estimation uses published per-million-token prices
// for the two models the endpoint can select.

export interface ModelPrice {
  inputPerMTok: number
  outputPerMTok: number
}

export const PRICES: Record<string, ModelPrice> = {
  'openai/gpt-oss-120b': { inputPerMTok: 0.15, outputPerMTok: 0.60 }
}

export interface CostLedger {
  date: string
  requests: number
  inputTokens: number
  outputTokens: number
  estimatedUsd: number
}

export class CostDashboard {
  private ledger: CostLedger = { date: '', requests: 0, inputTokens: 0, outputTokens: 0, estimatedUsd: 0 }
  private alertThresholdUsd: number
  private alerts: string[] = []
  private now: () => number

  constructor(alertThresholdUsd = 1.0, now?: () => number) {
    this.alertThresholdUsd = alertThresholdUsd
    this.now = now ?? (() => Date.now())
  }

  private today(): string {
    return new Date(this.now()).toISOString().slice(0, 10)
  }

  private roll(): void {
    const today = this.today()
    if (this.ledger.date !== today) {
      this.ledger = { date: today, requests: 0, inputTokens: 0, outputTokens: 0, estimatedUsd: 0 }
    }
  }

  /** Record one completed request. Returns true when the alert threshold is crossed. */
  record(model: string, inputTokens: number, outputTokens: number): boolean {
    this.roll()
    const price = PRICES[model] ?? PRICES['openai/gpt-oss-120b']!
    const cost = (inputTokens / 1_000_000) * price.inputPerMTok + (outputTokens / 1_000_000) * price.outputPerMTok
    this.ledger.requests += 1
    this.ledger.inputTokens += inputTokens
    this.ledger.outputTokens += outputTokens
    this.ledger.estimatedUsd += cost
    if (this.ledger.estimatedUsd >= this.alertThresholdUsd) {
      const msg = `Daily spend $${this.ledger.estimatedUsd.toFixed(4)} crossed threshold $${this.alertThresholdUsd.toFixed(2)}`
      if (!this.alerts.includes(msg)) this.alerts.push(msg)
      return true
    }
    return false
  }

  snapshot(): CostLedger {
    this.roll()
    return { ...this.ledger }
  }

  getAlerts(): readonly string[] {
    return this.alerts
  }

  reset(): void {
    this.ledger = { date: '', requests: 0, inputTokens: 0, outputTokens: 0, estimatedUsd: 0 }
    this.alerts = []
  }
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const price = PRICES[model] ?? PRICES['openai/gpt-oss-120b']!
  return (inputTokens / 1_000_000) * price.inputPerMTok + (outputTokens / 1_000_000) * price.outputPerMTok
}
