<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'

const emit = defineEmits<{
  (e: 'resetGame'): void
}>()

const gameStore = useGameStore()
const { player, currentLevel, currentScore } = storeToRefs(gameStore)

const showCharacter = ref(false)

const resetGame = () => {
  if (confirm('¿Estás seguro de que quieres reiniciar el juego? Se perderá todo el progreso.')) {
    gameStore.resetGame()
    emit('resetGame')
  }
}
</script>

<template>
  <div class="game-ui">
    <div class="top-bar">
      <div class="stats">
        <span class="level">Nivel: {{ currentLevel }}</span>
        <span class="score">Puntuación: {{ currentScore }}</span>
      </div>
      <div class="actions">
        <button class="ui-button" @click="showCharacter = !showCharacter">
          {{ showCharacter ? 'Ocultar Personaje' : 'Ver Personaje' }}
        </button>
        <button class="ui-button danger" @click="resetGame">
          Reiniciar Juego
        </button>
      </div>
    </div>

    <div v-if="showCharacter && player" class="character-panel">
      <h3>Información del Personaje</h3>
      <div class="character-info">
        <div class="info-section">
          <h4>Estadísticas</h4>
          <ul>
            <li>Vida: {{ player.health }}/{{ player.maxHealth }}</li>
            <li>Ataque: {{ player.attack() }}</li>
            <li>Defensa: {{ player.defense() }}</li>
            <li>Magia: {{ player.magic() }}</li>
          </ul>
        </div>
        <div class="info-section">
          <h4>Atributos</h4>
          <ul>
            <li>Fuerza: {{ player.stats.fuerza }}</li>
            <li>Destreza: {{ player.stats.destreza }}</li>
            <li>Inteligencia: {{ player.stats.inteligencia }}</li>
            <li>Sabiduría: {{ player.stats.sabiduria }}</li>
            <li>Constitución: {{ player.stats.constitucion }}</li>
            <li>Carisma: {{ player.stats.carisma }}</li>
          </ul>
        </div>
        <div class="info-section">
          <h4>Habilidad Especial</h4>
          <p>{{ player.specialAbility.name }}</p>
          <small>{{ player.specialAbility.description }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-ui {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  color: white;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.stats {
  display: flex;
  gap: 1rem;
}

.level, .score {
  font-size: 1.1rem;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 1rem;
}

.ui-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.ui-button:hover {
  background-color: #45a049;
}

.ui-button.danger {
  background-color: #f44336;
}

.ui-button.danger:hover {
  background-color: #da190b;
}

.character-panel {
  max-width: 1200px;
  margin: 1rem auto;
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 1.5rem;
}

.character-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

.info-section {
  padding: 1rem;
  background-color: #333;
  border-radius: 4px;
}

.info-section h4 {
  margin: 0 0 0.5rem 0;
  color: #4CAF50;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  margin: 0.5rem 0;
}

small {
  color: #888;
  display: block;
  margin-top: 0.5rem;
}
</style> 