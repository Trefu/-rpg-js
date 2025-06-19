<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import ClassSelector from './components/ui/ClassSelector.vue'
import CityMap from './components/map/CityMap.vue'
import ZoneSelector from './components/expedition/ZoneSelector.vue'
import ExpeditionMap from './components/expedition/ExpeditionMap.vue'
import CombatView from './components/combat/CombatView.vue'
import GameUI from './components/ui/GameUI.vue'
import { useGameStore } from './stores/game'
import { Player } from './core/Player'
import { Loader } from './core/Loader'
import { AudioManager } from './core/AudioManager'
import { mountainPeakNodes } from './core/zones/MountainPeakNodes'
import type { IZone, INode } from './core/interfaces/IExpedition'

const gameStore = useGameStore()
const currentView = computed(() => gameStore.currentLocation)
const selectedZone = ref<IZone | null>(null)
const expeditionNodes = ref<INode[]>([])
const audioManager = AudioManager.getInstance()

// Manejar cambios de música según la vista actual
watch(currentView, (newView) => {
  switch (newView) {
    case 'expedition-map':
      // Reproducir música de exploración de montaña
      audioManager.playMountainExploration()
      break
    case 'combat':
      // La música de combate se maneja en CombatView
      break
    case 'city':
    case 'expedition':
    case 'class-selector':
    default:
      // Detener música para otras vistas
      audioManager.stopCurrentMusic()
      break
  }
})

onMounted(() => {
  // Inicializar audio manager
  audioManager.setMusicVolume(0.1)
  audioManager.setSFXVolume(0.9)
})

const handleClassSelected = async (className: string) => {
  const loader = Loader.getInstance()
  const selectedClass = loader.getClass(className)
  
  if (selectedClass) {
    const player = new Player('player-1', 'Héroe', 1, 100, 10, 5)
    player.setStatsFromClass(selectedClass.baseStats)
    gameStore.setPlayer(player)
  }
}

const handleGoToExpedition = () => {
  gameStore.navigateTo('expedition')
}

const handleGoToShop = () => {
  gameStore.navigateTo('shop')
}

const handleBackToCity = () => {
  gameStore.navigateTo('city')
}

const handleResetGame = () => {
  gameStore.resetGame()
}

const handleZoneSelected = (zone: IZone) => {
  selectedZone.value = zone
  if (zone.id === 'mountain-peak') {
    expeditionNodes.value = mountainPeakNodes
  } else {
    expeditionNodes.value = []
  }
  gameStore.navigateTo('expedition-map')
}

const handleNodeSelected = (node: INode) => {
  if (node.type === 'combat') {
    gameStore.navigateTo('combat')
  } else {
    // TODO: Implementar lógica para otros tipos de nodos
    console.log('Nodo seleccionado:', node)
  }
}

const handleCombatEnded = (victory: boolean) => {
  if (victory) {
    // Marcar el nodo como completado y volver al mapa
    gameStore.navigateTo('expedition-map')
  } else {
    // En caso de derrota, volver al mapa también
    gameStore.navigateTo('expedition-map')
  }
}
</script>

<template>
  <div class="app">
    <GameUI 
      @reset-game="handleResetGame"
    />
    
    <ClassSelector
      v-if="currentView === 'class-selector'"
      @class-selected="handleClassSelected"
    />

    <CityMap
      v-if="currentView === 'city'"
      @go-to-shop="handleGoToShop"
      @go-to-expedition="handleGoToExpedition"
    />

    <ZoneSelector
      v-if="currentView === 'expedition'"
      @zone-selected="handleZoneSelected"
    />

    <ExpeditionMap
      v-if="currentView === 'expedition-map'"
      :expedition="{
        zone: selectedZone!,
        nodes: expeditionNodes,
        currentNode: null,
        completed: false
      }"
      @node-selected="handleNodeSelected"
    />

    <CombatView
      v-if="currentView === 'combat'"
      @combat-ended="handleCombatEnded"
    />

    <!-- TODO: Implementar vista de tienda -->
    <div v-if="currentView === 'shop'">
      <h2>Tienda (En construcción)</h2>
      <button @click="handleBackToCity">Volver a la ciudad</button>
    </div>
  </div>
</template>

<style>
html, body, #app, .app {
  height: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: #1a1a1a;
  color: white;
}

.app {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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