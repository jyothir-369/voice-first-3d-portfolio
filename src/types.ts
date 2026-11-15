// Type definitions for the voice portfolio application

export type AppState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'intro'

export interface FaqEntry {
  id: string
  question: string
  keywords: string[]
  answer: {
    spoken: string
    caption: string
    objects: string[]
    followUp: string
  }
}

export type IntentType =
  | 'stop'
  | 'repeat'
  | 'yes'
  | 'no'
  | 'greeting'
  | 'thanks'
  | 'help'
  | 'refusal'
  | 'knowledge'
  | 'unknown'

export interface IntentResult {
  intent: IntentType
  response: ResponseData
  faqId?: string
  confidence: number
  suggestions?: string[]
  objects?: string[]
  followUp?: string
}

export interface TopicData {
  k: string // keywords
  s: string // spoken text
  c?: string // caption text (defaults to spoken if not provided)
  next: number | null // next topic index
  q: string // follow-up question
}

export interface ResponseData {
  s: string // spoken text
  c: string // caption text
}

export interface VoiceSettings {
  voiceIndex: number
  rate: number
  captionsEnabled: boolean
  handsFreeEnabled: boolean
}

export interface CueRule {
  pattern: RegExp
  objectType: string
  label: string
}

import * as THREE from 'three'

export interface StageObject {
  h: THREE.Group // hierarchy (root group)
  u: UpdateFunction // update function
  d?: () => void // dispose function
  born: number // timestamp when spawned
  die: number // timestamp when marked for removal (0 = alive)
  slot: number // position slot (0, 1, or 2)
}

export type UpdateFunction = (_time: number, _amplitude: number, _age: number) => void

export interface ObjectBuilder {
  g: THREE.Group
  u: UpdateFunction
  d?: () => void // dispose function
}

export type BuilderFunction = () => ObjectBuilder
