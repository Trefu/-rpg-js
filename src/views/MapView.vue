<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'
import type { MapNode } from '@/types/game'
import Button from '@/components/ui/Button.vue'

const gameStore = useGameStore()

// Ejemplo de nodos del mapa
const mapNodes: MapNode[] = [
  {
    id: 'start',
    position: { x: 0, y: 0 },
    type: 'rest',
    connections: ['combat1']
  },
  {
    id: 'combat1',
    position: { x: 100, y: 0 },
    type: 'combat',
    connections: ['start', 'shop1']
  },
  {
    id: 'shop1',
    position: { x: 200, y: 0 },
    type: 'shop',
    connections: ['combat1']
  }
]
</script>

<template>
  <div class="map-view">
    <h2>Mapa del Juego</h2>
    <div class="map-container">
      <div
        v-for="node in mapNodes"
        :key="node.id"
        class="map-node"
        :class="`map-node--${node.type}`"
        :style="{
          left: `${node.position.x}px`,
          top: `${node.position.y}px`
        }"
      >
        {{ node.type }}
      </div>
    </div>
    <div class="map-controls">
      <Button
        text="Volver al Menú"
        variant="secondary"
        @click="gameStore.endGame"
      />
    </div>
  </div>
</template>

<style scoped>
.map-view {
  padding: 2rem;
}

.map-container {
  position: relative;
  width: 100%;
  height: 400px;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 2rem 0;
}

.map-node {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.map-node:hover {
  transform: scale(1.1);
}

.map-node--combat {
  background-color: #f44336;
}

.map-node--shop {
  background-color: #2196F3;
}

.map-node--rest {
  background-color: #4CAF50;
}

.map-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
</style> 