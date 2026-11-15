#!/usr/bin/env node
// Build-time schema validator for content/faq.json
// Exits with code 1 if any required field is missing, empty, or placeholder.
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const faqPath = resolve(__dirname, '../content/faq.json')

let faqData
try {
  faqData = JSON.parse(readFileSync(faqPath, 'utf-8'))
} catch (err) {
  console.error(`Cannot read ${faqPath}:`, err)
  process.exit(1)
}

const REQUIRED_ENTRY_FIELDS = ['id', 'question', 'keywords', 'answer']
const REQUIRED_ANSWER_FIELDS = ['spoken', 'caption', 'objects', 'followUp']
const PLACEHOLDERS = ['NEEDS INPUT', 'TBD', 'TODO', 'PLACEHOLDER']

const ALLOWED_OBJECT_KEYS = [
  'agents', 'clock', 'plant', 'ledger', 'notes', 'model', 'tests', 'bars',
  'tower', 'rocket', 'team', 'mail', 'person', 'voice', 'hub', 'phone'
]

let hasErrors = false
const questions = faqData['coreQuestions'] ?? []

if (!Array.isArray(questions) || questions.length === 0) {
  console.error('faq.json: coreQuestions must be a non-empty array')
  process.exit(1)
}

function fail(msg) {
  console.error(`faq.json: ${msg}`)
  hasErrors = true
}

function isBlank(v) {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
}

function containsPlaceholder(v) {
  return typeof v === 'string' && PLACEHOLDERS.some((p) => v.toUpperCase().includes(p))
}

for (const entry of questions) {
  const id = entry['id'] ?? '(unknown)'

  for (const field of REQUIRED_ENTRY_FIELDS) {
    if (isBlank(entry[field])) {
      fail(`Missing required field '${field}' in entry id=${id}`)
    }
  }

  if (typeof entry['id'] !== 'string' || entry['id'].trim() === '') {
    fail(`'id' must be a non-empty string`)
  }
  if (typeof entry['question'] !== 'string' || entry['question'].trim() === '') {
    fail(`'question' must be a non-empty string in entry id=${id}`)
  }
  if (containsPlaceholder(entry['question'])) {
    fail(`'question' looks like a placeholder in entry id=${id}`)
  }
  if (!Array.isArray(entry['keywords']) || entry['keywords'].length === 0) {
    fail(`'keywords' must be a non-empty array in entry id=${id}`)
  } else if (!entry['keywords'].every((k) => typeof k === 'string' && k.trim() !== '')) {
    fail(`'keywords' must contain only non-empty strings in entry id=${id}`)
  }

  const answer = entry['answer']
  if (!answer || typeof answer !== 'object') {
    fail(`'answer' object missing in entry id=${id}`)
    continue
  }
  for (const field of REQUIRED_ANSWER_FIELDS) {
    if (field === 'followUp') {
      // followUp may be an empty string when no follow-up exists
      if (answer[field] === undefined || answer[field] === null) {
        fail(`Missing answer.${field} in entry id=${id}`)
      }
    } else if (isBlank(answer[field])) {
      fail(`Missing answer.${field} in entry id=${id}`)
    }
  }
  if (containsPlaceholder(answer['spoken'])) {
    fail(`answer.spoken looks like a placeholder in entry id=${id}`)
  }
  if (containsPlaceholder(answer['caption'])) {
    fail(`answer.caption looks like a placeholder in entry id=${id}`)
  }
  if (typeof answer['spoken'] === 'string' && answer['spoken'].trim().length < 10) {
    fail(`answer.spoken too short in entry id=${id}`)
  }
  if (typeof answer['caption'] === 'string' && answer['caption'].trim().length < 10) {
    fail(`answer.caption too short in entry id=${id}`)
  }
  if (typeof answer['followUp'] !== 'string') {
    fail(`answer.followUp must be a string (may be empty) in entry id=${id}`)
  }
  if (!Array.isArray(answer['objects'])) {
    fail(`answer.objects must be an array in entry id=${id}`)
  } else {
    for (const obj of answer['objects']) {
      if (!ALLOWED_OBJECT_KEYS.includes(obj)) {
        fail(`answer.objects contains unknown object key '${obj}' in entry id=${id}`)
      }
    }
  }
}

if (hasErrors) {
  console.error('\nContent validation FAILED')
  process.exit(1)
} else {
  console.log(`Content validation PASSED — ${questions.length} FAQ entries valid.`)
}
