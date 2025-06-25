<script setup lang="ts">
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
          <button class="action-btn flee" :disabled="isPlayerInputLocked" @click="selectAction('Huir')">
            🏃 Terminar Entrenamiento
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
        :radius="160"
        @result="handleTimingResult"
        :autoFailOnFullCircle="true"
        :generateRandomAreas="true"
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

<style scoped>
.combat-view {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  position: relative;
  overflow: hidden;
}

.enemies-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.enemies-container {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.enemy-sprite {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 0.5rem;
}

.enemy-sprite img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.enemy-sprite:hover {
  transform: scale(1.05);
}

.enemy-sprite.selected {
  background-color: rgba(255, 152, 0, 0.3);
  border: 2px solid #ff9800;
}

.enemy-sprite.target-selectable {
  background-color: rgba(255, 152, 0, 0.2);
  border: 2px solid #ff9800;
  animation: pulse 1.5s infinite;
}

.enemy-health {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 4px;
  padding: 0.25rem;
}

.player-ui {
  position: absolute;
  bottom: 60px;
  left: 20px;
  right: 20px;
  display: flex;
  gap: 2rem;
  height: 200px;
}

.combat-log-area {
  flex: 2;
}

.combat-log-box {
  background-color: rgba(0, 0, 0, 0.9);
  border: 3px solid #4CAF50;
  border-radius: 12px;
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.player-status {
  margin-bottom: 0.5rem;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.player-header h4 {
  margin: 0;
  color: #4CAF50;
  font-size: 1.1rem;
}

.level {
  color: #ffd700;
  font-weight: bold;
  font-size: 0.9rem;
}

.player-health-display {
  margin-bottom: 0.5rem;
}

.player-stats-display {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #ccc;
}

.separator {
  height: 1px;
  background-color: #4CAF50;
  margin: 0.5rem 0;
}

.combat-log {
  flex: 1;
  overflow-y: auto;
  max-height: 80px;
}

.log-message {
  color: white;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  padding: 0.25rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.actions-area {
  flex: 1;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  height: 100%;
}

.action-btn {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #2a2a2a;
  color: white;
  border: 2px solid #3a3a3a;
}

.action-btn.attack {
  background-color: #f44336;
  border-color: #d32f2f;
}

.action-btn.flee {
  background-color: #ff9800;
  border-color: #f57c00;
}

.action-btn.item {
  background-color: #2196F3;
  border-color: #1976d2;
}

.action-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.health-bar {
  width: 100%;
  height: 12px;
  background-color: #1a1a1a;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.health-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.health-text {
  font-size: 0.8rem;
  color: white;
  font-weight: bold;
}

.target-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 152, 0, 0.9);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: bold;
  z-index: 1000;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 15px rgba(255, 152, 0, 0.8);
  }

  50% {
    box-shadow: 0 0 25px rgba(255, 152, 0, 1);
  }

  100% {
    box-shadow: 0 0 15px rgba(255, 152, 0, 0.8);
  }
}

.timing-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 10, 20, 0.85);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timing-overlay.crit {
  box-shadow: 0 0 80px 20px #ffe60099;
  animation: crit-glow 0.5s;
}
.timing-overlay.bonus {
  box-shadow: 0 0 60px 10px #ff333399;
  animation: bonus-glow 0.5s;
}
@keyframes crit-glow {
  0% { box-shadow: 0 0 0 0 #ffe60000; }
  50% { box-shadow: 0 0 80px 40px #ffe600cc; }
  100% { box-shadow: 0 0 0 0 #ffe60000; }
}
@keyframes bonus-glow {
  0% { box-shadow: 0 0 0 0 #ff333300; }
  50% { box-shadow: 0 0 60px 30px #ff3333cc; }
  100% { box-shadow: 0 0 0 0 #ff333300; }
}

.shortcut-badge {
  background: #222;
  color: #ffe600;
  font-weight: bold;
  border-radius: 4px;
  padding: 0.1em 0.4em;
  margin-left: 0.5em;
  font-size: 0.95em;
}
.enemy-shortcut-badge {
  z-index: 10;
  position: relative;
  margin-top: 2px;
}
.shortcut-hint {
  color: #ffe600;
  font-size: 0.95em;
}
.log-message.log-highlight {
  background: linear-gradient(90deg, #ffe60033 0%, #fff0 100%);
  color: #ffe600;
  font-weight: bold;
  border-left: 4px solid #ffe600;
  box-shadow: 0 2px 8px #ffe60022;
}
.hit-popup {
  position: absolute;
  left: 50%;
  top: -28px;
  transform: translateX(-50%);
  color: #ff3333;
  font-size: 1.3em;
  font-weight: bold;
  text-shadow: 0 2px 8px #000a;
  pointer-events: none;
  opacity: 0.95;
  z-index: 20;
  animation: hit-pop 0.9s cubic-bezier(.68,-0.55,.27,1.55);
}
.player-hit-popup {
  top: auto;
  bottom: 120px;
  left: 120px;
  color: #ff3333;
  font-size: 1.5em;
  text-shadow: 0 2px 12px #000a;
}
@keyframes hit-pop {
  0% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.8); }
  30% { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.1); }
  80% { opacity: 1; transform: translateX(-50%) translateY(-24px) scale(1); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(0.8); }
}
.status-effect-icon {
  position: relative;
  display: flex;
  align-items: center;
}
.status-effect-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 1px 4px #0005;
  background: #fff;
  cursor: pointer;
  transition: transform 0.15s;
}
.status-effect-icon img:hover {
  transform: scale(1.18);
  z-index: 2;
}
</style> 