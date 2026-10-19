<script setup>
import { computed } from 'vue'
const props = defineProps({ variant: { type: String, default: 'students-chart' } })
const isEnergy = computed(() => props.variant === 'energy-chart')
const title = computed(() => isEnergy.value
  ? 'Electricity generated from renewable sources (%)'
  : 'International students in four countries (thousands)')
const years = ['2010', '2012', '2014', '2016', '2018', '2020']
const labels = ['USA', 'UK', 'Australia', 'Canada']
const colors = ['#d32f45', '#359d81', '#f0ad43', '#7e78bf']
const students = [
  [96, 70, 47, 38], [110, 84, 56, 41], [127, 95, 67, 46],
  [145, 112, 79, 53], [166, 124, 88, 61], [187, 141, 102, 73],
]
const energy = [
  [18, 22, 12, 30], [25, 29, 20, 33], [33, 36, 28, 39],
  [38, 44, 35, 47], [46, 52, 42, 51], [55, 62, 49, 60],
]
const series = computed(() => isEnergy.value ? energy : students)
const top = computed(() => isEnergy.value ? 70 : 200)
const ticks = computed(() => isEnergy.value ? [0, 20, 40, 60] : [0, 50, 100, 150, 200])
const y = (value) => 252 - (value / top.value) * 200
</script>
<template>
  <svg viewBox="0 0 700 322" role="img" :aria-label="title" class="question-chart">
    <text x="350" y="22" class="chart-title" text-anchor="middle">{{ title }}</text>
    <g v-for="value in ticks" :key="value">
      <line x1="67" :x2="545" :y1="y(value)" :y2="y(value)" stroke="#e7eaf0" stroke-width="1"/>
      <text x="57" :y="y(value) + 4" text-anchor="end" class="chart-small">{{ value }}</text>
    </g>
    <line x1="67" y1="252" x2="545" y2="252" stroke="#8993a4" stroke-width="1"/>
    <g v-for="(entry, index) in series" :key="index">
      <rect v-for="(value, col) in entry" :key="col"
        :x="81 + index * 77 + col * 12" :y="y(value)"
        width="10" :height="252 - y(value)" :fill="colors[col]" rx="1"/>
      <text :x="103 + index * 77" y="274" text-anchor="middle" class="chart-small">{{ years[index] }}</text>
    </g>
    <g v-for="(label, index) in labels" :key="label">
      <circle cx="578" :cy="92 + index * 31" r="6" :fill="colors[index]" />
      <text x="593" :y="96 + index * 31" class="chart-legend">{{ label }}</text>
    </g>
    <text x="350" y="311" text-anchor="middle" class="chart-note">Illustrative chart for the frontend prototype</text>
  </svg>
</template>
