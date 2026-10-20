import { questionBank } from './questions.js'

// Browser-only fixtures; no approved IELTS items or server-side moderation implied.
export function seedManagedQuestions() {
  return questionBank.map((q, index) => ({
    ...q,
    source: 'Sample question',
    status: 'active',
    visualNotes: '',
    createdAt: new Date(Date.now() - (index + 4) * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - (index + 4) * 86400000).toISOString(),
    suggestionId: null,
  }))
}

export function normaliseQuestion(text = '') {
  return String(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
}

function similarity(a, b) {
  const one = new Set(normaliseQuestion(a).split(' ').filter(word => word.length > 2))
  const two = new Set(normaliseQuestion(b).split(' ').filter(word => word.length > 2))
  if (!one.size || !two.size) return 0
  const intersection = [...one].filter(word => two.has(word)).length
  return intersection / (one.size + two.size - intersection)
}

export function possibleDuplicates(question, task, items, ignoreId = null) {
  const a = normaliseQuestion(question)
  if (a.length < 20) return []
  return items.filter(item => item.id !== ignoreId && Number(item.task) === Number(task))
    .map(item => ({ ...item, similarity: similarity(question, item.question), exact: normaliseQuestion(item.question) === a }))
    .filter(item => item.exact || item.similarity >= 0.68)
    .sort((left, right) => Number(right.exact) - Number(left.exact) || right.similarity - left.similarity)
    .slice(0, 3)
}

export const friendlyDate = iso => {
  if (!iso || Number.isNaN(Date.parse(iso))) return '—'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export const previewText = (value, max = 125) => String(value || '').length > max ? `${String(value).slice(0, max).trimEnd()}…` : String(value || '')
