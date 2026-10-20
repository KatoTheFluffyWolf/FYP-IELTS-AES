<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { AlertTriangle, ArrowLeft, Check, FileImage, ImagePlus, Info, Save, Sparkles, Upload, X } from 'lucide-vue-next'
import QuestionChart from './QuestionChart.vue'
import { possibleDuplicates, previewText } from '../data/questionManagement.js'

const props = defineProps({
  initial: { type: Object, default: null },
  knownQuestions: { type: Array, default: () => [] },
  mode: { type: String, default: 'suggest' }, // suggest | add | edit
})
const emit = defineEmits(['save', 'cancel'])
const form = reactive({ task: 1, topic: 'Education', question: '', source: '', status: 'draft', visual: null, visualNotes: '' })
const errors = reactive({ question: '', visual: '', file: '' })
const uploading = ref(false)
const topics = ['Education', 'Environment', 'Transport', 'Technology', 'Health', 'Society', 'Work', 'Culture', 'Other']
function reset() {
  const q = props.initial || {}
  form.task = q.task || 1
  form.topic = q.topic || 'Education'
  form.question = q.question || ''
  form.source = q.source || ''
  form.status = q.status || 'draft'
  form.visual = q.visual || null
  form.visualNotes = q.visualNotes || ''
  errors.question = ''; errors.visual = ''; errors.file = ''
}
watch(() => props.initial, reset, { immediate: true })
const matches = computed(() => possibleDuplicates(form.question, form.task, props.knownQuestions, props.initial?.id))
const exactDuplicate = computed(() => matches.value.some(q => q.exact))
const isSuggestion = computed(() => props.mode === 'suggest')
const imageIsData = computed(() => typeof form.visual === 'string' && form.visual.startsWith('data:image/'))
const visualIsChart = computed(() => form.visual && !imageIsData.value)
const isEdit = computed(() => props.mode === 'edit')
async function uploadVisual(event) {
  const file = event.target.files?.[0]
  if (!file) return
  errors.file = ''
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    errors.file = 'Use a PNG, JPG or WebP image of at most 5 MB.'
    event.target.value = ''
    return
  }
  uploading.value = true
  try {
    const img = new Image()
    const url = URL.createObjectURL(file)
    try {
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url })
      const ratio = Math.min(1, 1500 / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.width * ratio)); canvas.height = Math.max(1, Math.round(img.height * ratio))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Image preview cannot be created.')
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
      const encoded = canvas.toDataURL('image/jpeg', 0.76)
      if (encoded.length > 1300000) throw new Error('This image is too large after optimization. Try a smaller image.')
      form.visual = encoded
      errors.visual = ''
    } finally { URL.revokeObjectURL(url) }
  } catch (error) { errors.file = error?.message || 'Could not read the image.' }
  uploading.value = false
  event.target.value = ''
}
function submit() {
  errors.question = ''; errors.visual = ''; errors.file = ''
  if (!form.question.trim()) errors.question = 'Please enter the question.'
  else if (form.question.trim().length < 20) errors.question = 'Enter at least 20 characters for a useful IELTS writing question.'
  else if (form.question.length > 3000) errors.question = 'Limit question text to 3,000 characters.'
  if (form.task === 1 && !form.visual && !form.visualNotes.trim()) errors.visual = 'For Task 1, include a visual or explain the visual material required.'
  if (!isSuggestion.value && form.status === 'active' && form.task === 1 && !form.visual) errors.visual = 'Publish a Task 1 question only after uploading a visual.'
  if (exactDuplicate.value) errors.question = 'An identical question is already in the bank. Revise it before submitting.'
  if (errors.question || errors.visual) return
  emit('save', { task: form.task, topic: form.topic, question: form.question.trim(), source: form.source.trim(), visual: form.task === 1 ? form.visual : null, visualNotes: form.task === 1 ? form.visualNotes.trim() : '', ...(isSuggestion.value ? {} : { status: form.status }) })
}
</script>

