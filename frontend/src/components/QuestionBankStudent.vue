<script setup>
import { computed, ref, watch } from 'vue'
import {
  ArrowLeft, BookOpenText, ChevronLeft, ChevronRight, Eye, FilePlus2,
  Info, Search, SquarePen,
} from 'lucide-vue-next'
import QuestionChart from './QuestionChart.vue'
import { friendlyDate, previewText } from '../data/questionManagement.js'

// Only published questions are shown to learners. The API must enforce the same rule later.
const props = defineProps({ questions: { type: Array, required: true } })
const emit = defineEmits(['use-question', 'suggest-question'])
const filterTask = ref('all')
const filterTopic = ref('all')
const filterSource = ref('all')
const search = ref('')
const pageIndex = ref(0)
const view = ref('list')
const selectedId = ref(null)

const published = computed(() => props.questions.filter(q => q.status === 'active'))
const topics = computed(() => [...new Set(published.value.map(q => q.topic).filter(Boolean))].sort())
const sources = computed(() => [...new Set(published.value.map(q => q.source).filter(Boolean))].sort())
const filtered = computed(() => published.value.filter(q => {
  const matchesText = `${q.id} ${q.question} ${q.topic || ''} ${q.source || ''}`.toLocaleLowerCase()
    .includes(search.value.toLocaleLowerCase().trim())
  return matchesText && (filterTask.value === 'all' || Number(q.task) === Number(filterTask.value))
    && (filterTopic.value === 'all' || q.topic === filterTopic.value)
    && (filterSource.value === 'all' || q.source === filterSource.value)
}).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
const pageSize = 6
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const visible = computed(() => filtered.value.slice(pageIndex.value * pageSize, (pageIndex.value + 1) * pageSize))
const selected = computed(() => published.value.find(q => q.id === selectedId.value) || null)
watch([filterTask, filterTopic, filterSource, search], () => { pageIndex.value = 0 })
watch(pageCount, count => { if (pageIndex.value >= count) pageIndex.value = count - 1 })
watch(selected, item => { if (view.value === 'details' && !item) view.value = 'list' })

function showDetail(id) {
  selectedId.value = id
  view.value = 'details'
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function choose(item) {
  if (!item || item.status !== 'active') return
  emit('use-question', item)
}
</script>

<template>
  <section class="page-header">
    <div>
      <p class="eyebrow">LEARNER / QUESTION BANK</p>
      <h1>{{ view === 'details' ? 'Question Details' : 'Question Bank' }}</h1>
      <p class="page-subtitle">{{ view === 'list' ? 'Browse standardized writing questions and choose one for Practice Writing.' : 'Read the complete prompt before deciding whether to practise with it.' }}</p>
    </div>
    <button v-if="view === 'list'" class="btn btn-primary" @click="emit('suggest-question')"><FilePlus2 :size="17"/>Suggest a Question</button>
    <button v-else class="btn btn-outline" @click="view = 'list'"><ArrowLeft :size="16"/>Back to bank</button>
  </section>

  <div class="qm-page qm-student-page">
    <section v-if="view === 'list'" class="qm-panel qm-list-panel">
      <div class="qm-bank-bar">
        <div class="qm-tab-strip" role="group" aria-label="Filter questions by IELTS task">
          <button v-for="tab in [{ key:'all', label:'All questions' }, { key:'1', label:'Task 1' }, { key:'2', label:'Task 2' }]"
            :key="tab.key" :class="{ active: filterTask === tab.key }" :aria-pressed="filterTask === tab.key" @click="filterTask = tab.key">
            {{ tab.label }}
          </button>
        </div>
        <span class="qm-student-published"><BookOpenText :size="15"/>{{ published.length }} published questions</span>
      </div>

      <div class="qm-filter-bar">
        <label class="qm-search"><Search :size="17"/><input v-model="search" type="search" placeholder="Search questions, topics, IDs…" aria-label="Search published questions"/></label>
        <select v-model="filterTopic" class="qm-control qm-filter-select" aria-label="Filter by topic">
          <option value="all">All topics</option>
          <option v-for="topic in topics" :key="topic" :value="topic">{{ topic }}</option>
        </select>
        <select v-model="filterSource" class="qm-control qm-filter-select" aria-label="Filter by source">
          <option value="all">All sources</option>
          <option v-for="source in sources" :key="source" :value="source">{{ source }}</option>
        </select>
      </div>

      <div class="qm-table-scroll">
        <table class="qm-table qm-student-table">
          <thead><tr><th>ID</th><th>Question preview</th><th>Task</th><th>Topic</th><th>Status</th><th>Added</th><th class="qm-table-right">Actions</th></tr></thead>
          <tbody>
            <tr v-for="q in visible" :key="q.id">
              <td><strong class="qm-id" :title="q.id">{{ q.id.length > 15 ? q.id.slice(0, 12) + '…' : q.id }}</strong></td>
              <td>
                <button class="qm-question-preview" :aria-label="`View question ${q.id}`" @click="showDetail(q.id)">
                  <span v-if="q.visual" class="qm-small-visual qm-student-thumbnail">
                    <img v-if="q.visual.startsWith('data:')" :src="q.visual" alt="Question image preview"/>
                    <QuestionChart v-else :variant="q.visual"/>
                  </span>
                  <span>{{ previewText(q.question, 100) }}</span>
                </button>
              </td>
              <td><span class="qm-task-pill">Task {{ q.task }}</span></td>
              <td>{{ q.topic || '—' }}</td>
              <td><span class="qm-status qm-status-active">Active</span></td>
              <td class="qm-nowrap">{{ friendlyDate(q.createdAt) }}</td>
              <td>
                <div class="qm-row-actions qm-student-actions">
                  <button class="qm-square qm-student-view" :title="`View full question ${q.id}`" :aria-label="`View ${q.id}`" @click="showDetail(q.id)"><Eye :size="16"/><span>View</span></button>
                  <button class="btn btn-primary qm-student-use" :aria-label="`Use ${q.id} in Practice Writing`" @click="choose(q)"><SquarePen :size="15"/>Use in Practice</button>
                </div>
              </td>
            </tr>
            <tr v-if="!visible.length"><td colspan="7" class="qm-table-empty">No published questions match your search. Try another task, topic, or keyword.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="qm-table-footer">
        <span>Showing {{ filtered.length ? pageIndex * pageSize + 1 : 0 }}–{{ Math.min((pageIndex + 1) * pageSize, filtered.length) }} of {{ filtered.length }} questions</span>
        <div class="qm-pagination">
          <button :disabled="pageIndex === 0" aria-label="Previous page" @click="pageIndex--"><ChevronLeft :size="17"/></button>
          <span>Page {{ pageIndex + 1 }} of {{ pageCount }}</span>
          <button :disabled="pageIndex >= pageCount - 1" aria-label="Next page" @click="pageIndex++"><ChevronRight :size="17"/></button>
        </div>
      </div>
    </section>

    <section v-else-if="view === 'details' && selected" class="qm-panel qm-detail">
      <div class="qm-panel-title">
        <div><h2>Question {{ selected.id }}</h2><p>Added {{ friendlyDate(selected.createdAt) }} · {{ selected.source || 'No source specified' }}</p></div>
        <span class="qm-status qm-status-active">Active</span>
      </div>
      <div class="qm-detail-cols">
        <div>
          <div class="qm-detail-essay"><span>QUESTION TEXT</span><p>{{ selected.question }}</p></div>
          <div v-if="selected.visual" class="qm-detail-image">
            <strong>Task 1 visual</strong>
            <img v-if="selected.visual.startsWith('data:')" :src="selected.visual" alt="Full Task 1 question image"/>
            <QuestionChart v-else :variant="selected.visual"/>
          </div>
          <p v-if="selected.visualNotes" class="qm-visual-note">Visual notes: {{ selected.visualNotes }}</p>
        </div>
        <dl class="qm-info-grid">
          <div><dt>Task type</dt><dd>Task {{ selected.task }}</dd></div>
          <div><dt>Topic</dt><dd>{{ selected.topic || '—' }}</dd></div>
          <div><dt>Source</dt><dd>{{ selected.source || 'Not specified' }}</dd></div>
          <div><dt>Publication</dt><dd>Active</dd></div>
          <div><dt>Added</dt><dd>{{ friendlyDate(selected.createdAt) }}</dd></div>
        </dl>
      </div>
      <div class="qm-form-footer">
        <button class="btn btn-outline" @click="view = 'list'"><ArrowLeft :size="16"/>Back to bank</button>
        <button class="btn btn-primary" @click="choose(selected)"><SquarePen :size="16"/>Use in Practice</button>
      </div>
    </section>

    <div class="qm-demo-note"><Info :size="16"/>Select “Use in Practice” to open Practice Writing with the correct task, prompt, and Task 1 visual already filled in. This question bank uses local demo data.</div>
  </div>
</template>
