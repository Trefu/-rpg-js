<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IEnemy } from '@/core/interfaces/ICharacter'

const props = defineProps<{
  enemies: IEnemy[]
}>()

const open = ref(false)

const aliveEnemies = computed(() => props.enemies.filter(e => e.isAlive))
const deadEnemies = computed(() => props.enemies.filter(e => !e.isAlive))

interface DerivedStat {
  label: string
  value: string
}

function roundStat(n: number): number {
  return Math.round(n)
}

function roundPct(n: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals)
  return Math.round(n * factor) / factor
}

function derivedFor(enemy: IEnemy): DerivedStat[] {
  const def = enemy.defense()
  const atk = enemy.attack()
  const reductionPct = Math.max(0, Math.min(50, Math.floor((def - 10) * 0.5 * 10) / 10))
  return [
    { label: 'Ataque', value: String(roundStat(atk)) },
    { label: 'Defensa', value: String(roundStat(def)) },
    { label: 'Red. Fisica', value: `${reductionPct}%` },
    { label: 'Red. Magica', value: `${reductionPct}%` },
    { label: 'Agilidad', value: String(roundStat(enemy.baseStats.agility.value)) },
    { label: 'Constitucion', value: String(roundStat(enemy.baseStats.constitution.value)) },
    { label: 'Mente', value: String(roundStat(enemy.baseStats.mind.value)) },
    { label: 'Cuerpo', value: String(roundStat(enemy.baseStats.body.value)) },
    { label: 'Crit Chance', value: `${roundPct(enemy.getEffectiveCritChance(), 1)}%` }
  ]
}

function toggle() {
  open.value = !open.value
}

function hpPercent(e: IEnemy) {
  if (e.maxHealth <= 0) return 0
  return Math.max(0, (e.health / e.maxHealth) * 100)
}
</script>

<template>
  <div class="enemy-debug" :class="{ open }">
    <button
      type="button"
      class="enemy-debug-toggle"
      :aria-expanded="open"
      @click="toggle"
    >
      <span class="enemy-debug-toggle-icon">{{ open ? '×' : '⌘' }}</span>
      <span class="enemy-debug-toggle-label">{{ open ? 'Ocultar' : 'Debug' }}</span>
    </button>

    <div v-if="open" class="enemy-debug-panel" @click.stop>
      <header class="enemy-debug-header">
        <span class="enemy-debug-title">Enemy Debug</span>
        <span class="enemy-debug-subtitle">{{ enemies.length }} total · {{ aliveEnemies.length }} vivos</span>
      </header>

      <ul class="enemy-debug-list">
        <li
          v-for="enemy in enemies"
          :key="enemy.id"
          class="enemy-debug-entry"
          :class="{ dead: !enemy.isAlive }"
        >
          <div class="enemy-debug-entry-head">
            <img v-if="enemy.sprite" :src="enemy.sprite" :alt="enemy.name" class="enemy-debug-sprite" />
            <div class="enemy-debug-entry-info">
              <div class="enemy-debug-name">{{ enemy.name }}</div>
              <div class="enemy-debug-meta">
                Nv {{ enemy.level }} · {{ enemy.health }}/{{ enemy.maxHealth }} HP
              </div>
              <div class="enemy-debug-hpbar">
                <div class="enemy-debug-hpfill" :style="{ width: `${hpPercent(enemy)}%` }"></div>
              </div>
            </div>
          </div>

          <ul class="enemy-debug-stats">
            <li v-for="stat in derivedFor(enemy)" :key="stat.label">
              <span class="enemy-debug-stat-label">{{ stat.label }}</span>
              <span class="enemy-debug-stat-value">{{ stat.value }}</span>
            </li>
          </ul>

          <div v-if="enemy.statusEffects && enemy.statusEffects.length > 0" class="enemy-debug-effects">
            <span class="enemy-debug-effects-label">Efectos:</span>
            <span
              v-for="eff in enemy.statusEffects"
              :key="eff.type"
              class="enemy-debug-effect-chip"
              :class="{ buff: eff.isBuff, debuff: !eff.isBuff }"
            >
              {{ eff.name }}{{ eff.turns !== undefined && eff.turns !== Infinity ? ` (${eff.turns}t)` : '' }}{{ typeof eff.charges === 'number' ? ` (${eff.charges}c)` : '' }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.enemy-debug {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 150;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  pointer-events: none;
}

.enemy-debug > * {
  pointer-events: auto;
}

.enemy-debug-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 0.95rem;
  border-radius: 8px;
  border: 1.5px solid rgba(255, 152, 0, 0.65);
  background: linear-gradient(135deg, rgba(40, 20, 0, 0.92), rgba(15, 10, 0, 0.96));
  color: #ffe066;
  font-family: 'Courier New', monospace;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
  text-transform: uppercase;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
}

