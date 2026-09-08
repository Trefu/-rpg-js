<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { Dummy } from '@/core/enemies/Dummy'
import { StatusEffects, DOT_STATUS_TYPES } from '@/core/StatusEffects'
import hammerIcon from '@/assets/icons/hammer-drop.png'
import robotIcon from '@/assets/icons/robot-golem.png'
import swordsIcon from '@/assets/icons/crossed-swords.png'
import burstIcon from '@/assets/icons/explosion-rays.png'
import personIcon from '@/assets/icons/person.png'
import heartIcon from '@/assets/icons/heart-drop.png'
import broomIcon from '@/assets/icons/broom.png'
import sparklesIcon from '@/assets/icons/sparkles.png'
import skullIcon from '@/assets/icons/skull-shield.png'
import cycleIcon from '@/assets/icons/cycle.png'
import doorIcon from '@/assets/icons/door.png'
import cancelIcon from '@/assets/icons/logic-gate-not.png'
import {
  BasicAttack,
  StunStrike,
  StealthStrike,
  Fireball,
  WarriorInjuringStrike,
  WarriorDevastatingStrike,
  ClericRadiantStrike,
  ClericDivineSmite,
  ClericHeal,
  SecondWind
} from '@/core/abilities/Abilities'
import type { IAbility } from '@/core/interfaces/IAbility'
import {
  SLASH,
  DEEP_SLASH,
  POISON_ARROW,
  EMBER,
  FEROCIOUS_BITE,
  QUICK_CLAWS,
  MULTIPLE_AXE_STRIKES,
  CRUSHING_BLOW,
  GENTLE_STRIKE,
  QUICK_STRIKE,
  DOUBLE_COMBO,
  TRIPLE_COMBO,
  FIRE_BREATH,
  GLACIAL_BREATH
} from '@/core/abilities/EnemyAttacks'
import CombatView from './CombatView.vue'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import type { DefensePatternConfig } from '@/core/defense/types'
import { RECRUITABLE_HEROES } from '@/core/heroes/recruitment'
import { MAX_HEROES } from '@/stores/game'
import type { Hero } from '@/core/Hero'

const ALL_DUMMY_PATTERNS: DefensePatternConfig[] = [
  SLASH,
  DEEP_SLASH,
  POISON_ARROW,
  EMBER,
  FEROCIOUS_BITE,
  QUICK_CLAWS,
  MULTIPLE_AXE_STRIKES,
  CRUSHING_BLOW,
  GENTLE_STRIKE,
  QUICK_STRIKE,
  DOUBLE_COMBO,
  TRIPLE_COMBO,
  FIRE_BREATH,
  GLACIAL_BREATH
]

function describePattern(p: DefensePatternConfig): string {
  const speed = p.waveSpeed ?? 30
  const speedLabel = speed <= 30 ? 'lenta' : speed <= 45 ? 'media' : 'alta'
  const phases = p.phases?.length ?? 1
  const phaseLabel = phases === 1 ? '1 fase' : `${phases} fases`
  const zoneLabel = p.baseSuccessZoneSize !== undefined
    ? `zona ${Math.round(p.baseSuccessZoneSize * 100)}%`
    : (p.phases?.some(ph => ph.columnCount !== undefined)
        ? `zona ${p.phases.find(ph => ph.columnCount !== undefined)?.columnCount} col`
        : (p.phases?.some(ph => ph.successColumns !== undefined) ? 'zona fija' : 'zona amplia'))
  const dmg = `x${p.damageMultiplier.toFixed(1)}`
  const effect = p.onFailureEffect
    ? `, aplica ${p.onFailureEffect.statusType} al fallar`
    : ''
  return `${phaseLabel}, velocidad ${speedLabel}, ${zoneLabel}, ${dmg}${effect}`
}

const ATTACK_PATTERN_LABELS: Array<{ label: string; description: string }> =
  ALL_DUMMY_PATTERNS.map(p => ({
    label: p.name ?? 'Ataque',
    description: describePattern(p)
  }))

