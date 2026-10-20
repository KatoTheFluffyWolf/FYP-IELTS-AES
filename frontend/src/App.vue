<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import {
  ArrowLeft, ArrowRight, BarChart3, BookOpenText, Check, CheckCircle2, ChevronDown,
  Clock3, FileClock, FileText, GraduationCap, Home, ImagePlus, Info, LayoutDashboard,
  ListChecks, Menu, RotateCcw, Save, Search, Send, Settings2, Sparkles, SquarePen,
  Timer, Trash2, Upload, X, ZoomIn, FilePlus2, LibraryBig, ShieldCheck, UserRoundCog,
} from 'lucide-vue-next'
import ModalShell from './components/ModalShell.vue'
import ImageImportModal from './components/ImageImportModal.vue'
import QuestionChart from './components/QuestionChart.vue'
import ProgressDashboard from './components/ProgressDashboard.vue'
import ResultsFeedback from './components/ResultsFeedback.vue'
import QuestionSuggestion from './components/QuestionSuggestion.vue'
import QuestionBankAdmin from './components/QuestionBankAdmin.vue'
import QuestionBankStudent from './components/QuestionBankStudent.vue'
import SuggestionReviewAdmin from './components/SuggestionReviewAdmin.vue'
import { seedManagedQuestions } from './data/questionManagement.js'
import { formatTime, questionBank, wordCount } from './data/questions.js'

