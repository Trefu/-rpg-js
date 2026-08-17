<script setup lang="ts">
import '@/styles/combat.css'
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useCombat } from '@/composables/useCombat'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'
import { MAX_HEROES } from '@/stores/game'
import type { Hero } from '@/core/Hero'
import StatsIcon from '@/assets/icons/scroll-unfurled.png'
import EffectsIcon from '@/assets/icons/droplets.png'
import TargetIcon from '@/assets/icons/crosshair.png'
import AbilitiesIcon from '@/assets/icons/shield.png'
import ItemIcon from '@/assets/icons/backpack.png'
import TimingOverlay from './TimingOverlay.vue'
import DefenseChallenge from './DefenseChallenge.vue'
import AnnouncementBanner from './AnnouncementBanner.vue'
import CombatLogModal from './CombatLogModal.vue'
import CombatLogPanel from './CombatLogPanel.vue'
import PlayerHud from './PlayerHud.vue'
import PlayerStatsPanel from './PlayerStatsPanel.vue'
import StatusEffectsPanel from './StatusEffectsPanel.vue'
import HeroCard from './HeroCard.vue'
import EnemyCard from './EnemyCard.vue'
import AbilitiesModal from '@/components/ui/AbilitiesModal.vue'
import type { DefensePhaseResult } from '@/core/defense/types'
import type { IEnemy } from '@/core/interfaces/ICharacter'

const props = defineProps<{
  enemyList?: IEnemy[]
  isTraining?: boolean
}>()

const emit = defineEmits<{
  (e: 'combatEnded', victory: boolean): void
  (e: 'trainingEnded'): void
}>()

const expeditionStore = useExpeditionStore()
const gameStore = useGameStore()

const combatOptions: { isTraining?: boolean; onCombatEnd?: (victory: boolean) => void; onTrainingEnd?: () => void } = {
  onCombatEnd: (victory: boolean) => emit('combatEnded', victory)
}
if (props.isTraining) {
  combatOptions.isTraining = true
  combatOptions.onTrainingEnd = () => emit('trainingEnded')
}

const {
  player,
  heroes,
  enemies,
  selectedEnemy,
  selectedAbility,
  combatLog,
  isCombatEnded,
  isSelectingTarget,
  showTimingOverlay,
  attackingEnemyId,
  enemyHitPopups,
  playerHitPopups,
  showAbilitiesModal,
  abilityCooldowns,
  announcement,
  abilities,
  abilityShortcuts,
  isDefenseActive,
  defensePattern,
  defenseZones,
  defensePhaseIndex,
  openAbilitiesModal,
  closeAbilitiesModal,
  selectAbility,
  handleAbilitiesModalShortcuts,
  handleCombatShortcuts,
  selectEnemy,
  selectAlly,
  selectAction,
  initializeCombat,
  cleanup,
  actionRequiresTarget,
  handleTimingResult,
  isPlayerInputLocked,
  handleDefensePhaseComplete,
  handleDefenseAllPhasesComplete,
  closeDefenseChallenge,
  startPlayerTurn,
  canTargetAllies,
  canTargetEnemies
} = useCombat(combatOptions)

const shouldShowStatusBar = computed(() => {
  return !isCombatEnded.value
})

const playerStatusEffects = computed(() => {
  if (!shouldShowStatusBar.value || !player.value?.statusEffects) {
    return []
  }
  return player.value.statusEffects.filter(e => (e.turns === undefined) || e.turns > 0)
})

const playerStatusEffectsCount = computed(() => playerStatusEffects.value.length)

const heroSlots = computed(() => {
  const slots: (Hero | null)[] = []
  for (let i = 0; i < MAX_HEROES; i++) {
    slots.push(heroes.value[i] ?? null)
  }
  return slots
})

// Distribuye offsets aleatorios para que los enemigos no queden en linea perfectamente.
// Cada enemigo recibe un offset Y (entre -180 y 180 distribuidos) y X (entre -30 y 30).
// Tambien se le asigna una celda aleatoria de la grilla 3x2 para evitar que queden en grilla perfecta.
// Se reasigna cuando cambia la lista de enemigos.
const enemyPositions = ref<Record<string, { x: number, y: number, col: number, row: number }>>({})

