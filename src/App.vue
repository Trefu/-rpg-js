<script setup lang="ts">
import { computed, ref } from 'vue'
import ClassSelector from './components/ui/ClassSelector.vue'
import CityMap from './components/map/CityMap.vue'
import ZoneSelector from './components/expedition/ZoneSelector.vue'
import ExpeditionMap from './components/expedition/ExpeditionMap.vue'
import GameUI from './components/ui/GameUI.vue'
import { useGameStore } from './stores/game'
import type { IZone, INode } from './core/interfaces/IExpedition'

const gameStore = useGameStore()
const currentView = computed(() => gameStore.currentLocation)
const selectedZone = ref<IZone | null>(null)
const expeditionNodes = ref<INode[]>([])

const mountainNodes: INode[] = [
  { id: 'start', type: 'combat', position: { x: 50, y: 10 }, connections: ['combat1', 'combat2', 'combat3'], completed: false },
  { id: 'combat1', type: 'combat', position: { x: 30, y: 30 }, connections: ['shop1', 'event1'], completed: false },
  { id: 'combat2', type: 'combat', position: { x: 50, y: 30 }, connections: ['event1', 'shop1', 'combat4'], completed: false },
  { id: 'combat3', type: 'combat', position: { x: 70, y: 30 }, connections: ['shop1', 'combat4'], completed: false },
  { id: 'shop1', type: 'shop', position: { x: 30, y: 50 }, connections: ['combat5'], completed: false },
  { id: 'event1', type: 'event', position: { x: 50, y: 50 }, connections: ['combat5'], completed: false },
  { id: 'combat4', type: 'combat', position: { x: 70, y: 50 }, connections: ['combat5'], completed: false },
  { id: 'combat5', type: 'combat', position: { x: 50, y: 70 }, connections: [], completed: false }
]

const handleClassSelected = (className: string) => {
  gameStore.navigateTo('city')
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
    expeditionNodes.value = mountainNodes
  } else {
    expeditionNodes.value = []
  }
  gameStore.navigateTo('expedition-map')
}

const handleNodeSelected = (node: INode) => {
  // TODO: Implementar lógica según el tipo de nodo
  console.log('Nodo seleccionado:', node)
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

/* Ensure content is not hidden behind the sticky GameUI */
.app > *:not(.game-ui) {
  margin-top: 70px;
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