const TRAINABLE_ABILITIES: IAbility[] = [
  StunStrike,
  StealthStrike,
  Fireball,
  WarriorInjuringStrike,
  WarriorDevastatingStrike,
  ClericRadiantStrike,
  ClericDivineSmite,
  ClericHeal,
  SecondWind
]

const negativeStatusEffects = computed(() =>
  StatusEffects.getRegisteredTypes()
    .map(type => StatusEffects.getByType(type))
    .filter((effect): effect is IStatusEffect =>
      effect !== null && effect.isBuff === false && !DOT_STATUS_TYPES.has(effect.type)
    )
    .map(effect => ({
      type: effect.type,
      label: effect.name,
      description: effect.description ?? ''
    }))
)

const dotStatusEffects = computed(() =>
  Array.from(DOT_STATUS_TYPES)
    .map(type => StatusEffects.getByType(type))
    .filter((effect): effect is IStatusEffect => effect !== null)
    .map(effect => ({
      type: effect.type,
      label: effect.name,
      description: effect.description ?? ''
    }))
)

const emit = defineEmits<{
  (e: 'trainingEnded'): void
}>()

const gameStore = useGameStore()
const dummy = ref<Dummy>(new Dummy(gameStore.activeHero?.level ?? 1))

const trainingSessionKey = ref(0)
const rosterClass = ref<string[]>(Array.from({ length: MAX_HEROES }, () => ''))

function syncRosterFromStore() {
  for (let i = 0; i < MAX_HEROES; i++) {
    const hero = gameStore.heroes[i]
    rosterClass.value[i] = hero?.heroClassId ?? ''
  }
}
syncRosterFromStore()

function buildHeroFromRegistry(classId: string, targetLevel: number): Hero | null {
  const entry = RECRUITABLE_HEROES.find(h => h.id === classId)
  if (!entry) return null
  const hero = entry.factory()
  const level = Math.max(1, Math.floor(targetLevel))
  for (let i = 1; i < level; i++) hero.levelUp()
  hero.isAlive = true
  hero.health = hero.maxHealth
  hero.energy = hero.maxEnergy
  hero.statusEffects = []
  return hero
}

function rebuildDummy() {
  const level = Math.max(1, gameStore.activeHero?.level ?? 1)
  dummy.value = new Dummy(level)
  selectedPatternIndex.value = -1
  damageValue.value = dummy.value.attack()
  useCustomDamage.value = false
  critChanceValue.value = 0
  useCustomCrit.value = false
}

function applyRoster() {
  const level = Math.max(1, gameStore.activeHero?.level ?? 1)
  for (let i = 0; i < MAX_HEROES; i++) {
    const classId = rosterClass.value[i]
    if (!classId) continue
    const hero = buildHeroFromRegistry(classId, level)
    if (!hero) continue
    gameStore.setHeroInSlot(i, hero, false)
  }
  const firstActiveIdx = gameStore.heroes.findIndex(h => h !== null)
  if (firstActiveIdx >= 0) gameStore.setActiveHero(firstActiveIdx)
  trainingSessionKey.value++
  rebuildDummy()
  syncRosterFromStore()
}

function adjustSlotLevel(index: number, delta: number) {
  if (index < 0 || index >= MAX_HEROES) return
  const current = gameStore.heroes[index]
  if (!current) return
  const classId = rosterClass.value[index] || current.heroClassId
  if (!classId) return
  const newLevel = Math.max(1, current.level + delta)
  const hero = buildHeroFromRegistry(classId, newLevel)
  if (!hero) return
  gameStore.setHeroInSlot(index, hero, false)
  trainingSessionKey.value++
  rebuildDummy()
  syncRosterFromStore()
}

const activeHeroClassLabel = computed(() => {
  const active = gameStore.activeHero
  if (!active) return ''
  const entry = RECRUITABLE_HEROES.find(e => e.id === active.heroClassId)
  return entry?.displayName ?? ''
})

watch(() => gameStore.activeHero?.level, () => rebuildDummy())