const QUESTIONS_STORAGE = 'ielts-aes-questions-demo-v1'
const demoRole = ref('student') // Frontend role switch; this is NOT authentication/authorization.
const managedQuestions = ref(seedManagedQuestions())
const suggestions = ref([
  { id:'suggestion-demo-1', task:2, topic:'Technology', source:'Original idea', question:'Some people believe that artificial intelligence will create more opportunities for workers, while others think it will lead to widespread unemployment. Discuss both views and give your opinion.', visual:null, visualNotes:'', status:'pending', submittedBy:'Demo Student', submittedAt:new Date(Date.now()-86400000).toISOString(), isSample:true },
  { id:'suggestion-demo-2', task:1, topic:'Environment', source:'Original idea', question:'The line graph shows the percentage of households using solar energy in three different regions from 2010 to 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.', visual:null, visualNotes:'Line graph showing three regions, years 2010–2025, and household percentages.', status:'pending', submittedBy:'Demo Student', submittedAt:new Date(Date.now()-2*86400000).toISOString(), isSample:true },
])
const activeBank = computed(() => managedQuestions.value.filter(q => q.status === 'active'))
const questionsForTask = number => activeBank.value.filter(q => q.task === number)
function createDemoId(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random()*100000)}` }
function submitQuestionSuggestion(fields) {
  suggestions.value.unshift({ ...fields, id:createDemoId('suggestion'), status:'pending', submittedBy:'Demo Student', submittedAt:new Date().toISOString(), reviewedAt:null, reviewedBy:null, reason:'' })
  persistQuestions()
}
function saveManagedQuestion(item) {
  const now = new Date().toISOString()
  const old = managedQuestions.value.find(q => q.id === item.id)
  if (old) Object.assign(old, { ...item, id:old.id, createdAt:old.createdAt, updatedAt:now, suggestionId:old.suggestionId, title:item.question.slice(0,54) })
  else managedQuestions.value.unshift({ ...item, id:createDemoId('question'), title:item.question.slice(0,54), createdAt:now, updatedAt:now, suggestionId:null })
  persistQuestions()
}
function changeQuestionStatus({ id, status }) {
  const item=managedQuestions.value.find(q=>q.id===id)
  if (item) {item.status=status; item.updatedAt=new Date().toISOString(); persistQuestions()}
}
function archiveQuestion(id) { changeQuestionStatus({id,status:'archived'}) }
function approveSuggestion(id) {
  const q=suggestions.value.find(s=>s.id===id)
  if (!q || q.status!=='pending') return
  const now=new Date().toISOString()
  // One locally synchronous demo operation: review decision and draft created together.
  managedQuestions.value.unshift({id:createDemoId('question'),task:q.task,question:q.question,topic:q.topic,source:q.source||'Learner suggestion',visual:q.visual,visualNotes:q.visualNotes,status:'draft',suggestionId:q.id,createdAt:now,updatedAt:now,title:q.question.slice(0,54)})
  q.status='approved';q.reviewedAt=now;q.reviewedBy='Demo Admin';q.reason=''
  persistQuestions()
}
function rejectSuggestion({id,reason}) {
  const q=suggestions.value.find(s=>s.id===id)
  if (!q || q.status!=='pending') return
  q.status='rejected';q.reason=reason;q.reviewedAt=new Date().toISOString();q.reviewedBy='Demo Admin'
  persistQuestions()
}
function persistQuestions() {
  try { localStorage.setItem(QUESTIONS_STORAGE, JSON.stringify({questions:managedQuestions.value,suggestions:suggestions.value})) }
  catch (error) {toast('Browser storage is full. Some question-management changes may not persist after refresh.')}
}
function setDemoRole(event) {
  const next = event.target.value
  if (next === demoRole.value) return
  if (!leaveMockIfNecessary(next==='admin'?'question-bank':'practice')) {event.target.value=demoRole.value;return}
  demoRole.value=next
  navigate(next === 'admin'?'question-bank':'practice')
  toast(next==='admin'?'Admin demo view: not secured by real authentication.':'Switched to learner demo view.')
}

const STORAGE = 'ielts-aes-ui-prototype-v1'
function blankDraft() { return { question: '', essay: '', visual: null, questionSource: 'custom', questionId: null } }
const practiceDrafts = reactive({ 1: blankDraft(), 2: blankDraft() })
const practiceTask = ref(1)
const mockTask = ref(1)
const page = ref('practice')
const showMobileMenu = ref(false)
const practiceDraft = computed(() => practiceDrafts[practiceTask.value])
const isPractice = computed(() => page.value === 'practice')
const isMock = computed(() => page.value === 'mock')
const writing = computed(() => isPractice.value || isMock.value)
const task = computed(() => isMock.value ? mockTask.value : practiceTask.value)
const minWords = computed(() => task.value === 1 ? 150 : 250)
const essayText = computed(() => isMock.value ? mockEssay.value : practiceDraft.value.essay)
const count = computed(() => wordCount(essayText.value))
const isBelowMin = computed(() => count.value > 0 && count.value < minWords.value)

// Frontend-only sample data. No essay is sent to a scoring or storage service.
const history = ref([])
const resultId = ref(null)
const activeResult = computed(() => history.value.find((item) => item.id === resultId.value) || null)
const isSubmitting = ref(false)
const notice = ref('')
let toastTimeout = null
function toast(text) {
  notice.value = text
  if (toastTimeout) window.clearTimeout(toastTimeout)
  toastTimeout = window.setTimeout(() => { notice.value = '' }, 4200)
}

const modal = ref('') // timer | zoom | improvement | clear
const importTarget = ref(null)
const feedbackTab = ref('task')
const mockStarted = ref(false)
const mockQuestion = ref(null)
const mockEssay = ref('')
const mockSeconds = ref(20 * 60)
const practiceTimerOn = ref(false)
const practiceSeconds = ref(20 * 60)
const practiceTimerDuration = ref(20)
const timerFormOn = ref(false)
const timerFormDuration = ref(20)
const revisionOf = ref(null)
const improvementOpen = ref(false)
const openQuestion = computed(() => isMock.value ? mockQuestion.value : null)
const activeQuestion = computed(() => isMock.value ? (mockQuestion.value?.question || '') : practiceDraft.value.question)
const activeVisual = computed(() => isMock.value ? mockQuestion.value?.visual : practiceDraft.value.visual)
const activeTime = computed(() => isMock.value ? mockSeconds.value : practiceSeconds.value)
const timeIsRunning = computed(() => isMock.value ? mockStarted.value : practiceTimerOn.value)
const timeIsUrgent = computed(() => timeIsRunning.value && activeTime.value <= 5 * 60)
const associatedCount = computed(() => history.value.filter((item) => item.mode === 'practice').length)
let ticker = null
let persistTimeout = null

function persist() {
  try {
    const cleanHistory = history.value.map(({ visual, ...rest }) => ({
      ...rest,
      // Large OCR attachments are intentionally not stored in localStorage.
      visual: visual?.startsWith('data:') ? null : visual,
    }))
    localStorage.setItem(STORAGE, JSON.stringify({
      drafts: {
        1: { ...practiceDrafts[1], visual: practiceDrafts[1].visual?.startsWith('data:') ? null : practiceDrafts[1].visual },
        2: { ...practiceDrafts[2], visual: practiceDrafts[2].visual?.startsWith('data:') ? null : practiceDrafts[2].visual },
      },
      history: cleanHistory,
    }))
  } catch (err) {
    console.warn('Local demo save failed:', err)
  }
}
function queuePersist() {
  if (persistTimeout) window.clearTimeout(persistTimeout)
  persistTimeout = window.setTimeout(persist, 450)
}
watch(practiceDrafts, queuePersist, { deep: true })
watch(history, queuePersist, { deep: true })

onMounted(() => {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE) || '{}')
    for (const number of [1, 2]) {
      if (state.drafts?.[number]) Object.assign(practiceDrafts[number], state.drafts[number])
    }
    if (Array.isArray(state.history)) history.value = state.history
    const qstate = JSON.parse(localStorage.getItem(QUESTIONS_STORAGE) || '{}')
    if (Array.isArray(qstate.questions)) managedQuestions.value = qstate.questions
    if (Array.isArray(qstate.suggestions)) suggestions.value = qstate.suggestions
  } catch { /* Treat invalid local demo data as empty. */ }
  ticker = window.setInterval(() => {
    if (page.value === 'mock' && mockStarted.value && !isSubmitting.value) {
      if (mockSeconds.value > 0) mockSeconds.value--
      if (mockSeconds.value === 0) submitEssay('timer')
    } else if (page.value === 'practice' && practiceTimerOn.value && !isSubmitting.value) {
      if (practiceSeconds.value > 0) practiceSeconds.value--
      if (practiceSeconds.value === 0) submitEssay('timer')
    }
  }, 1000)
})
onUnmounted(() => {
  if (ticker) window.clearInterval(ticker)
  if (toastTimeout) window.clearTimeout(toastTimeout)
  if (persistTimeout) window.clearTimeout(persistTimeout)
})

function leaveMockIfNecessary(next) {
  if (page.value === 'mock' && mockStarted.value && next !== 'mock') {
    if (!window.confirm('Leave the mock test? Your unfinished test response will be discarded.')) return false
    resetMock()
  }
  return true
}
function navigate(next) {
  if (page.value === next) return
  if (!leaveMockIfNecessary(next)) return
  page.value = next
  modal.value = ''
  showMobileMenu.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function setTask(number) {
  if (isMock.value) {
    if (mockStarted.value) return
    mockTask.value = number
    mockSeconds.value = number === 1 ? 20 * 60 : 40 * 60
  } else {
    if (revisionOf.value) { toast('Finish or cancel your revision before switching tasks.'); return }
    practiceTask.value = number
    if (!practiceTimerOn.value) {
      practiceTimerDuration.value = number === 1 ? 20 : 40
      practiceSeconds.value = practiceTimerDuration.value * 60
    }
  }
}
function startMock() {
  const available = questionsForTask(mockTask.value)
  if (!available.length) { toast(`No active Task ${mockTask.value} questions are available in this demo.`); return }
  mockQuestion.value = available[Math.floor(Math.random() * available.length)]
  mockEssay.value = ''
  mockSeconds.value = (mockTask.value === 1 ? 20 : 40) * 60
  mockStarted.value = true
  toast('The test has started. The countdown is running.')
}
function resetMock() {
  mockStarted.value = false
  mockEssay.value = ''
  mockQuestion.value = null
  mockSeconds.value = (mockTask.value === 1 ? 20 : 40) * 60
}
function openTimerModal() {
  timerFormOn.value = practiceTimerOn.value
  timerFormDuration.value = practiceTimerDuration.value
  modal.value = 'timer'
}
function applyTimer() {
  practiceTimerOn.value = timerFormOn.value
  practiceTimerDuration.value = Number(timerFormDuration.value)
  practiceSeconds.value = practiceTimerDuration.value * 60
  modal.value = ''
  toast(practiceTimerOn.value ? `A ${practiceTimerDuration.value}-minute practice countdown has started.` : 'Practice timer disabled.')
}
function useQuestion(item) {
  // One workflow for both the modal (if enabled later) and the learner question bank.
  if (!item || item.status !== 'active') return
  if (revisionOf.value) {
    toast('Finish or cancel your essay revision before selecting a different question.')
    return
  }
  const chosenTask = Number(item.task)
  if (![1, 2].includes(chosenTask)) return
  practiceTask.value = chosenTask
  practiceDrafts[chosenTask].question = item.question
  practiceDrafts[chosenTask].visual = item.visual || null
  practiceDrafts[chosenTask].questionSource = 'bank'
  practiceDrafts[chosenTask].questionId = item.id
  // Keep the learner's in-progress essay draft; choosing a question must not erase writing.
  if (!practiceTimerOn.value) {
    practiceTimerDuration.value = chosenTask === 1 ? 20 : 40
    practiceSeconds.value = practiceTimerDuration.value * 60
  }
  modal.value = ''
  navigate('practice')
  queuePersist()
  toast(`Task ${chosenTask} question selected. Your existing essay draft has been preserved.`)
}
function acceptImage({ target, text, imageData }) {
  if (target === 'essay') {
    const prefix = practiceDraft.value.essay.trim() ? '\n\n' : ''
    practiceDraft.value.essay += prefix + text
  } else {
    if (text) practiceDraft.value.question = text
    if (imageData) practiceDraft.value.visual = imageData
    practiceDraft.value.questionSource = 'custom'
    practiceDraft.value.questionId = null
  }
  importTarget.value = null
  toast('Imported content inserted. Review it before submitting.')
}
function saveDraft() {
  persist()
  toast('Practice draft saved locally in this browser.')
}
function clearDraft() {
  practiceDraft.value.essay = ''
  if (!revisionOf.value) {
    practiceDraft.value.question = ''
    practiceDraft.value.visual = null
    practiceDraft.value.questionSource = 'custom'
    practiceDraft.value.questionId = null
  }
  modal.value = ''
  toast('Editor cleared.')
}
function mockScores(taskNumber) {
  return { overall: 6.5, criteria: [6.5, 6.0, 7.0, 6.5] }
}
function submitEssay(reason = 'manual') {
  if (isSubmitting.value) return
  const mode = page.value
  if (mode !== 'mock' && mode !== 'practice') return
  if (mode === 'mock' && !mockStarted.value) { toast('Start the test before submitting.'); return }
  const essay = essayText.value.trim()
  const question = activeQuestion.value.trim()
  if (reason !== 'timer' && !essay) { toast('Please write an essay before submitting.'); return }
  if (!question) { toast('Add a question before submitting.'); return }
  if (mode === 'practice' && revisionOf.value && reason !== 'timer') {
    if (essay === revisionOf.value.essay.trim()) {
      toast('This revision is identical to the previous version. Make a change before submitting.')
      return
    }
  }
  isSubmitting.value = true
  const parent = mode === 'practice' ? revisionOf.value : null
  const next = {
    id: `demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    mode, task: task.value, essay, question,
    questionId: mode === 'mock' ? (mockQuestion.value?.id || null) : (practiceDraft.value.questionSource === 'bank' ? practiceDraft.value.questionId : null),
    visual: activeVisual.value || null,
    revisionNumber: parent ? parent.revisionNumber + 1 : 0,
    previousSubmissionId: parent ? parent.id : null,
    submittedAt: new Date().toISOString(),
    submittedByTimer: reason === 'timer',
    status: essay ? 'pending' : 'empty',
    scores: null,
  }
  history.value.unshift(next)
  resultId.value = next.id
  feedbackTab.value = 'task'
  improvementOpen.value = false
  if (mode === 'mock') resetMock()
  else { practiceTimerOn.value = false; revisionOf.value = null }
  page.value = 'result'
  window.scrollTo({ top: 0, behavior: 'smooth' })
  isSubmitting.value = false
  persist()
  if (essay) {
    window.setTimeout(() => {
      const stored = history.value.find((item) => item.id === next.id)
      if (stored?.status === 'pending') {
        stored.status = 'demo'
        stored.scores = mockScores(next.task)
        persist()
      }
    }, 850)
  }
  if (reason === 'timer') toast('Time is up. Your response was automatically submitted.')
}
function viewExampleResult() {
  // An explicit UI fixture, not model-produced assessment data.
  const existing = history.value.find(item => item.id === 'example-assessment-preview')
  if (existing) { openHistoryResult(existing); return }
  const question = questionBank[0]
  const item = {
    id: 'example-assessment-preview', mode: 'practice', task: 1,
    question: question.question, visual: question.visual,
    essay: `The bar chart illustrates the numbers of international students studying in four countries over the period from 2010 to 2020.

Overall, the number of international students rose in all four countries. The USA attracted the most international students during the whole period, while Canada consistently recorded the lowest figures.

In 2010, the USA had approximately 100,000 international students, compared with around 70,000 in the UK, 55,000 in Australia and 35,000 in Canada. Over the next ten years, these totals continued to increase. The growth was strongest in the USA, whose student population reached about 180,000 by 2020.

The UK maintained second place, with its figure increasing to roughly 135,000. Australia also saw a steady rise to around 110,000, while Canada's number grew to approximately 65,000. Although Canada had the smallest total at every point, its number still increased substantially over the period.`,
    revisionNumber: 0, previousSubmissionId: null,
    submittedAt: new Date().toISOString(), status: 'demo',
    scores: { overall: 6.5, criteria: [5.5, 7.0, 6.5, 6.0] },
    samplePreview: true,
  }
  history.value.unshift(item)
  persist()
  openHistoryResult(item)
}
function openHistoryResult(item) {
  resultId.value = item.id
  improvementOpen.value = false
  feedbackTab.value = 'task'
  navigate('result')
}
function startRevision() {
  const current = activeResult.value
  if (!current || current.mode !== 'practice' || current.status !== 'demo') return
  practiceTask.value = current.task
  practiceDrafts[current.task] = { question: current.question, essay: current.essay, visual: current.visual, questionSource: current.questionId ? 'bank' : 'custom', questionId: current.questionId || null }
  revisionOf.value = current
  practiceTimerOn.value = false
  practiceTimerDuration.value = current.task === 1 ? 20 : 40
  practiceSeconds.value = practiceTimerDuration.value * 60
  navigate('practice')
  toast(`Editing revision ${current.revisionNumber + 1}. The original submission will be preserved.`)
}
function cancelRevision() {
  const previous = revisionOf.value
  if (!previous) return
  practiceDrafts[previous.task] = blankDraft()
  revisionOf.value = null
  openHistoryResult(previous)
}
function goToWriting(mode) {
  if (mode === 'practice') {
    revisionOf.value = null
  }
  navigate(mode)
}
const criteria = computed(() => [
  { id: 'task', name: activeResult.value?.task === 1 ? 'Task Achievement' : 'Task Response', short: 'Task', score: activeResult.value?.scores?.criteria[0], description: 'Address all parts of the question, and extend the main ideas with relevant details.' },
  { id: 'coherence', name: 'Coherence & Cohesion', short: 'Coherence', score: activeResult.value?.scores?.criteria[1], description: 'Organise paragraphs logically, and make connections between ideas explicit.' },
  { id: 'lexical', name: 'Lexical Resource', short: 'Vocabulary', score: activeResult.value?.scores?.criteria[2], description: 'Use precise vocabulary appropriately without unnecessary repetition.' },
  { id: 'grammar', name: 'Grammatical Range & Accuracy', short: 'Grammar', score: activeResult.value?.scores?.criteria[3], description: 'Vary sentence structures and check grammar and punctuation.' },
])
const selectedCriterion = computed(() => criteria.value.find((entry) => entry.id === feedbackTab.value) || criteria.value[0])
const previousResult = computed(() => history.value.find((item) => item.id === activeResult.value?.previousSubmissionId))
const activeHistory = computed(() => [...history.value].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)))
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="header-brand"><span class="brand-red">IELTS</span><span class="brand-dark">AES</span><span class="brand-separator"/><span class="brand-subtitle">Writing Lab</span></div>
      <div class="header-right">
        <span class="prototype-pill"><span class="prototype-dot" />Frontend prototype</span>
        <span class="header-divider"/>
        <label class="qm-role-toggle"><UserRoundCog :size="15"/><span class="sr-only">Demo role</span><select :value="demoRole" @change="setDemoRole" aria-label="Choose demo role"><option value="student">Student demo</option><option value="admin">Admin demo</option></select></label>
        <div class="avatar" aria-hidden="true">{{ demoRole === 'admin' ? 'A' : 'S' }}</div>
        <button class="mobile-menu-btn icon-button" aria-label="Toggle navigation" @click="showMobileMenu = !showMobileMenu"><Menu :size="22" /></button>
      </div>
    </header>

    <div class="below-header">
      <aside class="sidebar" :class="{ 'sidebar-open': showMobileMenu }" aria-label="Main navigation">
        <div class="sidebar-section-label">WORKSPACE</div>
        <nav class="nav-list">
          <button class="nav-link" :class="{ active: page === 'dashboard' }" @click="navigate('dashboard')"><LayoutDashboard :size="18" />Dashboard</button>
          <button class="nav-link" :class="{ active: page === 'practice' }" @click="navigate('practice')"><SquarePen :size="18" />Practice Writing</button>
          <button class="nav-link" :class="{ active: page === 'mock' }" @click="navigate('mock')"><FileText :size="18" />Take Mock Test</button>
          <button class="nav-link" :class="{ active: page === 'history' || page === 'result' }" @click="navigate('history')"><FileClock :size="18" />My Results <span v-if="history.length" class="nav-count">{{ history.length }}</span></button>
          <button class="nav-link" :class="{ active: page === 'progress' }" @click="navigate('progress')"><BarChart3 :size="18" />Progress Dashboard</button>
          <div v-if="demoRole === 'student'" class="sidebar-section-label qm-admin-label">LEARNING</div>
          <button v-if="demoRole === 'student'" class="nav-link" :class="{ active: page === 'question-bank' }" @click="navigate('question-bank')"><LibraryBig :size="18" />Question Bank</button>
          <button v-if="demoRole === 'student'" class="nav-link" :class="{ active: page === 'question-suggestion' }" @click="navigate('question-suggestion')"><FilePlus2 :size="18" />Suggest a Question</button>
          <template v-if="demoRole === 'admin'">
            <div class="sidebar-section-label qm-admin-label">ADMINISTRATION</div>
            <button class="nav-link" :class="{ active: page === 'question-bank' }" @click="navigate('question-bank')"><LibraryBig :size="18" />Question Bank</button>
            <button class="nav-link" :class="{ active: page === 'suggestion-review' }" @click="navigate('suggestion-review')"><ShieldCheck :size="18" />Review Suggestions <span v-if="suggestions.some(s => s.status === 'pending')" class="nav-count">{{ suggestions.filter(s => s.status === 'pending').length }}</span></button>
          </template>
        </nav>
        <div class="sidebar-bottom">
          <div class="sidebar-tip"><GraduationCap :size="19" /><strong>Your writing space</strong><p>Practise, review feedback, and keep improving — one essay at a time.</p></div>
          <div class="sidebar-footer">UI concept · Not affiliated with IELTS</div>
        </div>
      </aside>
      <div v-if="showMobileMenu" class="sidebar-scrim" @click="showMobileMenu = false" />

      <main class="main-content">
        <!-- The practice and mock pages deliberately use the SAME writing layout. -->
        <template v-if="writing">
          <section class="page-header">
            <div><p class="eyebrow">WRITING WORKSPACE / {{ isPractice ? 'PRACTICE' : 'EXAM SIMULATION' }}</p>
              <h1>{{ isPractice ? (revisionOf ? `Revise Response · Version ${revisionOf.revisionNumber + 1}` : 'Practice Writing') : 'Take Mock Test' }}</h1>
              <p class="page-subtitle">{{ isPractice ? 'Choose a task, write at your own pace, and get detailed feedback.' : 'Practise under IELTS-style time conditions with an assigned question.' }}</p>
            </div>
            <span class="mode-tag" :class="{ 'tag-test': isMock }"><span class="mode-dot"/>{{ isPractice ? 'Practice mode' : 'Mock test mode' }}</span>
          </section>

          <div class="writing-body">
            <div v-if="revisionOf && isPractice" class="revision-banner"><Info :size="18" /><span>You are revising version {{ revisionOf.revisionNumber }}. Your original response and assessment will remain unchanged.</span><button class="text-button" @click="cancelRevision">Cancel revision</button></div>

            <div class="task-switch" role="group" aria-label="Choose IELTS writing task">
              <button :class="{ selected: task === 1 }" :disabled="isMock && mockStarted" @click="setTask(1)">Task 1</button>
              <button :class="{ selected: task === 2 }" :disabled="isMock && mockStarted" @click="setTask(2)">Task 2</button>
            </div>

            <div class="timer-container">
              <div class="timer-group" :class="{ 'timer-disabled': isPractice && !practiceTimerOn, 'timer-urgent': timeIsUrgent }">
                <Clock3 :size="26" :stroke-width="1.9" />
                <span class="timer-digits" role="timer" :aria-label="`Time remaining ${formatTime(activeTime)}`">{{ formatTime(activeTime) }}</span>
                <button v-if="isPractice" class="timer-settings icon-button" aria-label="Timer settings" title="Timer settings" @click="openTimerModal"><Settings2 :size="22"/></button>
              </div>
              <p class="timer-caption">{{ isPractice ? (practiceTimerOn ? 'Practice countdown is running · automatically submits at zero' : 'Timer is optional in practice mode') : (mockStarted ? 'Time remaining · automatically submits at zero' : '20 minutes for Task 1 · 40 minutes for Task 2') }}</p>
            </div>

            <div v-if="isMock && !mockStarted" class="start-test-bar">
              <div><strong>Ready to begin?</strong><p>Your question will be assigned at random when you start. Leaving an unfinished test discards the attempt.</p></div>
              <button class="btn btn-primary" @click="startMock"><Timer :size="17" />Start mock test</button>
            </div>

            <section class="writing-section question-section" aria-labelledby="question-heading">
              <div class="section-heading">
                <div class="section-title"><span class="step-number">01</span><h2 id="question-heading">Question</h2><span v-if="isMock && mockStarted" class="field-meta">Assigned question</span></div>
                <div v-if="isPractice" class="section-actions">
                  <button class="inline-action" @click="navigate('question-bank')"><BookOpenText :size="16" /><span>View Question Bank</span></button>
                  <button class="inline-action inline-action-red" @click="importTarget = 'question'"><ImagePlus :size="16" /><span>Extract from image</span></button>
                </div>
              </div>
              <template v-if="isPractice">
                <div class="question-field-wrap">
                  <textarea v-model="practiceDraft.question" class="field question-textarea" placeholder="Type or paste your question here, or choose a question from the bank…" aria-label="Question prompt" @input="practiceDraft.questionSource = 'custom'; practiceDraft.questionId = null" />
                </div>
                <div v-if="practiceDraft.visual" class="question-visual-block">
                  <div class="visual-topline"><span><ImagePlus :size="15" /> Task 1 question material</span><div class="visual-actions"><button class="small-link" @click="modal = 'zoom'">Enlarge</button><button class="small-link danger" @click="practiceDraft.visual = null">Remove</button></div></div>
                  <QuestionChart v-if="!practiceDraft.visual.startsWith('data:')" :variant="practiceDraft.visual" />
                  <img v-else :src="practiceDraft.visual" alt="User supplied question image" class="custom-question-image" @click="modal = 'zoom'" />
                </div>
                <p class="field-help">Use a question from the bank or enter your own. Custom questions are not added to the bank.</p>
              </template>
              <template v-else>
                <div v-if="mockStarted && mockQuestion" class="read-only-question">
                  <p class="question-content">{{ mockQuestion.question }}</p>
                  <div v-if="mockQuestion.visual" class="question-visual-block mock-visual"><div class="visual-topline"><span>Provided Task 1 visual</span><button class="small-link" @click="modal = 'zoom'"><ZoomIn :size="14" />Enlarge</button></div><QuestionChart v-if="!mockQuestion.visual.startsWith('data:')" :variant="mockQuestion.visual" /><img v-else :src="mockQuestion.visual" class="custom-question-image" alt="Task 1 prompt visual" /></div>
                </div>
                <div v-else class="empty-question"><FileText :size="24" /><span>Your randomly assigned Task {{ task }} question will appear here once the test begins.</span></div>
              </template>
            </section>

            <section class="writing-section essay-section" aria-labelledby="essay-heading">
              <div class="section-heading">
                <div class="section-title"><span class="step-number">02</span><h2 id="essay-heading">Your Essay</h2></div>
                <button v-if="isPractice" class="inline-action inline-action-red" @click="importTarget = 'essay'"><ImagePlus :size="16" /><span>Import from image</span></button>
              </div>
              <div class="editor-frame" :class="{ 'editor-locked': isMock && !mockStarted }">
                <div class="editor-toolbar"><span><SquarePen :size="14" />Writing editor</span><span>{{ count.toLocaleString() }} words</span></div>
                <textarea v-if="isPractice" v-model="practiceDraft.essay" class="essay-textarea" placeholder="Start writing your essay here…" aria-label="Essay editor" spellcheck="true" />
                <textarea v-else v-model="mockEssay" :disabled="!mockStarted" class="essay-textarea" :placeholder="mockStarted ? 'Start writing your essay here…' : 'Start the mock test to unlock the essay editor…'" aria-label="Mock test essay editor" spellcheck="true" />
              </div>
              <div class="word-stats"><span :class="{ 'word-warning': isBelowMin }"><span class="word-count-label">Word count:</span> <strong>{{ count }}</strong></span><span>Recommended minimum: <strong>{{ minWords }} words</strong></span></div>
              <p v-if="isBelowMin" class="word-tip"><Info :size="14" />You are below the recommended IELTS word count. You can still submit, but it may affect your real score.</p>
              <div class="writing-actions">
                <div v-if="isPractice" class="left-actions"><button class="btn btn-outline" @click="saveDraft"><Save :size="16" />Save draft</button><button class="btn btn-quiet" @click="modal = 'clear'"><Trash2 :size="15" />Clear</button></div>
                <div v-else class="left-actions"><span class="mock-warning"><Info :size="15"/> Unsubmitted test attempts are not saved</span></div>
                <button class="btn btn-primary submit-btn" :disabled="isMock && !mockStarted || isSubmitting" @click="submitEssay('manual')"><Send :size="17" />{{ revisionOf && isPractice ? 'Submit revision' : 'Submit for assessment' }}</button>
              </div>
            </section>
            <p class="end-note"><Info :size="15" />This is a frontend prototype. Submission results currently use clearly labelled sample assessment data.</p>
          </div>
        </template>

        <!-- A shared result screen for both modes (UC-05). -->
        <template v-else-if="page === 'result' && activeResult">
          <section class="page-header result-header"><div><p class="eyebrow">ASSESSMENT / {{ activeResult.mode === 'mock' ? 'MOCK TEST' : 'PRACTICE' }}</p><h1>Results and Feedback</h1><p class="page-subtitle">Task {{ activeResult.task }} · {{ new Date(activeResult.submittedAt).toLocaleString() }} · Version {{ activeResult.revisionNumber }}</p></div></section>
          <div v-if="activeResult.status === 'pending'" class="state-card"><div class="loading-ring"/><h2>Preparing your assessment…</h2><p>Displaying a demonstration of the assessment loading state.</p></div>
          <div v-else-if="activeResult.status === 'empty'" class="state-card"><Info :size="32"/><h2>No essay was submitted</h2><p>The timer expired before a response was entered. Your attempt is retained without an invented score.</p><button class="btn btn-outline" @click="navigate('history')">Back to results</button></div>
          <ResultsFeedback v-else-if="activeResult.scores" :result="activeResult" :criteria="criteria" :feedback-tab="feedbackTab" :previous-result="previousResult" @update:feedback-tab="feedbackTab = $event" @back="navigate('history')" @improvement="modal = 'improvement'" @revise="startRevision" @previous="openHistoryResult(previousResult)" />
          <div v-else class="state-card"><Info :size="32"/><h2>Assessment unavailable</h2><p>The result has no completed scores yet. Your submitted response has been preserved.</p><button class="btn btn-outline" @click="navigate('history')">Back to results</button></div>
        </template>

        <template v-else-if="page === 'progress'">
          <ProgressDashboard :history="history" @open-results="navigate('history')" />
        </template>

        <template v-else-if="page === 'question-suggestion' && demoRole === 'student'">
          <QuestionSuggestion :suggestions="suggestions" :known-questions="managedQuestions" @submit="submitQuestionSuggestion" @cancel="navigate('dashboard')" />
        </template>

        <template v-else-if="page === 'question-bank' && demoRole === 'student'">
          <QuestionBankStudent :questions="activeBank" @use-question="useQuestion" @suggest-question="navigate('question-suggestion')" />
        </template>

        <template v-else-if="page === 'question-bank' && demoRole === 'admin'">
          <QuestionBankAdmin :questions="managedQuestions" :suggestions="suggestions" :history="history" @save-question="saveManagedQuestion" @archive="archiveQuestion" @change-status="changeQuestionStatus" @open-review="navigate('suggestion-review')" />
        </template>

        <template v-else-if="page === 'suggestion-review' && demoRole === 'admin'">
          <SuggestionReviewAdmin :suggestions="suggestions" :questions="managedQuestions" @approve="approveSuggestion" @reject="rejectSuggestion" @open-bank="navigate('question-bank')" />
        </template>

        <template v-else-if="page === 'history'">
          <section class="page-header"><div><p class="eyebrow">YOUR WORK / HISTORY</p><h1>My Results</h1><p class="page-subtitle">Review locally saved demo submissions and their assessments.</p></div><div class="button-cluster"><button class="btn btn-outline" @click="viewExampleResult"><FileText :size="16"/>Preview sample result</button><button class="btn btn-primary" @click="goToWriting('practice')"><SquarePen :size="16"/>New practice</button></div></section>
          <section class="history-list" v-if="activeHistory.length"><button v-for="item in activeHistory" :key="item.id" class="history-entry" @click="openHistoryResult(item)"><span class="history-icon"><FileText :size="20" /></span><span class="history-main"><strong>{{ item.mode === 'mock' ? 'Mock Test' : 'Practice Writing' }} · Task {{ item.task }}<span v-if="item.revisionNumber"> · Revision {{ item.revisionNumber }}</span></strong><span>{{ item.question.slice(0, 125) }}{{ item.question.length > 125 ? '…' : '' }}</span><small>{{ new Date(item.submittedAt).toLocaleString() }} · {{ wordCount(item.essay) }} words</small></span><span class="history-score">{{ item.status === 'demo' ? `Demo ${item.scores.overall.toFixed(1)}` : item.status === 'pending' ? 'Pending' : 'No score' }}</span><ArrowRight :size="17" /></button></section>
          <div v-else class="state-card"><FileClock :size="37" /><h2>No submissions yet</h2><p>Submit a practice response or finish a mock test to see your example results here.</p><div class="button-cluster"><button class="btn btn-outline" @click="viewExampleResult">Preview sample result</button><button class="btn btn-primary" @click="goToWriting('practice')">Start practicing</button></div></div>
        </template>

        <template v-else-if="page === 'dashboard'">
          <section class="page-header"><div><p class="eyebrow">WELCOME TO YOUR WORKSPACE</p><h1>Good to see you!</h1><p class="page-subtitle">What would you like to work on today?</p></div></section>
          <div class="dashboard-hero"><span class="hero-kicker">YOUR IELTS WRITING JOURNEY</span><h2>Clearer writing starts with consistent practice.</h2><p>Choose your task, write your response, and explore the assessment interface.</p><button class="btn btn-white" @click="navigate('practice')">Start practice <ArrowRight :size="16" /></button></div>
          <div class="dashboard-tiles"><button class="dashboard-tile" @click="navigate('practice')"><SquarePen :size="24" /><strong>Practice Writing</strong><span>Use your own question, set an optional timer, or import text from an image.</span><span class="tile-link">Open practice <ArrowRight :size="15" /></span></button><button class="dashboard-tile" @click="navigate('mock')"><Clock3 :size="24" /><strong>Take Mock Test</strong><span>Simulate IELTS writing with a fixed countdown and an assigned question.</span><span class="tile-link">Start mock test <ArrowRight :size="15" /></span></button><button class="dashboard-tile" @click="navigate('history')"><FileClock :size="24" /><strong>{{ history.length }} total submissions</strong><span>{{ associatedCount }} practice submissions recorded in this local demo.</span><span class="tile-link">View history <ArrowRight :size="15" /></span></button><button class="dashboard-tile" @click="navigate('progress')"><BarChart3 :size="24" /><strong>Progress Dashboard</strong><span>Track band trends, criterion scores, and your target goal.</span><span class="tile-link">View progress <ArrowRight :size="15" /></span></button></div>
        </template>
      </main>
    </div>

    <Transition name="toast"><div v-if="notice" class="toast-message" role="status"><Info :size="17" />{{ notice }}<button aria-label="Dismiss notification" @click="notice = ''"><X :size="16" /></button></div></Transition>

    <ModalShell v-if="modal === 'timer'" title="Practice Timer Settings" @close="modal = ''">
      <p class="muted small">The timer is optional. If enabled, the essay is submitted automatically when the countdown reaches zero.</p>
      <label class="settings-toggle"><span><strong>Enable countdown</strong><small>{{ timerFormOn ? 'The timer will start when you save these settings' : 'No time limit during practice' }}</small></span><input v-model="timerFormOn" type="checkbox" role="switch" /><span class="switch-track" /></label>
      <div class="setting-block" :class="{ disabled: !timerFormOn }"><span class="field-heading">Timer duration</span><div class="duration-options"><button v-for="minutes in [20, 30, 40, 60]" :key="minutes" :disabled="!timerFormOn" :class="{ selected: timerFormDuration === minutes }" @click="timerFormDuration = minutes">{{ minutes }}<span>min</span></button></div></div>
      <template #footer><button class="btn btn-quiet" @click="modal = ''">Cancel</button><button class="btn btn-primary" @click="applyTimer"><Check :size="16" />Save settings</button></template>
    </ModalShell>



    <ModalShell v-if="modal === 'clear'" title="Clear the Editor?" @close="modal = ''"><p>This will remove your current text{{ revisionOf ? '' : ' and question' }} from the practice editor. Saved submissions are not affected.</p><template #footer><button class="btn btn-quiet" @click="modal = ''">Keep writing</button><button class="btn btn-primary" @click="clearDraft"><Trash2 :size="16"/>Clear editor</button></template></ModalShell>

    <ModalShell v-if="modal === 'zoom'" title="Question Visual" wide @close="modal = ''"><QuestionChart v-if="activeVisual && !activeVisual.startsWith('data:')" :variant="activeVisual" /><img v-else-if="activeVisual" class="zoom-image" :src="activeVisual" alt="Enlarged question visual" /></ModalShell>

    <ModalShell v-if="modal === 'improvement'" title="Higher-Band Example (UI Preview)" wide @close="modal = ''">
      <div class="demo-notice"><Info :size="18" /><div><strong>Future feature · UC-06</strong><span>The rewrite service is not connected yet. This previews the layout without claiming to have generated a better essay.</span></div></div>
      <div class="improvement-header"><span>Current example band: <strong>{{ activeResult?.scores?.overall?.toFixed(1) }}</strong></span><span>Illustrative target: <strong>{{ Math.min(9, (activeResult?.scores?.overall || 0) + 1).toFixed(1) }}</strong></span></div>
      <div class="improvement-grid"><div><h3>Your original text</h3><div class="comparison-panel">{{ activeResult?.essay || 'No text provided' }}</div></div><div><h3>Suggested revision</h3><div class="comparison-panel empty-comparison"><Sparkles :size="27"/><strong>Rewritten example appears here</strong><p>Connect your Qwen3-14B rewriting endpoint to supply revised passages, highlighted changes, and rubric-based explanations.</p></div></div></div>
      <div class="explanation-preview"><strong>What the complete feature will explain</strong><p>Which sentences changed, why each change relates to the IELTS criteria, and how the original meaning was preserved. The requested target is illustrative, not guaranteed.</p></div>
      <template #footer><button class="btn btn-primary" @click="modal = ''">Close preview</button></template>
    </ModalShell>

    <ImageImportModal v-if="importTarget" :target="importTarget" :task="practiceTask" @close="importTarget = null" @apply="acceptImage" />
  </div>
</template>
