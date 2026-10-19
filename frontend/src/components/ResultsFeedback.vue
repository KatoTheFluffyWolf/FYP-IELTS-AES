<script setup>
import { computed, ref } from 'vue'
import { ArrowLeft, ArrowRight, FileText, Info, MessageSquareText, RotateCcw, Sparkles, SquarePen, ZoomIn } from 'lucide-vue-next'
import QuestionChart from './QuestionChart.vue'
import ModalShell from './ModalShell.vue'
import { wordCount } from '../data/questions.js'

const props = defineProps({
  result: { type: Object, required: true },
  criteria: { type: Array, required: true },
  feedbackTab: { type: String, required: true },
  previousResult: { type: Object, default: null },
})
const emit = defineEmits(['back', 'update:feedbackTab', 'improvement', 'revise', 'previous'])
const zoomed = ref(false)
const chosen = computed(() => props.criteria.find(c => c.id === props.feedbackTab) || props.criteria[0])
const labels = ['Task', 'CC', 'LR', 'GRA']
const feedback = computed(() => ({
  task: {
    body: props.result.task === 1
      ? 'Focus on selecting the most significant visual features and reporting accurate comparisons. Build a clear overview of the main trends.'
      : 'Aim to address every part of the question and support your argument with specific examples and developed explanations.',
    tips: props.result.task === 1
      ? ['Identify the major overall trend before describing individual figures.', 'Choose comparisons that highlight meaningful differences.', 'Support key observations with accurate data from the visual.']
      : ['Support each main idea with a relevant example.', 'Make your position consistent throughout the response.', 'Develop supporting arguments rather than listing isolated points.'],
  },
  coherence: { body: 'Ideas are easier to follow when paragraphs have clear purposes and transitions reflect the logical relationship between them.', tips: ['Start paragraphs with clear central ideas.', 'Use linking expressions selectively.', 'Ensure each paragraph follows logically from the previous one.'] },
  lexical: { body: 'Precise vocabulary and natural collocations can make explanations more effective. Avoid repeating terms unnecessarily.', tips: ['Replace repeated expressions with appropriate alternatives.', 'Check collocations rather than choosing rare words.', 'Prefer accuracy and precision to unnecessary complexity.'] },
  grammar: { body: 'A mixture of accurate simple and complex sentences helps communicate ideas clearly. Review punctuation and sentence-level errors.', tips: ['Check subject–verb agreement and articles.', 'Vary sentence openings and clause structures.', 'Proofread complex sentences for clarity.'] },
})[chosen.value.id])
const visual = computed(() => props.result.visual || null)
</script>

<template>
  <div class="result-content result-content-redesign">
    <div class="demo-notice result-demo"><Info :size="17"/><div><strong>Illustrative assessment — not a real IELTS prediction</strong><span>Scores and feedback are sample interface data. Connect ModernBERT and Qwen3-14B for actual analysis.</span></div></div>
    <section class="redesign-panel submission-panel">
      <div class="panel-title-row"><div class="panel-title"><FileText :size="19"/><h2>Your Response</h2></div><div class="submission-meta"><span>{{ new Date(result.submittedAt).toLocaleString() }}</span><span class="mode-tag"><span class="mode-dot"/>{{ result.mode === 'mock' ? 'Mock Test' : 'Practice Writing' }}</span></div></div>
      <div class="response-columns">
        <div class="response-box"><h3>Question</h3><div class="response-scroll question-response"><p>{{ result.question }}</p><div v-if="visual" class="result-visual-preview"><button class="small-link" @click="zoomed = true"><ZoomIn :size="14"/>Enlarge visual</button><QuestionChart v-if="!visual.startsWith('data:')" :variant="visual"/><img v-else :src="visual" alt="Provided task question visual"/></div></div></div>
        <div class="response-box"><h3>Your essay <span>{{ wordCount(result.essay) }} words</span></h3><div class="response-scroll essay-response">{{ result.essay }}</div></div>
      </div>
    </section>

    <section class="redesign-panel assessment-panel"><div class="panel-title-row"><div class="panel-title"><FileText :size="19"/><h2>Assessment Result</h2></div><span class="subtle-caption">AI-estimated bands · Not official scores</span></div>
      <div class="assessment-values"><div class="assessment-total"><span>Overall AI-estimated band</span><strong>{{ result.scores?.overall?.toFixed(1) }}</strong></div><div v-for="(item, i) in criteria" :key="item.id" class="assessment-tiny"><span>{{ i === 0 ? (result.task === 1 ? 'TA' : 'TR') : labels[i] }}</span><strong>{{ item.score?.toFixed(1) }}</strong></div></div>
    </section>

    <section class="redesign-panel feedback-redesign"><div class="panel-title-row"><div class="panel-title"><MessageSquareText :size="19"/><h2>Feedback and Suggestions</h2></div><span class="ai-mini-label"><Sparkles :size="14"/>Sample feedback</span></div>
      <div class="redesign-tabs" role="tablist" aria-label="Feedback criterion"><button v-for="(item, i) in criteria" :key="item.id" role="tab" :aria-selected="feedbackTab === item.id" :class="{ active: feedbackTab === item.id }" @click="emit('update:feedbackTab', item.id)">{{ item.name }}</button></div>
      <div class="redesign-feedback-summary"><div class="feedback-band"><span>Estimated score</span><strong>{{ chosen.score?.toFixed(1) }}</strong></div><div class="feedback-explanation"><strong>{{ chosen.name }}</strong><p>{{ feedback.body }}</p></div></div>
      <div class="feedback-tips"><strong>Suggestions for Improvement</strong><ul><li v-for="tip in feedback.tips" :key="tip">{{ tip }}</li></ul></div><p class="sample-caption">These are generic, illustrative suggestions. No essay-specific model analysis has been performed.</p>
    </section>

    <div class="redesign-actions"><button class="btn btn-outline" @click="emit('back')"><ArrowLeft :size="16"/>Back to Results</button><div v-if="result.mode === 'practice'" class="redesign-primary-actions"><button class="btn btn-outline red-outline" @click="emit('improvement')"><FileText :size="16"/>View Higher-Band Example</button><button class="btn btn-primary" @click="emit('revise')"><SquarePen :size="16"/>Revise This Essay</button></div></div>
    <div v-if="previousResult" class="previous-note"><RotateCcw :size="16"/>Revision {{ result.revisionNumber }} of your practice essay. <button class="small-link" @click="emit('previous')">View previous version <ArrowRight :size="13"/></button></div>
  </div>
  <ModalShell v-if="zoomed" title="Question Visual" wide @close="zoomed = false"><QuestionChart v-if="visual && !visual.startsWith('data:')" :variant="visual"/><img v-else-if="visual" :src="visual" alt="Enlarged question visual" class="zoom-image"/></ModalShell>
</template>
