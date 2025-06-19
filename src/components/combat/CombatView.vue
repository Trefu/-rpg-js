<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { Goblin } from '@/core/enemies/Goblin'
import { IEnemy } from '@/core/interfaces/ICharacter'
import { AudioManager } from '@/core/AudioManager'
import goblinSprite from '@/assets/sprites/enemies/goblin.png'

const emit = defineEmits<{
  (e: 'combatEnded', victory: boolean): void
}>()

const gameStore = useGameStore()
const player = ref<any>(gameStore.player)
const enemies = ref<IEnemy[]>([])
const selectedEnemy = ref<IEnemy | null>(null)
const combatLog = ref<string[]>([])
const isPlayerTurn = ref(true)
const isCombatEnded = ref(false)
const isSelectingTarget = ref(false)
const selectedAction = ref<string>('')
const audioManager = AudioManager.getInstance()

onMounted(() => {
  if (!player.value) return

  // Generar enemigos aleatorios (1-3)
  const enemyCount = Math.floor(Math.random() * 3) + 1
  for (let i = 0; i < enemyCount; i++) {
    const enemy = new Goblin(player.value.level)
    enemies.value.push(enemy)
  }

  // Reproducir música de combate
  audioManager.playMountainCombat()

  addToLog(`¡Combate iniciado! Te enfrentas a ${enemyCount} enemigo${enemyCount > 1 ? 's' : ''}.`)
})

onUnmounted(() => {
  // Detener música de combate al salir
  audioManager.stopCurrentMusic()
})

const selectEnemy = (enemy: IEnemy) => {
  if (!isPlayerTurn.value || !enemy.isAlive) return

  if (isSelectingTarget.value) {
    selectedEnemy.value = enemy
    executeAction()
  }
}

const selectAction = (action: string) => {
  if (!isPlayerTurn.value || isCombatEnded.value) return

  if (action === 'Huir') {
    addToLog('¡Has huido del combate!')
    setTimeout(() => {
      emit('combatEnded', false)
    }, 2000)
    return
  }

  if (action === 'Objeto') {
    addToLog('No tienes objetos disponibles.')
    return
  }

  selectedAction.value = action
  isSelectingTarget.value = true
  addToLog(`Selecciona un objetivo para ${action.toLowerCase()}.`)
}

const executeAction = () => {
  if (!player.value || !selectedEnemy.value || !isPlayerTurn.value) return

  if (selectedAction.value === 'Atacar') {
    const damage = player.value.attack()
    selectedEnemy.value.takeDamage(damage)

    // Reproducir sonido de ataque
    audioManager.playAttackSound()

    addToLog(`Atacas a ${selectedEnemy.value.name} causando ${damage} de daño.`)

    if (!selectedEnemy.value.isAlive) {
      // Reproducir sonido de hit cuando el enemigo muere
      audioManager.playHitSound()
      addToLog(`${selectedEnemy.value.name} ha sido derrotado!`)
      const rewards = selectedEnemy.value.getRewards()
      player.value.gainExperience(rewards.experience)
      player.value.addGold(rewards.gold)
      setTimeout(() => {
        addToLog(`Ganas ${rewards.experience} experiencia y ${rewards.gold} oro.`)
      }, 1000)
    } else {
      // Reproducir sonido de hit cuando el enemigo recibe daño
      setTimeout(() => {
        audioManager.playHitSound()
      }, 200)
    }
  }

  selectedEnemy.value = null
  selectedAction.value = ''
  isSelectingTarget.value = false
  isPlayerTurn.value = false

  // Turno de los enemigos
  setTimeout(enemyTurn, 2000)
}

const enemyTurn = () => {
  if (!player.value) return

  const aliveEnemies = enemies.value.filter(enemy => enemy.isAlive)
  if (aliveEnemies.length === 0) {
    endCombat(true)
    return
  }

  aliveEnemies.forEach(enemy => {
    if (!player.value || !player.value.isAlive) return

    const damage = enemy.attack()
    player.value.takeDamage(damage)

    // Reproducir sonido de ataque enemigo
    audioManager.playAttackSound()

    addToLog(`${enemy.name} te ataca causando ${damage} de daño.`)
  })

  if (!player.value.isAlive) {
    addToLog('¡Has sido derrotado!')
    endCombat(false)
    return
  }

  isPlayerTurn.value = true
  addToLog('Tu turno.')
}

const endCombat = (victory: boolean) => {
  isCombatEnded.value = true

  if (victory) {
    // Reproducir sonido de victoria
    audioManager.playVictorySound()
    addToLog('¡Victoria! Has completado el combate.')
  } else {
    addToLog('Derrota. El combate ha terminado.')
  }

  setTimeout(() => {
    emit('combatEnded', victory)
  }, 2000)
}

const addToLog = (message: string) => {
  combatLog.value.push(message)
  // Mantener solo los últimos 10 mensajes
  if (combatLog.value.length > 10) {
    combatLog.value.shift()
  }
}

const getHealthPercentage = (current: number, max: number) => {
  return Math.max(0, (current / max) * 100)
}

const getEnemySprite = (enemy: IEnemy) => {
  // Por ahora solo tenemos goblin, pero esto se puede expandir
  if (enemy.name.toLowerCase().includes('goblin')) {
    return goblinSprite
  }
  return goblinSprite // fallback
}
</script>

<template>
  <div class="combat-view">
    <!-- Área de enemigos -->
    <div class="enemies-area">
      <div class="enemies-container">
        <div v-for="enemy in enemies" :key="enemy.id" class="enemy-sprite" :class="{
          selected: selectedEnemy?.id === enemy.id,
          dead: !enemy.isAlive,
          'target-selectable': isSelectingTarget && enemy.isAlive
        }" @click="selectEnemy(enemy)">
          <img :src="getEnemySprite(enemy)" :alt="enemy.name" />
          <div class="enemy-health">
            <div class="health-bar">
              <div class="health-fill" :style="{ width: `${getHealthPercentage(enemy.health, enemy.maxHealth)}%` }">
              </div>
            </div>
            <span class="health-text">{{ enemy.health }}/{{ enemy.maxHealth }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- UI tipo Pokémon -->
    <div class="player-ui">
      <!-- Área de log de combate (izquierda) -->
      <div class="combat-log-area">
        <div class="combat-log-box">
          <!-- Información del jugador -->
          <div class="player-status">
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
          <div class="combat-log">
            <div v-for="(message, index) in combatLog" :key="index" class="log-message">
              {{ message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Área de acciones (derecha) -->
      <div class="actions-area">
        <div class="action-buttons">
          <button class="action-btn attack" :disabled="!isPlayerTurn || isCombatEnded" @click="selectAction('Atacar')">
            ⚔️ Atacar
          </button>
          <button class="action-btn flee" :disabled="!isPlayerTurn || isCombatEnded" @click="selectAction('Huir')">
            🏃 Huir
          </button>
          <button class="action-btn item" :disabled="!isPlayerTurn || isCombatEnded" @click="selectAction('Objeto')">
            🎒 Objeto
          </button>
        </div>
      </div>
    </div>

    <!-- Indicador de selección de objetivo -->
    <div v-if="isSelectingTarget" class="target-indicator">
      <p>🎯 Selecciona un objetivo para {{ selectedAction.toLowerCase() }}</p>
    </div>
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
</style>