<script setup lang="ts">
import '@/styles/combat.css'
import { onMounted, onUnmounted } from 'vue'
import { useCombat } from '@/composables/useCombat'
import { Dummy } from '@/core/enemies/Dummy'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import TimingCircle from './TimingCircle.vue'
import StatusBar from './StatusBar.vue'
import AbilitiesModal from '@/components/ui/AbilitiesModal.vue'

const emit = defineEmits<{
  (e: 'trainingEnded'): void
}>()

const {
  player,
  enemies,
  selectedEnemy,
  combatLog,
  isSelectingTarget,
  selectedAbility,
  showTimingCircle,
  timingCircleRef,
  combatLogRef,
  enemyHitPopups,
  playerHitPopups,
  showAbilitiesModal,
  abilityCooldowns,
  timingEffect,
  abilities,
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
  isPlayerInputLocked
} = useCombat({
  isTraining: true,
  onTrainingEnd: () => emit('trainingEnded')
})

onMounted(() => {
  if (!player.value) return

  // Crear dummy de entrenamiento
  const dummy = new Dummy(player.value.level)
  initializeCombat([dummy])

  window.addEventListener('keydown', handleCombatShortcuts)
  window.addEventListener('keydown', handleAbilitiesModalShortcuts)
})

onUnmounted(() => {
  cleanup()
  window.removeEventListener('keydown', handleCombatShortcuts)
  window.removeEventListener('keydown', handleAbilitiesModalShortcuts)
})

const getEnemySprite = (enemy: any) => {
  if (enemy.sprite) {
    return enemy.sprite
  }
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
</script>

<template>
  <div class="combat-view">
    <!-- Área de dummy -->
    <div class="enemies-area">
      <div class="enemies-container">
        <div v-if="enemies[0]" class="enemy-sprite" :class="{
          selected: selectedEnemy?.id === enemies[0].id,
          'target-selectable': isSelectingTarget && enemies[0].isAlive && actionRequiresTarget(selectedAbility)
        }" @click="selectEnemy(enemies[0])">
          <!-- Barra de estados -->
          <div v-if="enemies[0].statusEffects && enemies[0].statusEffects.length" class="status-bar">
            <StatusBar :effects="enemies[0].statusEffects" />
          </div>
          <img :src="getEnemySprite(enemies[0])" :alt="enemies[0].name" />
          <div class="enemy-health">
            <div class="health-bar">
              <div class="health-fill" :style="{ width: `${getHealthPercentage(enemies[0].health, enemies[0].maxHealth)}%` }">
              </div>
            </div>
          </div>
          <!-- Hit number popups para dummy -->
          <transition-group name="hit-popup" tag="div">
            <div v-for="popup in enemyHitPopups.filter(p => p.id === enemies[0].id)" :key="popup.key" class="hit-popup">
              -{{ popup.value }}
            </div>
          </transition-group>
          <!-- Badge de número cuando se selecciona objetivo -->
          <div v-if="isSelectingTarget && actionRequiresTarget(selectedAbility) && enemies[0].isAlive" class="enemy-shortcut-badge">
            [1]
          </div>
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
            <div v-if="player?.statusEffects && player.statusEffects.length" class="status-bar">
              <StatusBar :effects="player.statusEffects" />
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
            <div v-for="(message, index) in combatLog" :key="index" class="log-message" :class="{ 'log-highlight': index >= combatLog.length - 3 }">
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
          <button class="action-btn item" :disabled="true" @click="selectAction('Objeto')">
            🎒 Objetos (No disponible)
          </button>
        </div>
      </div>
    </div>

    <!-- Indicador de selección de objetivo -->
    <div v-if="isSelectingTarget && selectedAbility">
      <div v-if="actionRequiresTarget(selectedAbility)" class="target-indicator">
        <p>🎯 Selecciona el dummy para {{ selectedAbility.name.toLowerCase() }}<br>
        <span class="shortcut-hint">Presiona 1 para seleccionar el dummy.</span></p>
      </div>
    </div>

    <!-- Overlay para el minijuego de timing -->
    <div v-if="showTimingCircle" class="timing-overlay" :class="timingEffect" @click="handleTimingCircleClick">
      <TimingCircle
        ref="timingCircleRef"
        :pointerSpeed="getPointerSpeed()"
        @result="handleTimingResult"
        :autoFailOnFullCircle="true"
        :generateRandomAreas="true"
        :randomPosition="true"
      />
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