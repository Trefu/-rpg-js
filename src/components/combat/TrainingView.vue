<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { Dummy } from '@/core/enemies/Dummy'
import { StatusEffects } from '@/core/StatusEffects'
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
  createBasicAttackAbility,
  createStunStrikeAbility,
  createStealthStrikeAbility,
  createFireballAbility
} from '@/core/abilities/Abilities'
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

const emit = defineEmits<{
  (e: 'trainingEnded'): void
}>()

const gameStore = useGameStore()
const dummy = ref<Dummy>(new Dummy(gameStore.activeHero?.level ?? 1))

const selectedPatternIndex = ref<number>(-1)
const damageValue = ref<number>(dummy.value.baseAttack)
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
  get: () => Math.round(critChanceValue.value * 100),
  set: (percent: number) => { critChanceValue.value = Math.max(0, Math.min(1, percent / 100)) }
})

const critChancePercentLabel = computed(() => `${Math.round(critChanceValue.value * 100)}%`)

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
  damageValue.value = dummy.value.baseAttack
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

function learnAbility(abilityType: 'attack' | 'stunStrike' | 'stealthStrike' | 'fireball') {
  const p = gameStore.activeHero
  if (!p) return
  if (p.abilities.find(a => a.type === abilityType)) return
  let ability
  switch (abilityType) {
    case 'attack': ability = createBasicAttackAbility(); break
    case 'stunStrike': ability = createStunStrikeAbility(); break
    case 'stealthStrike': ability = createStealthStrikeAbility(); break
    case 'fireball': ability = createFireballAbility(); break
  }
  if (ability) p.learnAbility(ability)
}

function onTrainingEnded() {
  emit('trainingEnded')
}
</script>

<template>
  <div class="training-view">
    <div class="combat-wrapper">
      <CombatView
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
          <p v-else class="section-hint">Daño por defecto ({{ dummy.baseAttack + dummy.level }})</p>
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
              max="100"
              step="5"
              v-model.number="critChancePercentProxy"
              class="crit-range"
            />
            <span class="damage-value crit-value">{{ critChancePercentLabel }}</span>
          </div>
          <p v-else class="section-hint">Crítico deshabilitado (0%)</p>
        </section>

        <section class="panel-section">
          <h3><img :src="personIcon" alt="" class="inline-icon" /> Jugador</h3>
          <div class="button-grid two-col">
            <button class="action-btn" @click="gameStore.activeHero && (gameStore.activeHero.health = gameStore.activeHero.maxHealth)"><img :src="heartIcon" alt="" class="btn-icon" /> Curar</button>
            <button class="action-btn" @click="gameStore.activeHero && (gameStore.activeHero.statusEffects = [])"><img :src="broomIcon" alt="" class="btn-icon" /> Limpiar efectos</button>
          </div>
        </section>

        <section class="panel-section">
          <h3><img :src="sparklesIcon" alt="" class="inline-icon" /> Habilidades</h3>
          <p class="section-hint">Aprende habilidades para probarlas ({{ playerAbilitiesCount }}/4)</p>
          <div class="button-grid two-col">
            <button class="action-btn small" :disabled="!gameStore.activeHero || !!gameStore.activeHero.abilities.find(a => a.type === 'attack')" @click="learnAbility('attack')">Ataque</button>
            <button class="action-btn small" :disabled="!gameStore.activeHero || !!gameStore.activeHero.abilities.find(a => a.type === 'stunStrike')" @click="learnAbility('stunStrike')">Aturdidor</button>
            <button class="action-btn small" :disabled="!gameStore.activeHero || !!gameStore.activeHero.abilities.find(a => a.type === 'stealthStrike')" @click="learnAbility('stealthStrike')">Sigiloso</button>
            <button class="action-btn small" :disabled="!gameStore.activeHero || !!gameStore.activeHero.abilities.find(a => a.type === 'fireball')" @click="learnAbility('fireball')">Bola de Fuego</button>
          </div>
        </section>

        <section class="panel-section">
          <h3><img :src="skullIcon" alt="" class="inline-icon" /> Aplicar Estado al Jugador</h3>
          <p class="section-hint">Para probar modificadores de defensa</p>
          <div class="button-grid three-col">
            <button class="action-btn small debuff" @click="applyStatusToPlayer('stun')">Aturdir</button>
            <button class="action-btn small debuff" @click="applyStatusToPlayer('burn')">Quemar</button>
            <button class="action-btn small debuff" @click="applyStatusToPlayer('poison')">Veneno</button>
            <button class="action-btn small debuff" @click="applyStatusToPlayer('weakness')">Debilitar</button>
            <button class="action-btn small debuff" @click="applyStatusToPlayer('slow')">Ralentizar</button>
            <button class="action-btn small buff" @click="applyStatusToPlayer('defense_boost')">+Defensa</button>
            <button class="action-btn small buff" @click="applyStatusToPlayer('speed_boost')">+Velocidad</button>
            <button class="action-btn small buff" @click="applyStatusToPlayer('strength_boost')">+Fuerza</button>
          </div>
        </section>

        <section class="panel-section">
          <h3><img :src="cycleIcon" alt="" class="inline-icon" /> Reset</h3>
          <div class="button-grid">
            <button class="action-btn warn" @click="resetDummy">Reiniciar Dummy</button>
          </div>
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
</style>
