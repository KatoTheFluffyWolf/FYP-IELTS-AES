<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, Check, Info, Settings2, Sparkles, Target, TrendingUp, X } from 'lucide-vue-next'
import ModalShell from './ModalShell.vue'

const props = defineProps({ history: { type: Array, required: true } })
const emit = defineEmits(['open-results'])
const task = ref(1)
const period = ref('30')
const metric = ref('overall')
const previewSample = ref(false)
const targets = ref({ 1: 7, 2: 7 })
const editGoal = ref(false)
const goalDraft = ref(7)

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('ielts-aes-progress-goals-v1') || '{}')
    for (const t of [1, 2]) if (typeof saved[t] === 'number' && saved[t] >= 1 && saved[t] <= 9) targets.value[t] = saved[t]
  } catch { /* Ignore corrupted local demo preferences */ }
})
watch(targets, value => {
  try { localStorage.setItem('ielts-aes-progress-goals-v1', JSON.stringify(value)) } catch { /* Optional demo preference */ }
}, { deep: true })
const target = computed(() => targets.value[task.value])
const today = () => new Date()
function daysAgo(days) { const date = today(); date.setDate(date.getDate() - days); return date.toISOString() }
const sampleScores = [
  { days: 55, overall: 4.5, criteria: [4.0, 5, 4.5, 4.5] },
  { days: 47, overall: 5, criteria: [4.5, 5.5, 5, 5] },
  { days: 39, overall: 5, criteria: [4.5, 5.5, 5, 5] },
  { days: 33, overall: 5.5, criteria: [5, 6, 5.5, 5.5] },
  { days: 27, overall: 5, criteria: [4.5, 5.5, 5, 5] },
  { days: 23, overall: 5.5, criteria: [5, 6, 6, 5.5] },
  { days: 20, overall: 6, criteria: [5.5, 6.5, 6, 6] },
  { days: 16, overall: 5.5, criteria: [5, 6, 5.5, 5.5] },
  { days: 12, overall: 6.5, criteria: [5.5, 7, 6.5, 6] },
  { days: 9, overall: 6, criteria: [5.5, 6.5, 6, 6] },
  { days: 5, overall: 7, criteria: [6, 7.5, 7.5, 6.5] },
  { days: 1, overall: 6.5, criteria: [5.5, 7, 7, 6.5] },
]
const scoredHistory = computed(() => props.history
  .filter(item => item.task === task.value && item.status === 'demo' && item.scores?.criteria?.length === 4)
  .map(item => ({ date: item.submittedAt, overall: Number(item.scores.overall), criteria: item.scores.criteria.map(Number) }))
  .filter(item => !Number.isNaN(Date.parse(item.date)) && Number.isFinite(item.overall))
  .sort((a, b) => new Date(a.date) - new Date(b.date)))
const hasSample = computed(() => scoredHistory.value.length === 0 && previewSample.value)
const allPoints = computed(() => hasSample.value
  ? sampleScores.map(s => ({ date: daysAgo(s.days), overall: Math.max(1, Math.min(9, s.overall + (task.value === 2 ? 0.25 : 0))), criteria: s.criteria.map(v => Math.min(9, v + (task.value === 2 ? 0.25 : 0))) }))
  : scoredHistory.value)
