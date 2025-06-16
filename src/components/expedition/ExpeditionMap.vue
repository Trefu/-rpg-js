<script setup lang="ts">
import { ref } from 'vue'
import type { IExpedition, INode } from '@/core/interfaces/IExpedition'

const props = defineProps<{
  expedition: IExpedition
}>()

const emit = defineEmits<{
  (e: 'nodeSelected', node: INode): void
}>()

const currentNode = ref<string | null>(null)
const availableNodes = ref<string[]>(['start'])

const getNodeIcon = (type: INode['type']) => {
  switch (type) {
    case 'combat': return '⚔️'
    case 'shop': return '🏪'
    case 'event': return '❓'
    default: return '❓'
  }
}

const selectNode = (nodeId: string) => {
  if (!availableNodes.value.includes(nodeId)) return

  const node = props.expedition.nodes.find(n => n.id === nodeId)
  if (!node) return

  node.completed = true
  currentNode.value = nodeId
  availableNodes.value = node.connections

  emit('nodeSelected', node)
}
</script>

<template>
  <div class="expedition-map">
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
        @click="selectNode(node.id)"
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
}

.map-node.available {
  border-color: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.map-node.current {
  border-color: #2196F3;
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.7);
}

.map-node.completed {
  opacity: 0.5;
  cursor: default;
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
}

.connection-line {
  stroke: #3a3a3a;
  stroke-width: 2;
}

.connection-line.available {
  stroke: #4CAF50;
}

.connection-line.completed {
  stroke: #2196F3;
}
</style> 