.enemy-debug-toggle:hover {
  transform: translateY(-1px);
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.4), rgba(180, 60, 0, 0.45));
  box-shadow: 0 6px 18px rgba(255, 152, 0, 0.5);
}

.enemy-debug-toggle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: rgba(255, 152, 0, 0.25);
  color: #ffe066;
  font-size: 0.85rem;
  line-height: 1;
}

.enemy-debug-panel {
  width: 380px;
  max-height: 80vh;
  overflow-y: auto;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 152, 0, 0.55);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.6), 0 0 18px rgba(255, 152, 0, 0.18);
  padding: 0.95rem 1.1rem;
  color: #fff;
}

.enemy-debug-header {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid rgba(255, 152, 0, 0.25);
  margin-bottom: 0.6rem;
}

.enemy-debug-title {
  font-family: 'Georgia', serif;
  font-weight: 700;
  font-size: 1.18rem;
  color: #ffe066;
  text-shadow: 0 1px 2px #000;
}

.enemy-debug-subtitle {
  font-size: 0.84rem;
  color: #b6f5b6;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.enemy-debug-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.enemy-debug-entry {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.55rem 0.65rem;
}

.enemy-debug-entry.dead {
  opacity: 0.55;
  filter: grayscale(50%);
}

.enemy-debug-entry-head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.5rem;
}

.enemy-debug-sprite {
  width: 54px;
  height: 54px;
  border-radius: 7px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.enemy-debug-entry-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.enemy-debug-name {
  font-family: 'Georgia', serif;
  font-weight: 700;
  color: #ffe066;
  font-size: 1.08rem;
  text-shadow: 0 1px 2px #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.enemy-debug-meta {
  font-size: 0.82rem;
  color: #cfd8dc;
  font-family: 'Courier New', monospace;
}

.enemy-debug-hpbar {
  position: relative;
  height: 8px;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 4px;
  overflow: hidden;
}

.enemy-debug-hpfill {
  height: 100%;
  background: linear-gradient(90deg, #66bb6a 0%, #2e7d32 100%);
  transition: width 0.3s ease;
}

.enemy-debug-stats {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem 0.45rem;
}

.enemy-debug-stats li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-family: 'Courier New', monospace;
}

.enemy-debug-stat-label {
  color: #aaa;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
}

.enemy-debug-stat-value {
  color: #fff;
  font-size: 0.88rem;
  font-weight: 700;
  text-shadow: 0 1px 2px #000;
}

.enemy-debug-effects {
  margin-top: 0.45rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: center;
}

.enemy-debug-effects-label {
  font-size: 0.78rem;
  color: #888;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-right: 0.15rem;
}

.enemy-debug-effect-chip {
  font-size: 0.78rem;
  font-family: 'Courier New', monospace;
  padding: 0.15rem 0.5rem;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cfd8dc;
}

.enemy-debug-effect-chip.buff {
  background: rgba(102, 187, 106, 0.22);
  border-color: rgba(102, 187, 106, 0.55);
  color: #b6f5b6;
}

.enemy-debug-effect-chip.debuff {
  background: rgba(255, 138, 58, 0.18);
  border-color: rgba(255, 138, 58, 0.5);
  color: #ffd8a8;
}

.enemy-debug-panel::-webkit-scrollbar {
  width: 6px;
}
.enemy-debug-panel::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}
.enemy-debug-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 152, 0, 0.5);
  border-radius: 3px;
}
</style>
