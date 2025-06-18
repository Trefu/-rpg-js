<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { Goblin } from '@/core/enemies/Goblin'
import {IEnemy } from '@/core/interfaces/ICharacter';

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

onMounted(() => {
  if (!player.value) return
  
  // Generar enemigos aleatorios (1-3)
  const enemyCount = Math.floor(Math.random() * 3) + 1
  for (let i = 0; i < enemyCount; i++) {
    const enemy = new Goblin(player.value.level)
    enemies.value.push(enemy)
  }
  
  addToLog(`¡Combate iniciado! Te enfrentas a ${enemyCount} enemigo${enemyCount > 1 ? 's' : ''}.`)
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
  
  selectedAction.value = action
  isSelectingTarget.value = true
  addToLog(`Selecciona un objetivo para ${action.toLowerCase()}.`)
}

const executeAction = () => {
  if (!player.value || !selectedEnemy.value || !isPlayerTurn.value) return
  
  if (selectedAction.value === 'Atacar') {
    const damage = player.value.attack()
    selectedEnemy.value.takeDamage(damage)
    
    addToLog(`Atacas a ${selectedEnemy.value.name} causando ${damage} de daño.`)
    
    if (!selectedEnemy.value.isAlive) {
      addToLog(`${selectedEnemy.value.name} ha sido derrotado!`)
      const rewards = selectedEnemy.value.getRewards()
      player.value.gainExperience(rewards.experience)
      player.value.addGold(rewards.gold)
      addToLog(`Ganas ${rewards.experience} experiencia y ${rewards.gold} oro.`)
    }
  }
  
  selectedEnemy.value = null
  selectedAction.value = ''
  isSelectingTarget.value = false
  isPlayerTurn.value = false
  
  // Turno de los enemigos
  setTimeout(enemyTurn, 1000)
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
  addToLog(victory ? '¡Victoria! Has completado el combate.' : 'Derrota. El combate ha terminado.')
  
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
</script>

<template>
  <div class="combat-view">
    <h2>Combate</h2>
    
    <!-- Enemigos en la parte superior -->
    <div class="enemies-section">
      <h3>Enemigos</h3>
      <div class="enemies-row">
        <div
          v-for="enemy in enemies"
          :key="enemy.id"
          class="character-card enemy"
          :class="{ 
            selected: selectedEnemy?.id === enemy.id,
            dead: !enemy.isAlive,
            'target-selectable': isSelectingTarget && enemy.isAlive
          }"
          @click="selectEnemy(enemy)"
        >
          <h4>{{ enemy.name }}</h4>
          <div class="health-bar">
            <div 
              class="health-fill" 
              :style="{ width: `${getHealthPercentage(enemy.health, enemy.maxHealth)}%` }"
            ></div>
          </div>
          <p>Vida: {{ enemy.health }}/{{ enemy.maxHealth }}</p>
          <p>Ataque: {{ enemy.attack() }}</p>
        </div>
      </div>
      
      <!-- Indicador de selección de objetivo -->
      <div v-if="isSelectingTarget" class="target-indicator">
        <p>🎯 Selecciona un objetivo para {{ selectedAction.toLowerCase() }}</p>
      </div>
    </div>

    <!-- Espacio central para acciones -->
    <div class="combat-center">
      <div class="actions-section">
        <div class="mini-menu">
          <button 
            class="action-button attack"
            :disabled="!isPlayerTurn || isCombatEnded"
            @click="selectAction('Atacar')"
          >
            ⚔️ Atacar
          </button>
        </div>
      </div>
    </div>

    <!-- Jugador en la parte inferior -->
    <div class="player-section">
      <div class="character-card player">
        <h3>Tu Personaje</h3>
        <div class="health-bar">
          <div 
            class="health-fill" 
            :style="{ width: `${getHealthPercentage(player?.health || 0, player?.maxHealth || 1)}%` }"
          ></div>
        </div>
        <p>Vida: {{ player?.health }}/{{ player?.maxHealth }}</p>
        <p>Ataque: {{ player?.attack() }}</p>
        <p>Defensa: {{ player?.defense() }}</p>
      </div>
    </div>

    <!-- Log de combate -->
    <div class="combat-log">
      <h3>Log de Combate</h3>
      <div class="log-content">
        <p v-for="(message, index) in combatLog" :key="index">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.combat-view {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
}

.enemies-section {
  flex: 1;
  margin-bottom: 2rem;
}

.enemies-row {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.target-indicator {
  text-align: center;
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: rgba(255, 152, 0, 0.2);
  border-radius: 8px;
  border: 2px solid #ff9800;
}

.target-indicator p {
  margin: 0;
  font-weight: bold;
  color: #ff9800;
}

.combat-center {
  flex: 0 0 auto;
  margin: 2rem 0;
  display: flex;
  justify-content: center;
}

.player-section {
  flex: 1;
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
}

.character-card {
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
  border: 2px solid #3a3a3a;
  transition: all 0.3s ease;
  min-width: 200px;
}

.character-card.player {
  border-color: #4CAF50;
  max-width: 300px;
}

.character-card.enemy {
  cursor: pointer;
  flex: 1;
  max-width: 250px;
}

.character-card.enemy:hover {
  border-color: #ff9800;
}

.character-card.enemy.selected {
  border-color: #ff9800;
  box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
}

.character-card.enemy.target-selectable {
  border-color: #ff9800;
  box-shadow: 0 0 15px rgba(255, 152, 0, 0.8);
  animation: pulse 1.5s infinite;
}

.character-card.enemy.dead {
  opacity: 0.5;
  cursor: default;
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

.health-bar {
  width: 100%;
  height: 20px;
  background-color: #1a1a1a;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.health-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.mini-menu {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-button {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-button.attack {
  background-color: #f44336;
  color: white;
}

.action-button.attack:hover:not(:disabled) {
  background-color: #d32f2f;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.combat-log {
  flex: 0 0 auto;
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 1rem;
  margin-top: auto;
}

.log-content {
  max-height: 150px;
  overflow-y: auto;
  background-color: #1a1a1a;
  padding: 1rem;
  border-radius: 4px;
}

.log-content p {
  margin: 0.25rem 0;
  font-family: monospace;
}

h3 {
  text-align: center;
  margin-bottom: 1rem;
}
</style> 