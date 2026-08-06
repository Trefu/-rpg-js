<script setup lang="ts">
import '@/styles/combat.css'
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useCombat } from '@/composables/useCombat'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'
import { Player } from '@/core/Player'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import TimingOverlay from './TimingOverlay.vue'
import DefenseChallenge from './DefenseChallenge.vue'
import AnnouncementBanner from './AnnouncementBanner.vue'
import CombatLogModal from './CombatLogModal.vue'
import PlayerHud from './PlayerHud.vue'
import type { ICharacter, IEnemy } from '@/core/interfaces/ICharacter'
import StatusBar from './StatusBar.vue'
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
  closeDefenseChallenge
} = useCombat(combatOptions)

const shouldShowStatusBar = computed(() => {
  return isPlayerTurn.value && !isCombatEnded.value
})

const hasStatusEffects = (character: ICharacter | null) => {
  return character?.statusEffects && character.statusEffects.length > 0
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
const recentLog = computed(() => combatLog.value.slice(-3))

const playerEnergy = computed(() => player.value?.energy ?? 0)
const playerMaxEnergy = computed(() => player.value?.maxEnergy ?? 0)

const typedPlayer = computed<Player | null>(() => {
  const p = player.value as unknown
  return p instanceof Player ? p : null
})

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
            <p>🎯 Selecciona un objetivo para {{ selectedAbility.name.toLowerCase() }}<br>
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
          <div v-if="getEnemyStatusEffects(enemy).length > 0" class="status-bar">
            <StatusBar :effects="getEnemyStatusEffects(enemy)" />
          </div>
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
      <div class="combat-log-area">
        <div class="combat-log-box">
          <div class="player-status">
            <div v-if="playerStatusEffects.length > 0" class="status-bar">
              <StatusBar :effects="playerStatusEffects" />
            </div>
            <div class="player-header">
              <span class="player-name">{{ player?.name || 'Héroe' }}</span>
              <transition-group name="hit-popup" tag="div" class="player-hit-popup-container">
                <div v-for="popup in playerHitPopups" :key="popup.key" class="hit-popup player-hit-popup">
                  -{{ popup.value }}
                </div>
              </transition-group>
            </div>
            <div class="player-bars">
              <div class="bar-row bar-hp">
                <div class="bar-track">
                  <div class="bar-fill bar-fill-hp"
                    :style="{ width: `${getHealthPercentage(player?.health || 0, player?.maxHealth || 1)}%` }"></div>
                </div>
                <span class="bar-text">{{ player?.health }}/{{ player?.maxHealth }}</span>
              </div>
              <div class="bar-row bar-energy">
                <div class="bar-track">
                  <div class="bar-fill bar-fill-energy"
                    :style="{ width: `${playerMaxEnergy > 0 ? (playerEnergy / playerMaxEnergy) * 100 : 0}%` }"></div>
                </div>
                <span class="bar-text">{{ playerEnergy }}/{{ playerMaxEnergy }}</span>
              </div>
            </div>
          </div>

          <div class="combat-log compact" ref="combatLogRef">
            <div v-for="(message, index) in recentLog" :key="`${combatLog.length}-${index}`"
              class="log-message"
              :class="{ 'log-highlight': index === recentLog.length - 1 }">
              {{ message }}
            </div>
            <div v-if="combatLog.length === 0" class="log-empty">Sin acciones todavía.</div>
          </div>

          <button class="log-expand-btn" @click="showLogModal = true" :disabled="combatLog.length === 0">
            Ver registro completo
            <span v-if="combatLog.length > recentLog.length" class="log-count">{{ combatLog.length }}</span>
          </button>
        </div>
      </div>

      <div class="actions-area">
        <div class="action-buttons">
          <button class="action-btn" :disabled="isPlayerInputLocked" @click="openAbilitiesModal">
            🛡️ Habilidades <span class="shortcut-badge">[A]</span>
          </button>
          <button class="action-btn item" :disabled="isPlayerInputLocked" @click="selectAction('Objeto')">
            🎒 Objeto
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
  </div>
</template>

<style scoped>
</style>