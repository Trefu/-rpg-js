<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import MapView from '@/views/MapView.vue'
import Button from '@/components/ui/Button.vue'
import ClassSelector from '@/components/ui/ClassSelector.vue'

const gameStore = useGameStore()
const showClassSelector = ref(true)

const handleClassSelected = (className: string) => {
  console.log('Clase seleccionada:', className)
  showClassSelector.value = false
  gameStore.startGame()
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>RPG JS</h1>
      <div v-if="gameStore.isGameActive" class="game-stats">
      </div>
    </header>

    <main class="app-main">
      <ClassSelector
        v-if="showClassSelector"
        @class-selected="handleClassSelected"
      />
      <MapView v-else-if="gameStore.isGameActive" />
      <div v-else class="main-menu">
        <h2>Bienvenido a RPG JS</h2>
        <Button
          text="Comenzar Juego"
          variant="primary"
          @click="showClassSelector = true"
        />
      </div>
    </main>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  background-color: #1a1a1a;
  color: white;
}

.app-header {
  padding: 1rem 2rem;
  background-color: #2a2a2a;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.game-stats {
  display: flex;
  gap: 1rem;
}

.app-main {
  padding: 2rem;
}

.main-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 4rem;
}

h1, h2 {
  margin: 0;
}
</style> 