<script setup lang="ts">
import '@/styles/combat.css'
import { onMounted, onUnmounted, computed } from 'vue'
import { useCombat } from '@/composables/useCombat'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import TimingOverlay from './TimingOverlay.vue'
import type { ICharacter } from '@/core/interfaces/ICharacter'
import StatusBar from './StatusBar.vue'
import AbilitiesModal from '@/components/ui/AbilitiesModal.vue'

const emit = defineEmits<{
  (e: 'combatEnded', victory: boolean): void
}>()

const expeditionStore = useExpeditionStore()
const gameStore = useGameStore()

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
  attackingEnemyLabel,
  combatLogRef,
  enemyHitPopups,
  playerHitPopups,
  showAbilitiesModal,
  abilityCooldowns,
  enemyStatusWarning,
  timingEffect,
  abilities,
  aliveEnemies,
  abilityShortcuts,
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
  isPlayerInputLocked
} = useCombat({
  onCombatEnd: (victory: boolean) => emit('combatEnded', victory)
})

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

const getEnemySprite = (enemy: any) => {
  if (enemy.sprite) {
    return enemy.sprite
  }
  return goblinSprite
}

const onTimingResultReceived = (result: { result: 'perfect' | 'good' | 'normal' | 'miss', accuracy: number, timePressed: number }) => {
  handleTimingResult(result)
}

const handleAbilitySelect = (ability: any, index: number) => {
  selectAbility(ability, index)
}

onMounted(() => {
  const currentNode = expeditionStore.currentExpedition?.currentNode

  if (currentNode && currentNode.enemies && currentNode.enemies.length > 0) {
    initializeCombat(currentNode.enemies)
  } else {
    console.error('CombatView: No se encontraron enemigos en el nodo de expedición actual. Volviendo al mapa.')
    gameStore.navigateTo('expedition-map')
    return
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
          <transition name="attack-float">
            <div v-if="attackingEnemyId === enemy.id && attackingEnemyLabel" class="enemy-attack-warning">
              {{ attackingEnemyLabel }}
            </div>
          </transition>
          <transition name="status-float">
            <div v-if="enemyStatusWarning && enemyStatusWarning.enemyId === enemy.id" :class="['enemy-status-warning', enemyStatusWarning.isBuff ? 'buff' : 'debuff']">
              <img :src="enemyStatusWarning.icon" class="status-label-icon" />
              {{ enemyStatusWarning.text }}
            </div>
          </transition>
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
              <h4>{{ player?.name || 'Héroe' }}</h4>
              <span class="level">Nivel {{ player?.level }}</span>
              <transition-group name="hit-popup" tag="div" class="player-hit-popup-container">
                <div v-for="popup in playerHitPopups" :key="popup.key" class="hit-popup player-hit-popup">
                  -{{ popup.value }}
                </div>
              </transition-group>
            </div>
            <div class="player-health-display">
              <div class="health-bar">
                <div class="health-fill"
                  :style="{ width: `${getHealthPercentage(player?.health || 0, player?.maxHealth || 1)}%` }"></div>
              </div>
              <span class="health-text">{{ player?.health }}/{{ player?.maxHealth }}</span>
            </div>
            <div class="player-stats-display">
              <span>Ataque: {{ player?.attack() }}</span>
              <span>Defensa: {{ player?.defense() }}</span>
            </div>
          </div>

          <div class="separator"></div>

          <div class="combat-log" ref="combatLogRef">
            <div v-for="(message, index) in combatLog" :key="index" class="log-message"
              :class="{ 'log-highlight': index >= combatLog.length - 3 }">
              {{ message }}
            </div>
          </div>
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

    <AbilitiesModal
      :show="showAbilitiesModal"
      :abilities="abilities"
      :ability-cooldowns="abilityCooldowns"
      :ability-shortcuts="abilityShortcuts"
      @close="closeAbilitiesModal"
      @select-ability="handleAbilitySelect"
    />
  </div>
</template>

<style scoped>
</style>