<template>
  <section class="qm-panel qm-form-shell">
    <div class="qm-panel-title"><div><h2>{{ isSuggestion ? 'Suggest a writing question' : isEdit ? 'Edit question' : 'Add new question' }}</h2><p>{{ isSuggestion ? 'Your idea goes to administrators for review, not directly into the test bank.' : 'Set the question details and decide when it should become available to learners.' }}</p></div></div>
    <form @submit.prevent="submit" novalidate>
      <div class="qm-form-grid">
        <div class="qm-form-main">
          <div class="qm-form-field"><label class="qm-label">Task type <span>*</span></label><div class="qm-segmented" role="group" aria-label="Writing task"><button type="button" :class="{ active: form.task === 1 }" @click="form.task = 1">Task 1</button><button type="button" :class="{ active: form.task === 2 }" @click="form.task = 2">Task 2</button></div></div>
          <div class="qm-form-field"><label class="qm-label" for="qm-text">Question text <span>*</span></label><textarea id="qm-text" v-model="form.question" rows="7" maxlength="3000" class="qm-control qm-textarea" :aria-invalid="!!errors.question" placeholder="Enter the full IELTS Writing question, including its instructions…"/><div class="qm-field-bottom"><span v-if="errors.question" class="qm-error"><AlertTriangle :size="13"/>{{ errors.question }}</span><span v-else class="qm-hint">Write the exact instructions learners will see.</span><span>{{ form.question.length }}/3000</span></div></div>
          <div v-if="matches.length" class="qm-duplicate" role="status"><AlertTriangle :size="18"/><div><strong>{{ exactDuplicate ? 'Identical question detected' : 'Potential duplicate found' }}</strong><p>Review similar entries before {{ isSuggestion ? 'suggesting' : 'saving' }} this question. This is only a text-similarity check.</p><ul><li v-for="q in matches" :key="q.id">{{ previewText(q.question, 112) }}</li></ul></div></div>
          <div class="qm-field-pair"><div class="qm-form-field"><label class="qm-label" for="qm-topic">Topic</label><select id="qm-topic" v-model="form.topic" class="qm-control"><option v-for="topic in topics" :key="topic">{{ topic }}</option></select></div><div class="qm-form-field"><label class="qm-label" for="qm-source">Source (optional)</label><input id="qm-source" v-model="form.source" class="qm-control" maxlength="120" placeholder="e.g. Cambridge IELTS or your own idea" /></div></div>
          <div v-if="!isSuggestion" class="qm-form-field"><label class="qm-label" for="qm-status">Publication status</label><select id="qm-status" v-model="form.status" class="qm-control"><option value="draft">Draft · not available to learners</option><option value="active">Active · available in the question bank</option><option v-if="isEdit && initial?.status === 'archived'" value="archived">Archived · not available</option></select><p class="qm-hint">Existing historical submissions keep their question snapshot if you edit or archive this entry.</p></div>
        </div>
        <div class="qm-form-aside"><div class="qm-upload-panel" v-if="form.task === 1"><div class="qm-panel-title qm-upload-title"><div><h3>Task 1 visual</h3><p>Charts, diagrams, maps or tables</p></div></div><label class="qm-dropzone"><ImagePlus :size="28"/><strong>{{ uploading ? 'Processing image…' : form.visual ? 'Replace image' : 'Choose an image' }}</strong><small>PNG, JPG, WebP · max 5 MB</small><input type="file" accept="image/png,image/jpeg,image/webp" :disabled="uploading" @change="uploadVisual" /></label><div v-if="errors.file" class="qm-error"><AlertTriangle :size="14"/>{{ errors.file }}</div><div v-if="form.visual" class="qm-image-preview"><img v-if="imageIsData" :src="form.visual" alt="Uploaded Task 1 visual preview" /><QuestionChart v-else-if="visualIsChart" :variant="form.visual"/><button type="button" class="qm-inline-link" @click="form.visual = null"><X :size="14"/>Remove visual</button></div><div class="qm-form-field"><label class="qm-label" for="qm-visual-notes">Visual details (optional)</label><textarea id="qm-visual-notes" v-model="form.visualNotes" class="qm-control" rows="3" maxlength="500" placeholder="Describe the required chart or image if you do not have it yet…" /></div><span v-if="errors.visual" class="qm-error"><AlertTriangle :size="14"/>{{ errors.visual }}</span></div><div v-else class="qm-hint-panel"><FileImage :size="22"/><strong>No image required for Task 2</strong><p>Task 2 questions consist of writing instructions and a topic. Images are reserved for Task 1.</p></div><div class="qm-hint-panel"><Info :size="19"/><strong>Before you continue</strong><p>{{ isSuggestion ? 'The question will be marked Pending Review. An administrator must approve it before it can be included in the standardized bank.' : 'This interface is a frontend-only demo. Data is stored in your browser, not in a live question database.' }}</p></div></div>
      </div>
      <div class="qm-form-footer"><button type="button" class="btn btn-outline" @click="emit('cancel')"><ArrowLeft :size="15"/>Cancel</button><button class="btn btn-primary" type="submit"><Save v-if="!isSuggestion" :size="16"/><Check v-else :size="16"/>{{ isSuggestion ? 'Submit suggestion' : isEdit ? 'Update question' : 'Save question' }}</button></div>
    </form>
  </section>
</template>