function generateEnemyPositions(enemyList: IEnemy[]) {
  const positions: Record<string, { x: number, y: number, col: number, row: number }> = {}
  if (enemyList.length === 0) {
    enemyPositions.value = positions
    return
  }
  // Celldas disponibles en una grilla 3x2 (5 enemigos, 1 celda vacia)
  const cols = [1, 2, 3]
  const rows = [1, 2]
  const allCells: Array<{ col: number, row: number }> = []
  cols.forEach(c => rows.forEach(r => allCells.push({ col: c, row: r })))
  // Mezclar celdas y tomar las primeras N (sin repetir)
  const shuffled = allCells.sort(() => Math.random() - 0.5).slice(0, enemyList.length)

  enemyList.forEach((enemy, idx) => {
    const cell = shuffled[idx]
    positions[enemy.id] = {
      x: Math.round((Math.random() - 0.5) * 24),
      y: Math.round((Math.random() - 0.5) * 24),
      col: cell.col,
      row: cell.row
    }
  })
  enemyPositions.value = positions
}

watch(() => enemies.value, (newEnemies) => {
  generateEnemyPositions(newEnemies)
}, { immediate: true })

const showLogModal = ref(false)
const showStatsModal = ref(false)
const showStatusModal = ref(false)

function onHudItemSelected(id: string) {
  if (id === 'stats') {
    showStatsModal.value = true
  } else if (id === 'status') {
    if (playerStatusEffectsCount.value > 0) {
      showStatusModal.value = true
    }
  }
}

const typedPlayer = computed<Hero | null>(() => {
  return player.value as Hero | null
})

const hudOrbitItems = computed(() => [
  {
    id: 'stats',
    label: 'Stats del jugador',
    icon: StatsIcon,
    badge: undefined as number | string | undefined,
    active: true,
    onClick: () => { showStatsModal.value = true }
  },
  {
    id: 'status',
    label: playerStatusEffectsCount.value > 0
      ? `${playerStatusEffectsCount.value} efecto${playerStatusEffectsCount.value === 1 ? '' : 's'} activo${playerStatusEffectsCount.value === 1 ? '' : 's'}`
      : 'Sin efectos',
    icon: EffectsIcon,
    badge: playerStatusEffectsCount.value || undefined,    active: playerStatusEffectsCount.value > 0,
    onClick: () => { showStatusModal.value = true }
  }
])
const onTimingResultReceived = (result: { result: 'critical' | 'bonus' | 'normal' | 'miss', accuracy: number, timePressed: number }) => {
  handleTimingResult(result)
}

const onDefensePhaseComplete = (result: DefensePhaseResult) => {
  handleDefensePhaseComplete(result)
}

const onDefenseAllPhasesComplete = (results: DefensePhaseResult[]) => {
  handleDefenseAllPhasesComplete(results)
}

const onDefenseClose = () => {
  closeDefenseChallenge()
}

const handleAbilitySelect = (ability: any, index: number) => {
  selectAbility(ability, index)
}

const handleKeyDown = (e: KeyboardEvent) => {
  handleCombatShortcuts(e)
  handleAbilitiesModalShortcuts(e)
}

