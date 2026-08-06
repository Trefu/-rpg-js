<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { storeToRefs } from 'pinia'
import AudioControls from './AudioControls.vue'
import hammerIcon from '@/assets/icons/hammer-drop.png'

const emit = defineEmits<{
  (e: 'resetGame'): void
}>()

const gameStore = useGameStore()
const { player } = storeToRefs(gameStore)

const showCharacter = ref(false)
const isDev = import.meta.env.DEV

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
        <span class="level">Nivel: {{ player?.level || 1 }}</span>
      </div>
      <div class="actions">
        <AudioControls />
        <button v-if="isDev" class="ui-button training" @click="gameStore.navigateTo('training')" title="Pelea contra el dummy y prueba habilidades">
          <img :src="hammerIcon" alt="" class="ui-btn-icon" /> Sala de Pruebas
        </button>
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
            <li>Defensa: {{ player.defense() }}</li>
            <li>Velocidad: {{ player.speed }}</li>
          </ul>
        </div>
        <div class="info-section">
          <h4>Habilidades</h4>
          <ul v-if="player.abilities.length > 0">
            <li v-for="ability in player.abilities" :key="ability.type">
              {{ ability.name }}
            </li>
          </ul>
          <p v-else>Sin habilidades</p>
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

.level{
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

.ui-button.training {
  background-color: #ff9800;
  color: #1a1a2e;
  font-weight: bold;
}

.ui-button.training:hover {
  background-color: #ffa733;
  box-shadow: 0 0 12px rgba(255, 152, 0, 0.5);
}

.ui-btn-icon {
  width: 1em;
  height: 1em;
  display: inline-block;
  vertical-align: -0.18em;
  margin-right: 0.3rem;
  filter: brightness(0) invert(1);
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