const selectedPatternIndex = ref<number>(-1)
const damageValue = ref<number>(dummy.value.attack())
const useCustomDamage = ref<boolean>(false)
const critChanceValue = ref<number>(0)
const useCustomCrit = ref<boolean>(false)
const panelCollapsed = ref<boolean>(false)

const patterns = computed<DefensePatternConfig[]>(() => ALL_DUMMY_PATTERNS)
const currentForcedLabel = computed(() => {
  if (selectedPatternIndex.value < 0) return 'Aleatorio'
  return ALL_DUMMY_PATTERNS[selectedPatternIndex.value]?.name ?? 'Aleatorio'
})

const playerAbilitiesCount = computed(() => gameStore.activeHero?.abilities.length ?? 0)

const critChancePercentProxy = computed<number>({
  get: () => Math.round(critChanceValue.value),
  set: (percent: number) => { critChanceValue.value = Math.max(0, Math.min(200, percent)) }
})

const critChancePercentLabel = computed(() => `${Math.round(critChanceValue.value)}%`)

function selectPattern(index: number) {
  selectedPatternIndex.value = index
  if (index < 0) {
    dummy.value.setForcedPattern(null)
  } else {
    const pattern = patterns.value[index]
    if (pattern) dummy.value.setForcedPattern(pattern)
  }
}

function applyDamageChange() {
  dummy.value.setDamageOverride(useCustomDamage.value ? damageValue.value : null)
}

function applyCritChange() {
  dummy.value.setCritChanceOverride(useCustomCrit.value ? critChanceValue.value : null)
}

watch(damageValue, () => applyDamageChange())
watch(useCustomDamage, () => applyDamageChange())
watch(critChanceValue, () => applyCritChange())
watch(useCustomCrit, () => applyCritChange())

function resetDummy() {
  dummy.value.reset()
  selectedPatternIndex.value = -1
  damageValue.value = dummy.value.attack()
  useCustomDamage.value = false
  critChanceValue.value = 0
  useCustomCrit.value = false
}

function applyStatusToPlayer(type: 'stun' | 'burn' | 'poison' | 'defense_boost' | 'speed_boost' | 'weakness' | 'slow' | 'strength_boost') {
  const p = gameStore.activeHero
  if (!p) return
  const template = StatusEffects.getByType(type)
  if (!template) return
  const effect: IStatusEffect = { ...template, turns: 3 }
  p.addStatusEffect(effect)
}

function learnAbilityFromList(ability: IAbility) {
  const p = gameStore.activeHero
  if (!p) return
  if (ability.type === 'attack') return
  if (p.abilities.some(a => a.type === ability.type)) return
  if (p.abilities.length >= 4) return
  p.learnAbility(ability)
}

function activeHeroHasAbility(type: string): boolean {
  return gameStore.activeHero?.abilities.some(a => a.type === type) ?? false
}

const abilityLabels = computed(() =>
  TRAINABLE_ABILITIES.map(a => ({
    ability: a,
    label: a.name,
    description: a.description
  }))
)

const activeHeroAbilityCount = computed(() => gameStore.activeHero?.abilities.length ?? 0)

function onTrainingEnded() {
  emit('trainingEnded')
}
</script>

