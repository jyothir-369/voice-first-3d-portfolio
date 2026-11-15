export interface ConversationMemory {
  lastFaqId: string | null
  pendingFollowUpFaqId: string | null
  recentQuestions: string[]
}

const MAX_RECENT = 3

let _memory: ConversationMemory = {
  lastFaqId: null,
  pendingFollowUpFaqId: null,
  recentQuestions: []
}

export function getMemory(): Readonly<ConversationMemory> {
  return _memory
}

export function setLastFaq(faqId: string): void {
  _memory.lastFaqId = faqId
}

export function setPendingFollowUp(faqId: string | null): void {
  _memory.pendingFollowUpFaqId = faqId
}

export function addRecentQuestion(question: string): void {
  _memory.recentQuestions = [question, ..._memory.recentQuestions].slice(0, MAX_RECENT)
}

export function resetMemory(): void {
  _memory = {
    lastFaqId: null,
    pendingFollowUpFaqId: null,
    recentQuestions: []
  }
}
