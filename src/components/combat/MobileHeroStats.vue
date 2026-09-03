<script setup lang="ts">
import { computed } from 'vue'
import type { Hero } from '@/core/Hero'

const props = defineProps<{
  hero: Hero
}>()

interface StatRow {
  label: string
  value: string
  section: 'stats' | 'defense'
}

function reductionPct(def: number): number {
  return Math.max(0, Math.min(50, Math.floor((def - 10) * 0.5 * 10) / 10))
}

const rows = computed<StatRow[]>(() => {
  const p = props.hero
  const def = p.defense()
  const rpct = reductionPct(def)
  return [
    { section: 'stats', label: 'ATQ', value: String(p.attack()) },
    { section: 'stats', label: 'DEF', value: String(def) },
    { section: 'stats', label: 'AGI', value: String(Math.round(p.baseStats.agility.value)) },
    { section: 'stats', label: 'CUE', value: String(Math.round(p.baseStats.body.value)) },
    { section: 'stats', label: 'CON', value: String(Math.round(p.baseStats.constitution.value)) },
    { section: 'stats', label: 'MEN', value: String(Math.round(p.baseStats.mind.value)) },
    { section: 'defense', label: 'FÍS', value: `${rpct}%` },
    { section: 'defense', label: 'MAG', value: `${rpct}%` }
  ]
})

const stats = computed(() => rows.value.filter(r => r.section === 'stats'))
const defense = computed(() => rows.value.filter(r => r.section === 'defense'))
</script>

<template>
  <div class="mobile-hero-stats">
    <div class="mobile-hero-stats-section">
      <span class="mobile-hero-stats-title">Stats</span>
      <ul class="mobile-hero-stats-list">
        <li v-for="r in stats" :key="r.label">
          <span class="mobile-hero-stats-label">{{ r.label }}</span>
          <span class="mobile-hero-stats-value">{{ r.value }}</span>
        </li>
      </ul>
    </div>
    <div class="mobile-hero-stats-section">
      <span class="mobile-hero-stats-title">Defensa</span>
      <ul class="mobile-hero-stats-list">
        <li v-for="r in defense" :key="r.label">
          <span class="mobile-hero-stats-label">{{ r.label }}</span>
          <span class="mobile-hero-stats-value">{{ r.value }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.mobile-hero-stats {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.35rem;
  padding: 0.45rem 0.55rem;
  background: rgba(0, 0, 0, 0.45);
  border: 1px dashed rgba(255, 230, 102, 0.3);
  border-radius: 6px;
}

.mobile-hero-stats-section {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.mobile-hero-stats-title {
  font-size: 0.62rem;
  color: #4CAF50;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.mobile-hero-stats-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.15rem 0.5rem;
}

.mobile-hero-stats-list li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.3rem;
  font-family: 'Courier New', monospace;
  font-size: 0.74rem;
}

.mobile-hero-stats-label {
  color: #cfd8dc;
  font-weight: 600;
}

.mobile-hero-stats-value {
  color: #fff;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
}
</style>