const periodDays = computed(() => period.value === 'all' ? Infinity : Number(period.value))
const shown = computed(() => allPoints.value.filter(p => periodDays.value === Infinity || new Date(p.date).getTime() >= Date.now() - periodDays.value * 86400000))
function average(nums) { return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null }
const avg = computed(() => average(shown.value.map(p => p.overall)))
const scoreNames = computed(() => [
  { abbr: task.value === 1 ? 'TA' : 'TR', title: task.value === 1 ? 'Task Achievement' : 'Task Response' },
  { abbr: 'CC', title: 'Coherence & Cohesion' },
  { abbr: 'LR', title: 'Lexical Resource' },
  { abbr: 'GRA', title: 'Grammar Range & Accuracy' },
])
const previousPoints = computed(() => {
  const window = periodDays.value
  if (window === Infinity) return []
  const now = Date.now()
  return allPoints.value.filter(p => {
    const t = new Date(p.date).getTime()
    return t < now - window * 86400000 && t >= now - window * 2 * 86400000
  })
})
const overallDelta = computed(() => {
  const old = average(previousPoints.value.map(p => p.overall))
  return avg.value != null && old != null ? avg.value - old : null
})
const cards = computed(() => scoreNames.value.map((item, index) => {
  const val = average(shown.value.map(p => p.criteria[index]).filter(Number.isFinite))
  const prev = average(previousPoints.value.map(p => p.criteria[index]).filter(Number.isFinite))
  return { ...item, value: val, delta: val != null && prev != null ? val - prev : null }
}))
const metricOptions = computed(() => [
  { key: 'overall', label: 'Overall band' },
  ...scoreNames.value.map((s, i) => ({ key: String(i), label: `${s.abbr} — ${s.title}` })),
])
const points = computed(() => shown.value.map((p, i, arr) => ({
  score: metric.value === 'overall' ? p.overall : p.criteria[Number(metric.value)],
  x: arr.length === 1 ? 375 : 58 + i * (655 / (arr.length - 1)),
  label: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  date: new Date(p.date).toLocaleDateString(),
})).map(p => ({ ...p, y: 227 - p.score * (204 / 9) })))
const path = computed(() => points.value.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '))
const targetY = computed(() => 227 - target.value * (204 / 9))
function trendText(delta) { return delta == null ? 'Not enough past data' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)} vs. prior period` }
function openGoalEditor() { goalDraft.value = target.value; editGoal.value = true }
function saveGoal() { targets.value = { ...targets.value, [task.value]: Number(goalDraft.value) }; editGoal.value = false }
const advice = computed(() => [
  { abbr: scoreNames.value[0].abbr, text: task.value === 1 ? 'Select and compare key features from the provided visual.' : 'Support your position with developed arguments and specific examples.' },
  { abbr: 'CC', text: 'Use clear topic sentences and link paragraphs logically.' },
  { abbr: 'LR', text: 'Practise precise vocabulary and avoid unnecessary repetition.' },
  { abbr: 'GRA', text: 'Review sentence accuracy and vary sentence structures.' },
])
</script>

<template>
  <section class="page-header">
    <div><p class="eyebrow">YOUR WORK / PROGRESS</p><h1>Progress Dashboard</h1><p class="page-subtitle">Track estimated performance over time and see where to focus next.</p></div>
  </section>
  <div class="progress-page">
    <div class="progress-filters">
      <div class="task-switch progress-task-switch" role="group" aria-label="Progress task">
        <button :class="{ selected: task === 1 }" @click="task = 1">Task 1</button>
        <button :class="{ selected: task === 2 }" @click="task = 2">Task 2</button>
      </div>
      <div class="range-filters" role="group" aria-label="Progress date range">
        <button v-for="range in [{ v: '7', name: 'Last 7 days' }, { v: '30', name: 'Last 30 days' }, { v: 'all', name: 'All time' }]" :key="range.v" :class="{ active: period === range.v }" @click="period = range.v">{{ range.name }}</button>
      </div>
    </div>
    <div v-if="!scoredHistory.length && !previewSample" class="preview-notice"><Info :size="17"/><span><strong>No assessments yet for Task {{ task }}.</strong> Complete a writing assessment to see real progress data in the finished system. You can also preview the intended layout with sample values.</span><button class="preview-link" @click="previewSample = true">Preview sample data</button></div>
    <div v-else-if="hasSample" class="preview-notice"><Info :size="17"/><span><strong>Sample dashboard data only.</strong> These trend values are illustrative, not your assessed performance.</span><button class="preview-link" @click="previewSample = false">Hide sample data</button></div>

    <section class="progress-panel overview-panel">
      <div class="overview-primary"><span class="metric-caption">Average AI-estimated band</span><strong>{{ avg === null ? '—' : avg.toFixed(2) }}</strong><small>Based on {{ shown.length }} {{ shown.length === 1 ? 'submission' : 'submissions' }} · {{ task === 1 ? 'Task 1' : 'Task 2' }}</small></div>
      <div class="overview-trend"><span>Change from previous {{ period === 'all' ? 'period' : `${period} days` }}</span><div :class="['overview-trend-number', overallDelta !== null && overallDelta < 0 ? 'down' : 'up']"><component :is="overallDelta !== null && overallDelta < 0 ? ArrowDownRight : ArrowUpRight" :size="22" />{{ overallDelta === null ? '—' : `${overallDelta > 0 ? '+' : ''}${overallDelta.toFixed(2)}` }}</div><small>{{ trendText(overallDelta) }}</small></div>
    </section>

    <div class="section-strip"><h2>Criterion scores <span>(averages)</span></h2></div>
    <div class="progress-criteria">
      <div v-for="card in cards" :key="card.abbr" class="progress-criterion-card">
        <strong>{{ card.abbr }}</strong><span>{{ card.title }}</span>
        <div class="criterion-value" :class="{ good: card.delta != null && card.delta > 0, bad: card.delta != null && card.delta < 0 }">{{ card.value == null ? '—' : card.value.toFixed(1) }}<component v-if="card.delta != null" :is="card.delta >= 0 ? ArrowUpRight : ArrowDownRight" :size="22" /></div>
        <small>{{ trendText(card.delta) }}</small>
      </div>
    </div>

    <section class="progress-panel progress-chart-panel">
      <div class="panel-title-row"><div class="panel-title"><BarChart3 :size="19"/><h2>Score Progress Over Time</h2></div><label class="chart-metric-label"><span class="sr-only">Score metric</span><select v-model="metric"><option v-for="m in metricOptions" :key="m.key" :value="m.key">{{ m.label }}</option></select></label></div>
      <div v-if="points.length" class="trend-chart-wrap">
        <svg class="trend-chart" viewBox="0 0 750 280" role="img" :aria-label="`Line chart of ${metricOptions.find(o => o.key === metric)?.label} across ${points.length} submissions, with target band ${target}`">
          <g v-for="tick in [0, 3, 6, 9]" :key="tick"><line :x1="58" :x2="713" :y1="227 - tick * (204 / 9)" :y2="227 - tick * (204 / 9)" stroke="#e9edf2" stroke-width="1"/><text x="42" :y="231 - tick * (204 / 9)" text-anchor="end" class="chart-axis-label">{{ tick }}</text></g>
          <line x1="58" x2="58" y1="23" y2="227" stroke="#cad3dc"/><line x1="58" x2="713" y1="227" y2="227" stroke="#cad3dc"/>
          <line x1="58" x2="713" :y1="targetY" :y2="targetY" stroke="#7891ac" stroke-dasharray="8 6" stroke-width="2"/>
          <text x="713" :y="Math.max(14, targetY - 8)" text-anchor="end" class="chart-goal-label">Target {{ target.toFixed(1) }}</text>
          <path v-if="points.length > 1" :d="path" fill="none" stroke="#c8102e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
          <g v-for="(point, i) in points" :key="i"><circle :cx="point.x" :cy="point.y" r="5" fill="#c8102e" stroke="#fff" stroke-width="2"><title>{{ point.date }}: {{ point.score.toFixed(1) }}</title></circle><text v-if="i === 0 || i === points.length - 1 || (points.length <= 8 && i % 2 === 0)" :x="point.x" y="250" text-anchor="middle" class="chart-axis-label">{{ point.label }}</text></g>
        </svg>
        <div class="chart-legend"><span><i class="legend-dot"/>{{ metric === 'overall' ? 'Estimated band' : scoreNames[Number(metric)].abbr }}</span><span><i class="legend-dash"/>Target band ({{ target.toFixed(1) }})</span></div>
      </div>
      <div v-else class="progress-empty"><CalendarDays :size="31"/><strong>No assessed submissions in this range</strong><p>Try a wider date range or submit an essay to begin tracking progress.</p></div>
    </section>

    <section class="progress-panel plan-panel">
      <div class="panel-title-row"><div class="panel-title"><Target :size="20"/><h2>Improvement Plan</h2></div><span class="ai-mini-label"><Sparkles :size="14"/>AI integration planned</span></div>
      <div class="plan-layout"><div class="plan-goal"><span>Target band</span><strong>{{ target.toFixed(1) }}</strong><button class="btn btn-outline btn-sm" @click="openGoalEditor"><Settings2 :size="15"/>Set goal</button></div><div class="plan-recommendations"><strong>Recommended focus areas</strong><p class="plan-disclaimer">{{ shown.length ? 'Illustrative study suggestions only; personalised Qwen feedback will be connected later.' : 'Complete some writing assessments to receive a meaningful, personalised improvement plan.' }}</p><ol v-if="shown.length"><li v-for="(tip, i) in advice" :key="tip.abbr"><span class="plan-index">{{ i + 1 }}</span><span>{{ tip.text }}</span><small>{{ tip.abbr }}</small></li></ol><button class="small-link" @click="emit('open-results')">Review your past results <ArrowRight :size="14"/></button></div></div>
    </section>
  </div>
  <ModalShell v-if="editGoal" title="Set your target IELTS band" @close="editGoal = false">
    <p class="small muted">Your practice goal is stored locally in this browser. It is a target, not a predicted result.</p>
    <label class="goal-form-label" for="goalBand">Target band for Task {{ task }}</label><select id="goalBand" v-model.number="goalDraft" class="goal-select"><option v-for="n in 17" :key="n" :value="(n + 1) / 2">{{ ((n + 1) / 2).toFixed(1) }}</option></select>
    <template #footer><button class="btn btn-quiet" @click="editGoal = false">Cancel</button><button class="btn btn-primary" @click="saveGoal"><Check :size="16"/>Save goal</button></template>
  </ModalShell>
</template>
