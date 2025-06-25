<script setup lang="ts">
import '@/styles/combat.css'
import { onMounted, onUnmounted, computed } from 'vue'
import { useCombat } from '@/composables/useCombat'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import TimingCircle from './TimingCircle.vue'
import type { ICharacter } from '@/core/interfaces/ICharacter'
import StatusBar from './StatusBar.vue'
import AbilitiesModal from '@/components/ui/AbilitiesModal.vue'

const emit = defineEmits<{
  (e: 'combatEnded', victory: boolean): void
}>()

const {
  player,
  enemies,
  selectedEnemy,
  selectedAbility,
  combatLog,
  isPlayerTurn,
  isCombatEnded,
  isSelectingTarget,
  showTimingCircle,
  timingCircleRef,
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
  onTimingResult,
  selectEnemy,
  selectAction,
  initializeCombat,
  cleanup,
  getPointerSpeed,
  actionRequiresTarget,
  handleTimingCircleClick,
  isPlayerInputLocked,
} = useCombat({
  onCombatEnd: (victory: boolean) => emit('combatEnded', victory)
})

const expeditionStore = useExpeditionStore()
const gameStore = useGameStore()

// Función base para verificar si se deben mostrar los estados
const shouldShowStatusBar = computed(() => {
  return isPlayerTurn.value && !isCombatEnded.value
})

// Función para verificar si un personaje tiene efectos de estado
const hasStatusEffects = (character: ICharacter | null) => {
  return character?.statusEffects && character.statusEffects.length > 0
}

// Función computada para los efectos de estado del jugador
const playerStatusEffects = computed(() => {
  if (!shouldShowStatusBar.value || !hasStatusEffects(player.value)) {
    return []
  }
  return player.value?.statusEffects || []
})

// Función para obtener los efectos de estado de un enemigo
const getEnemyStatusEffects = (enemy: ICharacter) => {
  if (!hasStatusEffects(enemy)) {
    return []
  }
  return enemy.statusEffects || []
}

// Un solo manejador para todos los eventos de teclado
const handleKeyDown = (e: KeyboardEvent) => {
  handleCombatShortcuts(e)
  handleAbilitiesModalShortcuts(e)
}

const getEnemySprite = (enemy: any) => {
  // Usar el sprite específico del enemigo si está disponible
  if (enemy.sprite) {
    return enemy.sprite
  }
  // Fallback a goblin si no hay sprite específico
  return goblinSprite
}

const handleTimingResult = (result: { type: 'normal' | 'bonificado' | 'critico', area: any }) => {
  if (onTimingResult.value) {
    onTimingResult.value(result)
  }
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
    <!-- Área de enemigos -->
    <div class="enemies-area">
      <div class="enemies-container">
        <div v-for="enemy in enemies" :key="enemy.id" class="enemy-sprite" :class="{
          selected: selectedEnemy?.id === enemy.id,
          dead: !enemy.isAlive,
          'target-selectable': isSelectingTarget && enemy.isAlive && actionRequiresTarget(selectedAbility),
          attacking: attackingEnemyId === enemy.id,
          'target-all': isSelectingTarget && !actionRequiresTarget(selectedAbility) && enemy.isAlive
        }" @click="selectEnemy(enemy)">
          <!-- Barra de estados -->
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
          <!-- Hit number popups para enemigos -->
          <transition-group name="hit-popup" tag="div">
            <div v-for="popup in enemyHitPopups.filter(p => p.id === enemy.id)" :key="popup.key" class="hit-popup">
              -{{ popup.value }}
            </div>
          </transition-group>
          <!-- Badge de número cuando se selecciona objetivo y requiere target, solo para vivos -->
          <div v-if="isSelectingTarget && actionRequiresTarget(selectedAbility) && enemy.isAlive" class="enemy-shortcut-badge">
            {{ aliveEnemies.findIndex(e => e.id === enemy.id) + 1 }}
          </div>
          <!-- Aviso visual sobre el enemigo que va a atacar -->
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
      <!-- Área de log de combate (izquierda) -->
      <div class="combat-log-area">
        <div class="combat-log-box">
          <!-- Información del jugador -->
          <div class="player-status">
            <!-- Barra de estados del jugador -->
            <div v-if="playerStatusEffects.length > 0" class="status-bar">
              <StatusBar :effects="playerStatusEffects" />
            </div>
            <div class="player-header">
              <h4>{{ player?.name || 'Héroe' }}</h4>
              <span class="level">Nivel {{ player?.level }}</span>
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

          <!-- Separador -->
          <div class="separator"></div>

          <!-- Log de combate -->
          <div class="combat-log" ref="combatLogRef">
            <div v-for="(message, index) in combatLog" :key="index" class="log-message"
              :class="{ 'log-highlight': index >= combatLog.length - 3 }">
              {{ message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Área de acciones (derecha) -->
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

    <!-- Indicador de selección de objetivo -->
    <div v-if="isSelectingTarget && selectedAbility">
      <div v-if="actionRequiresTarget(selectedAbility)" class="target-indicator">
        <p>🎯 Selecciona un objetivo para {{ selectedAbility.name.toLowerCase() }}<br>
          <span class="shortcut-hint">Presiona 1, 2 o 3 para seleccionar un objetivo.</span></p>
      </div>
      <div v-else class="target-indicator target-all-indicator">
        <p>Todos los enemigos serán afectados.<br>
          <span class="shortcut-hint">Presiona <b>[A]</b> para confirmar.</span></p>
      </div>
    </div>

    <!-- Overlay para el minijuego de timing -->
    <div v-if="showTimingCircle" class="timing-overlay" :class="timingEffect" @click="handleTimingCircleClick">
      <TimingCircle ref="timingCircleRef" :pointerSpeed="getPointerSpeed()" @result="handleTimingResult"
        :autoFailOnFullCircle="true" :generateRandomAreas="true" :randomPosition="true" />
    </div>

    <!-- Hit number popups para el jugador -->
    <transition-group name="hit-popup" tag="div">
      <div v-for="popup in playerHitPopups" :key="popup.key" class="hit-popup player-hit-popup">
        -{{ popup.value }}
      </div>
    </transition-group>

    <!-- Modal de habilidades -->
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
/* Deja aquí solo los estilos únicos de CombatView, si existen. */
</style>