<template>
  <div class="training-view">
    <div class="combat-wrapper">
      <CombatView
        :key="trainingSessionKey"
        :enemy-list="[dummy]"
        :is-training="true"
        @training-ended="onTrainingEnded"
      />
    </div>

    <aside class="training-panel" :class="{ collapsed: panelCollapsed }">
      <button class="collapse-btn" @click="panelCollapsed = !panelCollapsed" :title="panelCollapsed ? 'Expandir panel' : 'Colapsar panel'">
        <img :src="cancelIcon" alt="" class="chevron-icon" :class="{ collapsed: panelCollapsed }" />
      </button>

      <div v-show="!panelCollapsed" class="panel-content">
        <header class="panel-header">
          <h2><img :src="hammerIcon" alt="" class="inline-icon" /> Zona de Pruebas</h2>
          <p class="subtitle">Configura el dummy y al jugador</p>
        </header>

        <section class="panel-section">
          <h3><img :src="personIcon" alt="" class="inline-icon" /> Heroe Activo</h3>
          <p class="section-hint">{{ activeHeroClassLabel || 'Sin heroe' }} — Nv {{ gameStore.activeHero?.level ?? '—' }}</p>
          <div class="button-grid two-col">
            <button class="action-btn" @click="gameStore.activeHero && (gameStore.activeHero.health = gameStore.activeHero.maxHealth)"><img :src="heartIcon" alt="" class="btn-icon" /> Curar</button>
            <button class="action-btn" @click="gameStore.activeHero && (gameStore.activeHero.statusEffects = [])"><img :src="broomIcon" alt="" class="btn-icon" /> Limpiar efectos</button>
          </div>
        </section>

        <section class="panel-section">
          <h3><img :src="robotIcon" alt="" class="inline-icon" /> Ataques del Dummy</h3>
          <p class="section-hint">El dummy usará el ataque seleccionado en su próximo turno.</p>
          <div class="pattern-scroll">
            <button
              class="pattern-btn random-btn"
              :class="{ active: selectedPatternIndex === -1 }"
              @click="selectPattern(-1)"
            >
              <span class="pattern-label">Aleatorio</span>
              <span class="pattern-desc">El dummy elige uno de sus ataques al azar</span>
            </button>
            <button
              v-for="(item, idx) in ATTACK_PATTERN_LABELS"
              :key="idx"
              class="pattern-btn"
              :class="{ active: selectedPatternIndex === idx }"
              @click="selectPattern(idx)"
            >
              <span class="pattern-label">{{ item.label }}</span>
              <span class="pattern-desc">{{ item.description }}</span>
            </button>
          </div>
          <div class="current-pattern">
            <span class="badge">Actual:</span>
            <strong>{{ currentForcedLabel }}</strong>
          </div>
          <div class="button-grid">
            <button class="action-btn warn" @click="resetDummy"><img :src="cycleIcon" alt="" class="btn-icon" /> Resetear Dummy</button>
          </div>
        </section>

        <section class="panel-section">
          <h3><img :src="swordsIcon" alt="" class="inline-icon" /> Daño del Dummy</h3>
          <label class="checkbox-row">
            <input type="checkbox" v-model="useCustomDamage" />
            <span>Usar daño personalizado</span>
          </label>
          <div v-if="useCustomDamage" class="damage-control">
            <input type="range" min="0" max="100" step="1" v-model.number="damageValue" />
            <span class="damage-value">{{ damageValue }}</span>
          </div>
          <p v-else class="section-hint">Daño por defecto ({{ dummy.attack() }})</p>
        </section>

        <section class="panel-section crit-section">
          <h3><img :src="burstIcon" alt="" class="inline-icon" /> Crítico del Dummy</h3>
          <label class="checkbox-row">
            <input type="checkbox" v-model="useCustomCrit" />
            <span>Forzar probabilidad de crítico</span>
          </label>
          <div v-if="useCustomCrit" class="damage-control">
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              v-model.number="critChancePercentProxy"
              class="crit-range"
            />
            <span class="damage-value crit-value">{{ critChancePercentLabel }}</span>
          </div>
          <p v-else class="section-hint">Crítico deshabilitado (0%)</p>
        </section>

        <section class="panel-section">
          <h3><img :src="sparklesIcon" alt="" class="inline-icon" /> Habilidades</h3>
          <p class="section-hint">Solo se aplican al heroe activo. Tope 4 habilidades (sin contar el ataque básico). Actuales: {{ activeHeroAbilityCount }}/4</p>
          <div class="pattern-scroll">
            <button
              v-for="item in abilityLabels"
              :key="item.ability.type"
              class="pattern-btn"
              :class="{ active: activeHeroHasAbility(item.ability.type) }"
              :disabled="!gameStore.activeHero || activeHeroHasAbility(item.ability.type) || activeHeroAbilityCount >= 4"
              @click="learnAbilityFromList(item.ability)"
            >
              <span class="pattern-label">{{ item.label }}</span>
              <span class="pattern-desc">{{ item.description }}</span>
            </button>
          </div>
        </section>

        <section class="panel-section">
          <h3><img :src="skullIcon" alt="" class="inline-icon" /> Estados Negativos</h3>
          <p class="section-hint">Aplica efectos negativos al heroe activo.</p>
          <div class="pattern-scroll">
            <button
              v-for="status in negativeStatusEffects"
              :key="status.type"
              class="pattern-btn"
              :disabled="!gameStore.activeHero"
              @click="applyStatusToPlayer(status.type as any)"
            >
              <span class="pattern-label">{{ status.label }}</span>
              <span class="pattern-desc">{{ status.description }}</span>
            </button>
          </div>
        </section>

        <section class="panel-section">
          <h3><img :src="burstIcon" alt="" class="inline-icon" /> Estados DoT</h3>
          <p class="section-hint">Aplica daño por turno al heroe activo.</p>
          <div class="pattern-scroll">
            <button
              v-for="status in dotStatusEffects"
              :key="status.type"
              class="pattern-btn"
              :disabled="!gameStore.activeHero"
              @click="applyStatusToPlayer(status.type as any)"
            >
              <span class="pattern-label">{{ status.label }}</span>
              <span class="pattern-desc">{{ status.description }}</span>
            </button>
          </div>
        </section>

        <section class="panel-section">
          <h3><img :src="personIcon" alt="" class="inline-icon" /> Heroes en Sala de Pruebas</h3>
          <p class="section-hint">Elige la clase de cada slot y ajusta su nivel con los botones +/−. El heroe activo aparece resaltado. Desde el nivel 4 el ataque basico golpea dos veces.</p>
          <div class="active-hero-row">
            <span class="active-hero-label">Activo:</span>
            <strong>{{ gameStore.activeHero?.name ?? '—' }}</strong>
            <span class="active-hero-class" v-if="activeHeroClassLabel">— {{ activeHeroClassLabel }}</span>
            <span class="active-hero-level">Nv {{ gameStore.activeHero?.level ?? '—' }}</span>
          </div>
          <div class="roster-list">
            <div
              v-for="i in MAX_HEROES"
              :key="i - 1"
              class="roster-row"
              :class="{ 'active-slot': gameStore.activeHeroIndex === i - 1 }"
            >
              <span class="roster-slot">Slot {{ i }}</span>
              <select v-model="rosterClass[i - 1]">
                <option value="">— Vacío —</option>
                <option v-for="entry in RECRUITABLE_HEROES" :key="entry.id" :value="entry.id">{{ entry.displayName }}</option>
              </select>
              <div class="slot-level">
                <span class="slot-level-value">Nv {{ gameStore.heroes[i - 1]?.level ?? '—' }}</span>
                <button
                  class="level-btn"
                  :disabled="!gameStore.heroes[i - 1] || gameStore.heroes[i - 1]!.level <= 1"
                  @click="adjustSlotLevel(i - 1, -1)"
                >−</button>
                <button
                  class="level-btn"
                  :disabled="!gameStore.heroes[i - 1]"
                  @click="adjustSlotLevel(i - 1, +1)"
                >+</button>
              </div>
            </div>
          </div>
          <button class="action-btn apply-roster-btn" @click="applyRoster">Aplicar</button>
        </section>

        <footer class="panel-footer">
          <button class="action-btn danger big" @click="onTrainingEnded"><img :src="doorIcon" alt="" class="btn-icon" /> Salir del Entrenamiento</button>
        </footer>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.training-view {
  display: flex;
  width: 100vw;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.combat-wrapper {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.combat-wrapper :deep(.combat-view) {
  height: 100%;
}

/* Aumentar la UI del jugador y el log solo dentro del training */
.combat-wrapper :deep(.player-ui) {
  height: auto;
  max-height: 100%;
  bottom: 16px;
}

.combat-wrapper :deep(.combat-log-box) {
  height: 100%;
}

.combat-wrapper :deep(.combat-log) {
  max-height: none;
  flex: 1;
  min-height: 140px;
}

.combat-wrapper :deep(.log-message) {
  font-size: 0.8rem;
  margin-bottom: 0.35rem;
  padding: 0.35rem 0.5rem;
}

.training-panel {
  position: relative;
  width: 360px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f1424 100%);
  border-left: 3px solid #4CAF50;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  align-self: stretch;
}

.training-panel.collapsed {
  width: 38px;
}

.collapse-btn {
  position: absolute;
  top: 12px;
  left: -16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #4CAF50;
  background: #1a1a2e;
  color: #ffe600;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}

.collapse-btn:hover {
  background: #2a2a4e;
}

.chevron-icon {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(20deg);
  transition: transform 0.2s ease;
}
.chevron-icon.collapsed { transform: rotate(180deg); }

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.panel-content::-webkit-scrollbar {
  width: 8px;
}

.panel-content::-webkit-scrollbar-track {
  background: #1a1a2e;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #4CAF50;
  border-radius: 4px;
}

.panel-header h2 {
  margin: 0;
  color: #ffe600;
  font-size: 1.25rem;
  text-shadow: 0 0 8px rgba(255, 230, 0, 0.4);
}

.panel-header .subtitle {
  margin: 0.2rem 0 0;
  color: #aaa;
  font-size: 0.78rem;
}

.panel-section {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px;
  padding: 0.75rem;
}

.panel-section h3 {
  margin: 0 0 0.4rem;
  color: #4CAF50;
  font-size: 0.95rem;
}

.section-hint {
  margin: 0 0 0.6rem;
  color: #888;
  font-size: 0.72rem;
  font-style: italic;
}

.pattern-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.pattern-scroll {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px;
}

.pattern-scroll::-webkit-scrollbar {
  width: 6px;
}

.pattern-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.pattern-scroll::-webkit-scrollbar-thumb {
  background: #4CAF50;
  border-radius: 3px;
}

.random-btn {
  border-style: dashed;
}

.pattern-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  background: rgba(40, 40, 60, 0.7);
  border: 2px solid #444;
  border-radius: 6px;
  padding: 0.5rem 0.7rem;
  color: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  font-family: inherit;
}

.pattern-btn:hover {
  background: rgba(60, 60, 90, 0.9);
  border-color: #666;
  transform: translateX(2px);
}

.pattern-btn.active {
  background: linear-gradient(90deg, #4CAF50 0%, #2e7d32 100%);
  border-color: #ffe600;
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.6);
}

.pattern-label {
  font-weight: bold;
  font-size: 0.9rem;
}

.pattern-desc {
  font-size: 0.7rem;
  color: #ccc;
}

.pattern-btn.active .pattern-desc {
  color: #e8f5e9;
}

.current-pattern {
  margin-top: 0.6rem;
  padding: 0.4rem 0.6rem;
  background: rgba(255, 230, 0, 0.1);
  border-left: 3px solid #ffe600;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #fff;
}

.current-pattern .badge {
  color: #ffe600;
  font-weight: bold;
  margin-right: 0.4rem;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  cursor: pointer;
  color: #fff;
  margin-bottom: 0.5rem;
}

.damage-control {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.damage-control input[type="range"] {
  flex: 1;
  accent-color: #4CAF50;
}

.damage-value {
  font-weight: bold;
  color: #ffe600;
  min-width: 32px;
  text-align: right;
}

.panel-section.crit-section {
  border-color: rgba(179, 136, 255, 0.4);
}
.panel-section.crit-section h3 {
  color: #b388ff;
}
.crit-range {
  accent-color: #b388ff;
}
.crit-value {
  color: #dcc6ff;
}

.button-grid {
  display: grid;
  gap: 0.4rem;
}

.button-grid.two-col {
  grid-template-columns: 1fr 1fr;
}

.button-grid.three-col {
  grid-template-columns: 1fr 1fr 1fr;
}

.action-btn {
  background: linear-gradient(180deg, #2a4d2e 0%, #1e3a22 100%);
  color: #fff;
  border: 2px solid #4CAF50;
  border-radius: 6px;
  padding: 0.5rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.action-btn:hover:not(:disabled) {
  background: linear-gradient(180deg, #3a6d3e 0%, #2e5a32 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(76, 175, 80, 0.4);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-btn.small {
  font-size: 0.7rem;
  padding: 0.4rem 0.5rem;
}

.action-btn.buff {
  background: linear-gradient(180deg, #2a4d6e 0%, #1e3a52 100%);
  border-color: #64b5f6;
}

.action-btn.buff:hover:not(:disabled) {
  background: linear-gradient(180deg, #3a6d9e 0%, #2e5a82 100%);
  box-shadow: 0 3px 8px rgba(100, 181, 246, 0.4);
}

.action-btn.debuff {
  background: linear-gradient(180deg, #6e2a2a 0%, #521e1e 100%);
  border-color: #ef5350;
}

.action-btn.debuff:hover:not(:disabled) {
  background: linear-gradient(180deg, #9e3a3a 0%, #822e2e 100%);
  box-shadow: 0 3px 8px rgba(239, 83, 80, 0.4);
}

.action-btn.warn {
  background: linear-gradient(180deg, #6e5a2a 0%, #52441e 100%);
  border-color: #ffb300;
}

.action-btn.warn:hover:not(:disabled) {
  background: linear-gradient(180deg, #9e7d3a 0%, #82602e 100%);
  box-shadow: 0 3px 8px rgba(255, 179, 0, 0.4);
}

.action-btn.danger {
  background: linear-gradient(180deg, #8b1a1a 0%, #5e0e0e 100%);
  border-color: #ff3333;
}

.action-btn.danger:hover:not(:disabled) {
  background: linear-gradient(180deg, #b32424 0%, #801414 100%);
  box-shadow: 0 3px 8px rgba(255, 51, 51, 0.5);
}

.action-btn.big {
  font-size: 0.95rem;
  padding: 0.7rem 1rem;
}

.panel-footer {
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid #333;
}

@media (max-width: 900px) {
  .training-panel {
    width: 300px;
  }
  .combat-wrapper :deep(.player-ui) {
    height: auto;
    max-height: 100%;
  }
}

.inline-icon {
  width: 1.1em;
  height: 1.1em;
  display: inline-block;
  vertical-align: -0.2em;
  margin-right: 0.35rem;
  filter: brightness(0) invert(1);
}
.btn-icon {
  width: 1em;
  height: 1em;
  display: inline-block;
  vertical-align: -0.15em;
  margin-right: 0.3rem;
  filter: brightness(0) invert(1);
}

.active-hero-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.6rem;
  font-size: 0.8rem;
  color: #ffe066;
}
.active-hero-label {
  color: #aaa;
}
.active-hero-level {
  margin-right: auto;
  color: #4CAF50;
  font-weight: 700;
}
.level-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #4CAF50;
  background: #1e3a22;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
.level-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.roster-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.roster-row {
  display: grid;
  grid-template-columns: 50px 1fr auto;
  gap: 0.35rem;
  align-items: center;
  padding: 0.25rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
}
.roster-row.active-slot {
  border-color: rgba(76, 175, 80, 0.7);
  background: rgba(76, 175, 80, 0.12);
}
.roster-slot {
  color: #aaa;
  font-size: 0.7rem;
  font-weight: 700;
}
.roster-row select {
  background: #0f1424;
  color: #fff;
  border: 1px solid #4CAF50;
  border-radius: 4px;
  padding: 0.25rem 0.35rem;
  font-size: 0.78rem;
}
.slot-level {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.slot-level-value {
  color: #ffe066;
  font-weight: 700;
  font-size: 0.78rem;
  min-width: 38px;
  text-align: center;
}
.active-hero-class {
  color: #b6e7b9;
  font-size: 0.75rem;
}
.apply-roster-btn {
  margin-top: 0.6rem;
  width: 100%;
  font-size: 0.85rem;
  padding: 0.5rem 0.6rem;
}
</style>