onMounted(() => {
  if (props.enemyList && props.enemyList.length > 0) {
    initializeCombat(props.enemyList)
  } else {
    const currentNode = expeditionStore.currentExpedition?.currentNode
    if (currentNode && currentNode.enemies && currentNode.enemies.length > 0) {
      initializeCombat(currentNode.enemies)
    } else {
      console.error('CombatView: No se encontraron enemigos en el nodo de expedicion actual. Volviendo al mapa.')
      gameStore.navigateTo('expedition-map')
      return
    }
  }

  startPlayerTurn()

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  cleanup()
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="combat-view">
    <AnnouncementBanner
      :visible="!!announcement"
      :text="announcement?.text"
      :variant="(announcement?.variant as any) || 'info'"
    />

    <div class="heroes-column">
      <div class="heroes-container">
        <HeroCard
          v-for="(hero, idx) in heroSlots"
          :key="idx"
          :hero="hero"
          :index="idx"
          :is-active="!!hero && idx === gameStore.activeHeroIndex"
          :is-target-selectable="isSelectingTarget && !!hero && hero.isAlive && canTargetAllies(selectedAbility)"
          @select="(h) => selectAlly(h)"
        />
      </div>
    </div>

    <div class="enemies-column">
      <transition name="target-banner">
        <div v-if="isSelectingTarget && selectedAbility" class="target-banner-wrap">
          <div v-if="canTargetAllies(selectedAbility) && !canTargetEnemies(selectedAbility)" class="target-indicator target-indicator-ally">
            <p><img :src="TargetIcon" alt="" class="inline-icon" /> Selecciona un aliado para {{ selectedAbility.name.toLowerCase() }}<br>
              <span class="shortcut-hint">Presiona la <b>tecla</b> del heroe o haz click.</span></p>
          </div>
          <div v-else-if="actionRequiresTarget(selectedAbility)" class="target-indicator">
            <p><img :src="TargetIcon" alt="" class="inline-icon" /> Selecciona un objetivo para {{ selectedAbility.name.toLowerCase() }}<br>
              <span class="shortcut-hint">Presiona la <b>tecla</b> del enemigo o haz click.</span></p>
          </div>
          <div v-else class="target-indicator target-all-indicator">
            <p>Todos los enemigos seran afectados.<br>
              <span class="shortcut-hint">Presiona <b>[A]</b> para confirmar.</span></p>
          </div>
        </div>
      </transition>
      <div class="enemies-container">
        <div
          v-for="(enemy, idx) in enemies"
          :key="enemy.id"
          class="enemy-position-wrapper"
          :style="{
            '--col': enemyPositions[enemy.id]?.col ?? 0,
            '--row': enemyPositions[enemy.id]?.row ?? 0,
            transform: `translate(${enemyPositions[enemy.id]?.x ?? 0}px, ${enemyPositions[enemy.id]?.y ?? 0}px)`
          }"
        >
          <EnemyCard
            :enemy="enemy"
            :index="idx"
            :is-selected="selectedEnemy?.id === enemy.id"
            :is-selecting-target="isSelectingTarget && canTargetEnemies(selectedAbility)"
            :is-action-target-required="actionRequiresTarget(selectedAbility)"
            :is-attacking="attackingEnemyId === enemy.id"
            :hit-popups="enemyHitPopups"
            :show-shortcut="canTargetEnemies(selectedAbility)"
            @select="selectEnemy"
          />
        </div>
      </div>
    </div>

    <div class="combat-bottom-bar">
      <div class="player-hud-slot">
        <PlayerHud
          :player="typedPlayer"
          :orbit-items="hudOrbitItems"
          :hit-popups="playerHitPopups"
          @select="onHudItemSelected"
        />
      </div>

      <div class="combat-log-slot">
        <CombatLogPanel
          :messages="combatLog"
          @open-full="showLogModal = true"
        />
      </div>

      <div class="actions-area">
        <div class="action-buttons">
          <button class="action-btn" :disabled="isPlayerInputLocked" @click="openAbilitiesModal">
            <img :src="AbilitiesIcon" alt="" class="btn-icon" /> Habilidades <span class="shortcut-badge">[A]</span>
          </button>
          <button class="action-btn item" :disabled="isPlayerInputLocked" @click="selectAction('Objeto')">
            <img :src="ItemIcon" alt="" class="btn-icon" /> Objeto
          </button>
        </div>
      </div>
    </div>

    <TimingOverlay
      :show="showTimingOverlay"
      @result="onTimingResultReceived"
      @close="() => {}"
    />

    <DefenseChallenge
      :show="isDefenseActive"
      :pattern="defensePattern"
      :zones="defenseZones"
      :phase-index="defensePhaseIndex"
      @phase-complete="onDefensePhaseComplete"
      @all-phases-complete="onDefenseAllPhasesComplete"
      @close="onDefenseClose"
    />

    <AbilitiesModal
      :show="showAbilitiesModal"
      :abilities="abilities"
      :ability-cooldowns="abilityCooldowns"
      :ability-shortcuts="abilityShortcuts"
      @close="closeAbilitiesModal"
      @select-ability="handleAbilitySelect"
    />

    <CombatLogModal
      :show="showLogModal"
      :messages="combatLog"
      @close="showLogModal = false"
    />

    <PlayerStatsPanel
      :show="showStatsModal"
      :player="typedPlayer"
      @close="showStatsModal = false"
    />

    <StatusEffectsPanel
      :show="showStatusModal"
      :effects="playerStatusEffects"
      :owner-name="player?.name"
      @close="showStatusModal = false"
    />
  </div>
</template>

<style scoped>
.inline-icon {
  width: 1em;
  height: 1em;
  display: inline-block;
  vertical-align: -0.15em;
  margin-right: 0.25rem;
  filter: brightness(0) invert(1);
}
.btn-icon {
  width: 1.05em;
  height: 1.05em;
  display: inline-block;
  vertical-align: -0.18em;
  margin-right: 0.35rem;
  filter: brightness(0) invert(1);
}
</style>
