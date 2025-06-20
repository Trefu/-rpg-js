<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useCombat } from '@/composables/useCombat'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'
import TimingCircle from './TimingCircle.vue'
import type { ICharacter } from '@/core/interfaces/ICharacter'

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
  handleModalOverlayClick,
  isPlayerInputLocked
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
  if (!shouldShowStatusBar.value || !hasStatusEffects(enemy)) {
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
  // Por ahora solo tenemos goblin, pero esto se puede expandir
  if (enemy.name.toLowerCase().includes('goblin')) {
    return goblinSprite
  }
  return goblinSprite // fallback
}

const handleTimingCircleResult = (result: { type: 'normal' | 'bonificado' | 'critico' }) => {
  const typeMap = {
    critico: 'perfect',
    bonificado: 'good',
    normal: 'bad'
  }
  onTimingResult(typeMap[result.type] || 'miss')
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
            <div v-for="effect in getEnemyStatusEffects(enemy)" :key="effect.type" class="status-effect-icon">
              <img :src="effect.icon" :alt="effect.name"
                :title="`${effect.name} (${effect.turns})\n${effect.description}`" />
            </div>
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
              <div v-for="effect in playerStatusEffects" :key="effect.type" class="status-effect-icon">
                <img :src="effect.icon" :alt="effect.name"
                  :title="`${effect.name} (${effect.turns})\n${effect.description}`" />
              </div>
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
          <button class="action-btn flee" :disabled="isPlayerInputLocked" @click="selectAction('Huir')">
            🏃 Huir
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
      <TimingCircle ref="timingCircleRef" :pointerSpeed="getPointerSpeed()" :radius="160" @result="handleTimingCircleResult"
        :autoFailOnFullCircle="true" :generateRandomAreas="true" />
    </div>

    <!-- Hit number popups para el jugador -->
    <transition-group name="hit-popup" tag="div">
      <div v-for="popup in playerHitPopups" :key="popup.key" class="hit-popup player-hit-popup">
        -{{ popup.value }}
      </div>
    </transition-group>

    <!-- Modal de habilidades -->
    <transition name="modal-fade">
      <div v-if="showAbilitiesModal" class="modal-overlay" @mousedown="handleModalOverlayClick">
        <div class="modal abilities-modal">
          <div class="modal-header">
            <img src="/src/assets/icons/Splash icons/1.png" class="modal-main-icon" alt="Habilidades" />
            <h2>Habilidades</h2>
            <button class="modal-close-btn" @click="closeAbilitiesModal" title="Cerrar">✕</button>
          </div>
          <ul class="abilities-list">
            <li v-for="(ability, idx) in abilities" :key="ability.type" class="ability-item" :class="{ 'on-cooldown': abilityCooldowns[ability.type] > 0 }">
              <div class="ability-info">
                <img v-if="ability.type === 'attack'" src="/src/assets/icons/Splash icons/1.png" class="ability-icon-lg" alt="Atacar" />
                <img v-else-if="ability.type === 'stunStrike'" src="/src/assets/icons/Splash icons/2.png" class="ability-icon-lg" alt="Golpe Aturdidor" />
                <div class="ability-meta">
                  <div class="ability-name">{{ ability.name }}</div>
                  <div class="ability-type">Tipo: {{ ability.type }}</div>
                  <div v-if="ability.cooldown > 0" class="ability-cooldown">Cooldown base: {{ ability.cooldown }} turno(s)</div>
                </div>
              </div>
              <div class="ability-desc">{{ ability.description }}</div>
              <button class="ability-use-btn" :disabled="abilityCooldowns[ability.type] > 0" @click="selectAbility(ability, idx)">
                <span v-if="abilityCooldowns[ability.type] > 0">
                  Enfriamiento ({{ abilityCooldowns[ability.type] }})
                </span>
                <span v-else>
                  Usar <span class="shortcut-badge">[{{ abilityShortcuts[idx].toUpperCase() }}]</span>
                </span>
              </button>
            </li>
          </ul>
          <div class="modal-hotkey-hint">Pulsa <b>A</b> para abrir/cerrar</div>
        </div>
      </div>
    </transition>
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

.enemy-sprite.dead {
  opacity: 0.3;
  filter: grayscale(100%);
  cursor: default;
}

.enemy-sprite.attacking {
  box-shadow: 0 0 24px 6px #ff3333, 0 0 0 4px #ff3333 inset;
  border: 2px solid #ff3333;
  animation: attack-glow 1s infinite alternate;
  z-index: 2;
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  0% {
    box-shadow: 0 0 0 0 #ffe60000;
  }

  50% {
    box-shadow: 0 0 80px 40px #ffe600cc;
  }

  100% {
    box-shadow: 0 0 0 0 #ffe60000;
  }
}

@keyframes bonus-glow {
  0% {
    box-shadow: 0 0 0 0 #ff333300;
  }

  50% {
    box-shadow: 0 0 60px 30px #ff3333cc;
  }

  100% {
    box-shadow: 0 0 0 0 #ff333300;
  }
}

@keyframes attack-glow {
  0% {
    box-shadow: 0 0 8px 2px #ff3333, 0 0 0 4px #ff3333 inset;
  }

  100% {
    box-shadow: 0 0 32px 12px #ff3333, 0 0 0 4px #ff3333 inset;
  }
}

.enemy-attack-warning {
  position: absolute;
  top: -48px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff3333;
  color: #fff;
  font-weight: bold;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  box-shadow: 0 2px 12px #000a;
  z-index: 10;
  pointer-events: none;
  opacity: 0.95;
}

.attack-float-enter-active,
.attack-float-leave-active {
  transition: all 0.4s cubic-bezier(.68, -0.55, .27, 1.55);
}

.attack-float-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px) scale(0.8);
}

