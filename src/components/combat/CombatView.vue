<script setup lang="ts">
import '@/styles/combat.css'
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useCombat } from '@/composables/useCombat'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'
import { Player } from '@/core/Player'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import statsIcon from '@/assets/icons/scroll-unfurled.png'
import effectsIcon from '@/assets/icons/droplets.png'
import targetIcon from '@/assets/icons/crosshair.png'
import abilitiesIcon from '@/assets/icons/shield.png'
import itemIcon from '@/assets/icons/backpack.png'
import TimingOverlay from './TimingOverlay.vue'
import DefenseChallenge from './DefenseChallenge.vue'
import AnnouncementBanner from './AnnouncementBanner.vue'
import CombatLogModal from './CombatLogModal.vue'
import CombatLogPanel from './CombatLogPanel.vue'
import PlayerHud from './PlayerHud.vue'
import PlayerStatsPanel from './PlayerStatsPanel.vue'
import StatusEffectsPanel from './StatusEffectsPanel.vue'
import EnemyStatusIcons from './EnemyStatusIcons.vue'
import type { ICharacter, IEnemy } from '@/core/interfaces/ICharacter'
import AbilitiesModal from '@/components/ui/AbilitiesModal.vue'
import type { DefensePhaseResult } from '@/core/defense/types'

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
  enemies,
  selectedEnemy,
  selectedAbility,
  combatLog,
  isPlayerTurn,
  isCombatEnded,
  isSelectingTarget,
  showTimingOverlay,
  attackingEnemyId,
  combatLogRef,
  enemyHitPopups,
  playerHitPopups,
  showAbilitiesModal,
  abilityCooldowns,
  timingEffect,
  announcement,
  abilities,
  aliveEnemies,
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
  getHealthPercentage,
  selectEnemy,
  selectAction,
  initializeCombat,
  cleanup,
  getPointerSpeed,
  actionRequiresTarget,
  handleTimingResult,
  executeAbility,
  isPlayerInputLocked,
  handleDefensePhaseComplete,
  handleDefenseAllPhasesComplete,
  closeDefenseChallenge,
  startPlayerTurn
} = useCombat(combatOptions)

const shouldShowStatusBar = computed(() => {
  return !isCombatEnded.value
})

const hasStatusEffects = (character: ICharacter | null) => {
  return character?.statusEffects && character.statusEffects.some(e => (e.turns === undefined) || e.turns > 0)
}

const playerStatusEffects = computed(() => {
  if (!shouldShowStatusBar.value || !hasStatusEffects(player.value)) {
    return []
  }
  return player.value?.statusEffects || []
})

const getEnemyStatusEffects = (enemy: ICharacter) => {
  if (!hasStatusEffects(enemy)) {
    return []
  }
  return enemy.statusEffects || []
}

const handleKeyDown = (e: KeyboardEvent) => {
  handleCombatShortcuts(e)
  handleAbilitiesModalShortcuts(e)
}

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

const typedPlayer = computed<Player | null>(() => {
  const p = player.value as unknown
  return p instanceof Player ? p : null
})

const playerStatusEffectsCount = computed(() => playerStatusEffects.value.length)

const hudOrbitItems = computed(() => [
  {
    id: 'stats',
    label: 'Stats del jugador',
    icon: statsIcon,
    badge: null as number | string | null,
    active: true,
    onClick: () => { showStatsModal.value = true }
  },
  {
    id: 'status',
    label: playerStatusEffectsCount.value > 0
      ? `${playerStatusEffectsCount.value} efecto${playerStatusEffectsCount.value === 1 ? '' : 's'} activo${playerStatusEffectsCount.value === 1 ? '' : 's'}`
      : 'Sin efectos',
    icon: effectsIcon,
    badge: playerStatusEffectsCount.value || null,
    active: playerStatusEffectsCount.value > 0,
    onClick: () => { showStatusModal.value = true }
  }
])

const getEnemySprite = (enemy: any) => {
  if (enemy.sprite) {
    return enemy.sprite
  }
  return goblinSprite
}

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

onMounted(() => {
  if (props.enemyList && props.enemyList.length > 0) {
    initializeCombat(props.enemyList)
  } else {
    const currentNode = expeditionStore.currentExpedition?.currentNode
    if (currentNode && currentNode.enemies && currentNode.enemies.length > 0) {
      initializeCombat(currentNode.enemies)
    } else {
      console.error('CombatView: No se encontraron enemigos en el nodo de expedición actual. Volviendo al mapa.')
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

    <div class="enemies-area">
      <transition name="target-banner">
        <div v-if="isSelectingTarget && selectedAbility" class="target-banner-wrap">
          <div v-if="actionRequiresTarget(selectedAbility)" class="target-indicator">
            <p><img :src="targetIcon" alt="" class="inline-icon" /> Selecciona un objetivo para {{ selectedAbility.name.toLowerCase() }}<br>
              <span class="shortcut-hint">Presiona la <b>tecla</b> del enemigo o haz click.</span></p>
          </div>
          <div v-else class="target-indicator target-all-indicator">
            <p>Todos los enemigos serán afectados.<br>
              <span class="shortcut-hint">Presiona <b>[A]</b> para confirmar.</span></p>
          </div>
        </div>
      </transition>
      <div class="enemies-container">
        <div v-for="enemy in enemies" :key="enemy.id" class="enemy-sprite" :class="{
          selected: selectedEnemy?.id === enemy.id,
          dead: !enemy.isAlive,
          'target-selectable': isSelectingTarget && enemy.isAlive && actionRequiresTarget(selectedAbility),
          attacking: attackingEnemyId === enemy.id,
          'target-all': isSelectingTarget && !actionRequiresTarget(selectedAbility) && enemy.isAlive
        }" @click="selectEnemy(enemy)">
          <EnemyStatusIcons v-if="getEnemyStatusEffects(enemy).length > 0" :effects="getEnemyStatusEffects(enemy)" />
          <img :src="getEnemySprite(enemy)" :alt="enemy.name" />
          <div class="enemy-health">
            <div class="health-bar">
              <div class="health-fill" :style="{ width: `${getHealthPercentage(enemy.health, enemy.maxHealth)}%` }">
              </div>
            </div>
          </div>
          <transition-group name="hit-popup" tag="div">
            <div v-for="popup in enemyHitPopups.filter(p => p.id === enemy.id)" :key="popup.key" class="hit-popup">
              -{{ popup.value }}
            </div>
          </transition-group>
          <div v-if="isSelectingTarget && actionRequiresTarget(selectedAbility) && enemy.isAlive" class="enemy-shortcut-badge">
            <span class="key-cap">{{ aliveEnemies.findIndex(e => e.id === enemy.id) + 1 }}</span>
            <span class="enemy-name-badge">{{ enemy.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="player-ui">
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
            <img :src="abilitiesIcon" alt="" class="btn-icon" /> Habilidades <span class="shortcut-badge">[A]</span>
          </button>
          <button class="action-btn item" :disabled="isPlayerInputLocked" @click="selectAction('Objeto')">
            <img :src="itemIcon" alt="" class="btn-icon" /> Objeto
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