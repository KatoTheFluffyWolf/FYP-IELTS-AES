<script setup>
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
const props = defineProps({ title: { type: String, required: true }, wide: Boolean })
const emit = defineEmits(['close'])
function keydown(event) { if (event.key === 'Escape') emit('close') }
onMounted(() => window.addEventListener('keydown', keydown))
onUnmounted(() => window.removeEventListener('keydown', keydown))
</script>
<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="emit('close')">
      <section class="modal" :class="{ 'modal-wide': wide }" role="dialog" aria-modal="true" :aria-label="title">
        <div class="modal-heading">
          <h2>{{ title }}</h2>
          <button type="button" class="icon-button" aria-label="Close dialog" @click="emit('close')"><X :size="19"/></button>
        </div>
        <div class="modal-body"><slot /></div>
        <div v-if="$slots.footer" class="modal-footer"><slot name="footer" /></div>
      </section>
    </div>
  </Teleport>
</template>