.attack-float-enter-to {
  opacity: 0.95;
  transform: translateX(-50%) translateY(0) scale(1);
}

.attack-float-leave-from {
  opacity: 0.95;
  transform: translateX(-50%) translateY(0) scale(1);
}

.attack-float-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.8);
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
  position: absolute;
  bottom: -35px; /* Lo posiciona debajo del sprite */
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 230, 0, 0.95);
  color: #222;
  font-weight: bold;
  font-size: 1.1rem;
  padding: 0.2rem 0.7rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px #000a;
  z-index: 10;
  pointer-events: none;
  min-width: 28px;
  text-align: center;
}

.target-all {
  box-shadow: 0 0 16px 4px #ffe60099;
  border: 2px solid #ffe600;
  animation: pulse 1.2s infinite alternate;
}

.target-all-indicator {
  background: #ffe600;
  color: #222;
  font-weight: bold;
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
  animation: hit-pop 0.9s cubic-bezier(.68, -0.55, .27, 1.55);
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
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px) scale(0.8);
  }

  30% {
    opacity: 1;
    transform: translateX(-50%) translateY(-10px) scale(1.1);
  }

  80% {
    opacity: 1;
    transform: translateX(-50%) translateY(-24px) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-40px) scale(0.8);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 20, 0.85);
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.abilities-modal {
  background: #23243a;
  border-radius: 18px;
  box-shadow: 0 8px 32px #000a;
  padding: 2.5rem 2.5rem 1.5rem 2.5rem;
  min-width: 340px;
  max-width: 95vw;
  text-align: center;
  position: relative;
  animation: pop-in 0.25s;
}

@keyframes pop-in {
  0% {
    transform: scale(0.92);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.modal-main-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px #000a);
}

.modal-close-btn {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.7rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.modal-close-btn:hover {
  opacity: 1;
}

.abilities-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0 1rem 0;
}

.ability-item {
  margin-bottom: 2.2rem;
  background: #292b44;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0003;
  padding: 1.2rem 1.2rem 1.5rem 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

.ability-info {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 0.7rem;
}

.ability-icon-lg {
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px #000a);
}

.ability-meta {
  text-align: left;
}

.ability-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: #fff;
}

.ability-type {
  font-size: 0.95rem;
  color: #6fdc6f;
  margin-top: 0.1rem;
}

.ability-cooldown {
  font-size: 0.95rem;
  color: #ffe600;
  margin-top: 0.1rem;
}

.ability-desc {
  color: #ffe600;
  font-size: 1.05rem;
  margin: 0.5rem 0 0.7rem 0;
  text-align: left;
}

.ability-use-btn {
  margin-top: 0.2rem;
  background: linear-gradient(90deg, #4CAF50 0%, #2a2a2a 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.7rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, opacity 0.2s;
  box-shadow: 0 2px 8px #0005;
}

.ability-use-btn:disabled {
  background: #555;
  color: #bbb;
  opacity: 0.6;
  cursor: not-allowed;
}

.ability-use-btn:not(:disabled):hover {
  background: linear-gradient(90deg, #6fdc6f 0%, #444 100%);
  transform: scale(1.04);
}

.ability-use-btn span {
  display: flex;
  align-items: center;
  justify-content: center;
}

.ability-item.on-cooldown {
  background: #2f314d;
  opacity: 0.6;
}

.ability-item.on-cooldown .ability-name,
.ability-item.on-cooldown .ability-desc {
  color: #999;
}

.ability-item.on-cooldown .ability-icon-lg {
  filter: grayscale(80%);
}

.modal-hotkey-hint {
  margin-top: 0.7rem;
  color: #aaa;
  font-size: 0.95rem;
}

@media (max-width: 600px) {
  .abilities-modal {
    min-width: 90vw;
    padding: 1.2rem 0.5rem 1rem 0.5rem;
  }

  .ability-item {
    padding: 0.7rem 0.5rem 1rem 0.5rem;
  }

  .modal-header h2 {
    font-size: 1.1rem;
  }
}

.status-bar {
  display: flex;
  gap: 0.3rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.2rem;
  margin-top: -0.7rem;
  background: rgba(30, 32, 60, 0.85);
  border-radius: 8px;
  padding: 0.15rem 0.4rem;
  box-shadow: 0 2px 8px #0002;
  min-height: 28px;
  max-width: 120px;
  overflow-x: auto;
  z-index: 12;
  position: relative;
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

.status-float-enter-active, .status-float-leave-active {
  transition: all 0.4s cubic-bezier(.68,-0.55,.27,1.55);
}

.status-float-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.status-float-enter-to {
  opacity: 0.95;
  transform: translateY(0) scale(1);
}

.status-float-leave-from {
  opacity: 0.95;
  transform: translateY(0) scale(1);
}

.status-float-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.8);
}

.enemy-status-warning {
  position: absolute;
  top: -80px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff3333;
  color: #fff;
  font-weight: bold;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 1.1rem;
  box-shadow: 0 2px 12px #000a;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
  opacity: 0.95;
  white-space: nowrap;
}

.enemy-status-warning.buff {
  background: #4CAF50;
}

.enemy-status-warning.debuff {
  background: #ff3333;
}

.enemy-status-warning .status-label-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  margin-right: 0.5rem;
  filter: drop-shadow(0 2px 6px #000a);
}
</style>