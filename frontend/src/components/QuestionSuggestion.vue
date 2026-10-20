<script setup>
import { computed, ref } from 'vue'
import { ArrowRight, CheckCircle2, Clock3, FilePlus2, Info, Plus, Send } from 'lucide-vue-next'
import QuestionEditorForm from './QuestionEditorForm.vue'
import { friendlyDate, previewText } from '../data/questionManagement.js'
const props = defineProps({ suggestions: { type: Array, required: true }, knownQuestions: { type: Array, required: true } })
const emit = defineEmits(['submit', 'cancel'])
const confirmed = ref(false)
const latest = ref(null)
const mySuggestions = computed(() => [...props.suggestions].filter(s => s.submittedBy === 'Demo Student').reverse())
function showHistory() { confirmed.value = false; window.setTimeout(() => document.getElementById('qm-suggestion-history')?.scrollIntoView({ behavior: 'smooth' }), 0) }
function save(form) { emit('submit', form); latest.value = form.question; confirmed.value = true }
</script>
<template>
  <section class="page-header"><div><p class="eyebrow">COMMUNITY / WRITING QUESTIONS</p><h1>Suggest a Question</h1><p class="page-subtitle">Found a useful IELTS Writing topic? Send it to the review team for consideration.</p></div><span class="mode-tag"><span class="mode-dot"/>Learner workspace</span></section>
  <div class="qm-page qm-narrow">
    <div v-if="confirmed" class="qm-confirmation" role="status"><CheckCircle2 :size="36"/><div><h2>Suggestion received</h2><p>We've saved your proposed question as <strong>Pending Review</strong> in this browser demo. It isn't published in the question bank.</p><div class="qm-confirm-actions"><button class="btn btn-primary" @click="confirmed = false"><Plus :size="16"/>Suggest another question</button><button class="btn btn-outline" @click="showHistory">View suggestions <ArrowRight :size="15"/></button></div></div></div>
    <QuestionEditorForm v-else mode="suggest" :known-questions="knownQuestions" @save="save" @cancel="emit('cancel')" />
    <section class="qm-panel qm-history-panel" id="qm-suggestion-history"><div class="qm-panel-title"><div><h2>My suggestions</h2><p>Track the review status of questions you've proposed in this demo.</p></div><span class="qm-count-label">{{ mySuggestions.length }} total</span></div><div v-if="mySuggestions.length" class="qm-suggestion-history"><div v-for="item in mySuggestions" :key="item.id" class="qm-history-row"><div class="qm-history-icon"><FilePlus2 :size="17"/></div><div class="qm-history-text"><strong>Task {{ item.task }} · {{ item.topic }} <span v-if="item.isSample" class="qm-sample-inline">Sample</span></strong><span>{{ previewText(item.question, 135) }}</span><small>{{ friendlyDate(item.submittedAt) }} <span v-if="item.status === 'rejected' && item.reason">· Reason: {{ item.reason }}</span></small></div><span class="qm-status" :class="`qm-status-${item.status}`">{{ item.status === 'pending' ? 'Pending Review' : item.status === 'approved' ? 'Approved' : 'Rejected' }}</span></div></div><div v-else class="qm-empty-mini"><Clock3 :size="22"/><span>No suggestions submitted yet.</span></div></section>
    <div class="qm-demo-note"><Info :size="16"/>Local UI prototype: suggestions and reviews are not sent to real administrators.</div>
  </div>
</template>
