<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { ImagePlus, Upload, ScanText, Check, AlertCircle, LoaderCircle } from 'lucide-vue-next'
import ModalShell from './ModalShell.vue'
const props = defineProps({ target: { type: String, required: true }, task: { type: Number, default: 2 } })
const emit = defineEmits(['close', 'apply'])
const file = ref(null)
const fileInput = ref(null)
const preview = ref('')
const extracted = ref('')
const shouldKeepImage = ref(props.target === 'question' && props.task === 1)
const working = ref(false)
const progress = ref('')
const error = ref('')
const isQuestion = computed(() => props.target === 'question')
const heading = computed(() => isQuestion.value ? 'Extract Question from Image' : 'Import Essay from Image')
function clearPreview() { if (preview.value) URL.revokeObjectURL(preview.value); preview.value = '' }
onUnmounted(clearPreview)
function selectFile(event) {
  const chosen = event.target.files?.[0]
  error.value = ''
  extracted.value = ''
  clearPreview()
  if (!chosen) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(chosen.type)) {
    error.value = 'Please select a JPG, PNG, or WEBP image.'
    return
  }
  if (chosen.size > 5 * 1024 * 1024) {
    error.value = 'The image must be smaller than 5 MB.'
    return
  }
  file.value = chosen
  preview.value = URL.createObjectURL(chosen)
}
async function runOcr() {
  if (!file.value) return
  working.value = true
  error.value = ''
  progress.value = 'Loading OCR engine…'
  try {
    const { createWorker } = await import('tesseract.js')
    let worker
    try {
      worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (message.status) progress.value = `${message.status}${Number.isFinite(message.progress) ? ` (${Math.round(message.progress * 100)}%)` : ''}`
        },
      })
      const result = await worker.recognize(file.value)
      extracted.value = result.data.text.trim()
      if (!extracted.value) error.value = 'No readable text was detected. Try a clearer image, or type it manually.'
    } finally {
      if (worker) await worker.terminate()
    }
  } catch (err) {
    error.value = 'OCR could not run. It may need an internet connection to download its English language data.'
    console.error(err)
  } finally {
    working.value = false
    progress.value = ''
  }
}
function fileAsDataUrl(selectedFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(selectedFile)
  })
}
async function apply() {
  if (!extracted.value.trim() && !(isQuestion.value && shouldKeepImage.value && file.value)) {
    error.value = 'Run text extraction or type the recognised text before inserting.'
    return
  }
  working.value = true
  try {
    const imageData = isQuestion.value && shouldKeepImage.value && file.value
      ? await fileAsDataUrl(file.value) : null
    emit('apply', { target: props.target, text: extracted.value.trim(), imageData })
  } catch {
    error.value = 'The selected image could not be read.'
    working.value = false
  }
}
</script>
<template>
  <ModalShell :title="heading" wide @close="emit('close')">
    <p class="muted small modal-intro">
      {{ isQuestion ? 'Extract visible words from a question image. For Task 1, you can also keep the chart or diagram attached.' : 'Upload a photograph of your essay, review the recognised text, and insert it into the practice editor.' }}
    </p>
    <div class="import-grid">
      <div class="import-pane">
        <div class="upload-zone" :class="{ 'upload-zone-filled': preview }" @click="fileInput?.click()">
          <img v-if="preview" :src="preview" alt="Uploaded image preview" class="upload-preview" />
          <template v-else><ImagePlus :size="30" class="soft-icon" /><strong>Choose an image</strong><span>JPG, PNG or WEBP · up to 5 MB</span></template>
        </div>
        <input ref="fileInput" class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" @change="selectFile" />
        <div class="import-actions">
          <button type="button" class="btn btn-quiet btn-sm" @click="fileInput?.click()"><Upload :size="15" />{{ preview ? 'Replace image' : 'Browse files' }}</button>
          <button type="button" class="btn btn-outline btn-sm" :disabled="!file || working" @click="runOcr">
            <LoaderCircle v-if="working" :size="15" class="spin" /><ScanText v-else :size="15" />{{ working ? 'Extracting…' : 'Run OCR' }}
          </button>
        </div>
        <p v-if="progress" class="muted small">{{ progress }}</p>
        <label v-if="isQuestion && task === 1" class="check-row">
          <input v-model="shouldKeepImage" type="checkbox" /> Keep image as Task 1 question material
        </label>
      </div>
      <div class="import-pane">
        <label for="recognizedText" class="field-heading">Recognised text <span class="muted normal">(editable)</span></label>
        <textarea id="recognizedText" v-model="extracted" class="field import-textarea" placeholder="Extracted text appears here. You can correct it before inserting…" :disabled="working" />
        <p class="muted tiny">Check spelling and paragraph breaks. OCR may misread handwriting or complex diagrams.</p>
      </div>
    </div>
    <p v-if="error" class="inline-error"><AlertCircle :size="16" />{{ error }}</p>
    <template #footer>
      <button type="button" class="btn btn-quiet" @click="emit('close')">Cancel</button>
      <button type="button" class="btn btn-primary" :disabled="working" @click="apply"><Check :size="16" />Use in editor</button>
    </template>
  </ModalShell>
</template>
