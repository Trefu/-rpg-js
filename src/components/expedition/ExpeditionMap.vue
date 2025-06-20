<script setup lang="ts">
import { computed } from 'vue'
import type { INode } from '@/core/interfaces/IExpedition'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'

const expeditionStore = useExpeditionStore()
const gameStore = useGameStore()

const currentNode = computed(() => expeditionStore.selectedNode?.id || null)
const availableNodes = computed(() => expeditionStore.availableNodes)
const expedition = computed(() => expeditionStore.currentExpedition)

const getNodeIcon = (type: INode['type']) => {
  switch (type) {
    case 'combat': return '⚔️'
    case 'shop': return '🏪'
    case 'rest': return '🏕️'
    case 'treasure': return '💎'
    case 'event': return '❓'
    case 'boss': return '👑'
    case 'city': return '🏰'
    default: return '❓'
  }
}

const isNodeReachable = (node: INode) => {
  if (!expeditionStore.currentExpedition) return false

  // El nodo inicial siempre es alcanzable si es el primer turno
  if (expeditionStore.currentExpedition.currentNode === null) {
    const startNode = expeditionStore.currentExpedition.nodes.find(n => n.type === 'city')
    if (startNode) {
      return startNode.connections.includes(node.id)
    }
  }

  // Un nodo es alcanzable si está conectado al nodo completado más recientemente
  const lastCompletedNode = expeditionStore.currentExpedition.currentNode
  return lastCompletedNode?.connections.includes(node.id) ?? false
}

const handleNodeClick = (node: INode) => {
  if (node.type === 'city' || node.completed || !isNodeReachable(node)) return

  expeditionStore.selectNode(node)

  if (node.type === 'combat') {
    gameStore.navigateTo('combat')
  } else {
    // Handle other node types (shop, event, etc.)
    console.log(`Entering ${node.type} node...`)
  }
}
</script>

<template>
  <div v-if="expedition" class="expedition-map">
    <h2>Expedición: {{ expedition.zone.name }}</h2>
    <div class="map-container">
      <!-- Líneas de conexión -->
      <svg class="connections">
        <template v-for="node in expedition.nodes" :key="`node-${node.id}`">
          <line
            v-for="connectionId in node.connections"
            :key="`${node.id}-${connectionId}`"
            :x1="`${node.position.x}%`"
            :y1="`${node.position.y}%`"
            :x2="`${expedition.nodes.find(n => n.id === connectionId)?.position.x}%`"
            :y2="`${expedition.nodes.find(n => n.id === connectionId)?.position.y}%`"
            class="connection-line"
            :class="{ 
              'available': availableNodes.includes(node.id) && availableNodes.includes(connectionId),
              'completed': node.completed || expedition.nodes.find(n => n.id === connectionId)?.completed
            }"
          />
        </template>
      </svg>

      <!-- Nodos -->
      <div
        v-for="node in expedition.nodes"
        :key="node.id"
        class="map-node"
        :class="[
          node.type,
          { 
            completed: node.completed,
            current: node.id === currentNode,
            available: availableNodes.includes(node.id)
          }
        ]"
        :style="{
          left: `${node.position.x}%`,
          top: `${node.position.y}%`
        }"
        @click="handleNodeClick(node)"
      >
        <span class="node-icon">{{ getNodeIcon(node.type) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.expedition-map {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.map-container {
  position: relative;
  height: 600px;
  background-color: #1a1a1a;
  border-radius: 8px;
  margin-top: 2rem;
}

.map-node {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #2a2a2a;
  border: 2px solid #3a3a3a;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.map-node.available {
  border-color: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  animation: pulse 1.5s infinite;
}

.map-node.current {
  border-color: #2196F3;
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.7);
}

.map-node.completed {
  opacity: 0.5;
  cursor: default;
}

.map-node.boss {
  width: 60px;
  height: 60px;
  background-color: #f44336;
  border-color: #d32f2f;
}

.map-node.boss .node-icon {
  font-size: 2rem;
}

.node-icon {
  font-size: 1.5rem;
}

.connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.connection-line {
  stroke: #3a3a3a;
  stroke-width: 2;
}

.connection-line.available {
  stroke: #4CAF50;
  stroke-width: 3;
  filter: drop-shadow(0 0 3px #4CAF50);
}

.connection-line.completed {
  stroke: #2196F3;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
  }
  100% {
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  }
}
</style> 