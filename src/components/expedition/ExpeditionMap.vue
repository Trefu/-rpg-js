<script setup lang="ts">
import { computed, ref } from 'vue'
import type { INode } from '@/core/interfaces/IExpedition'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'
import combatIcon from '@/assets/icons/crossed-swords.png'
import shopIcon from '@/assets/icons/chest.png'
import curiosityIcon from '@/assets/icons/help.png'
import recruitIcon from '@/assets/icons/shield.png'
import bossIcon from '@/assets/icons/crown.png'
import GoldAmount from '@/components/ui/GoldAmount.vue'
import CombatPreviewModal from './CombatPreviewModal.vue'

const expeditionStore = useExpeditionStore()
const game = useGameStore()

const currentNode = computed(() => expeditionStore.selectedNode?.id || null)
const availableNodes = computed(() => expeditionStore.availableNodes)
const expedition = computed(() => expeditionStore.currentExpedition)
const previewNode = ref<INode | null>(null)
const mapHeight = computed(() => Math.max(600, new Set(expedition.value?.nodes.map(node => node.position.y)).size * 82))

const getNodeIcon = (type: INode['type']) => {
  switch (type) {
    case 'combat': return combatIcon
    case 'shop': return shopIcon
    case 'curiosity': return curiosityIcon
    case 'recruit-hero': return recruitIcon
    case 'boss': return bossIcon
    default: return curiosityIcon
  }
}

const isNodeReachable = (node: INode) => {
  if (!expeditionStore.currentExpedition) return false
  if (node.completed) return false
  // Un nodo es alcanzable si esta en la lista de nodos disponibles que
  // calcula el store: conexiones del nodo actualmente seleccionado (o el
  // nodo start si la expedicion acaba de empezar). Esto permite avanzar
  // correctamente despues de pasar por nodos shop/curiosity que se
  // auto-completan al hacer click: su `selectedNode` queda fijado al
  // propio nodo y sus hijos quedan desbloqueados.
  return availableNodes.value.includes(node.id)
}

const handleNodeClick = (node: INode) => {
  if (node.completed || !isNodeReachable(node)) return
  if (node.type === 'combat' || node.type === 'boss') {
    previewNode.value = node
    return
  }
  emit('nodeSelected', node)
}

function confirmCombat() {
  const node = previewNode.value
  previewNode.value = null
  if (node && isNodeReachable(node)) emit('nodeSelected', node)
}

const emit = defineEmits<{
  (e: 'nodeSelected', node: INode): void
}>()
</script>

<template>
  <div v-if="expedition" class="expedition-map campaign-shell">
    <div class="campaign-topline"><div class="campaign-purse"><GoldAmount :amount="game.gold" /></div></div>
    <header class="map-heading"><div><span class="campaign-eyebrow">Intento {{ game.attempts }} · Elige el siguiente paso</span><h1>{{ expedition.config.displayName }}</h1></div><button class="campaign-button" @click="game.finishRun(false)">Volver al campamento</button></header>
    <div class="company-progress"><div v-for="hero in game.activeHeroes" :key="hero.id"><img :src="hero.sprite" alt="" /><span><strong>{{ hero.name }} <small>Nv. {{ hero.level }}</small></strong><small>{{ hero.health }}/{{ hero.maxHealth }} HP · {{ hero.experience }}/{{ hero.experienceToNextLevel }} XP</small></span></div></div>
    <div class="map-legend"><span><img :src="combatIcon" alt="" />Combate</span><span><img :src="shopIcon" alt="" />Mercader</span><span><img :src="curiosityIcon" alt="" />Encuentro</span><span><img :src="recruitIcon" alt="" />Compañero</span><span><img :src="bossIcon" alt="" />La cima</span></div>
    <p class="map-hint campaign-note">Pulsa un combate para ver sus enemigos y recompensas. Puedes comparar caminos antes de confirmar.<template v-if="expedition.config.generator.progressionGate && game.attempts < expedition.config.generator.progressionGate.minimumAttempts"> El capitán del paso está fuera de alcance en el primer intento: vuelve con más experiencia y equipo.</template></p>
    <div class="map-container" :style="{ height: `${mapHeight}px` }">
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
              'available': (node.id === currentNode && node.completed && availableNodes.includes(connectionId)) || (node.id === 'start' && !node.completed),
              'completed': node.completed || expedition.nodes.find(n => n.id === connectionId)?.completed
            }"
          />
        </template>
      </svg>

      <!-- Nodos -->
      <button
        v-for="node in expedition.nodes"
        :key="node.id"
        class="map-node"
        type="button"
        :title="`${node.type} — ${node.enemies?.map(e => e.name).join(', ') ?? ''}`"
        :aria-label="`${node.type === 'boss' ? 'Ver jefe' : node.type === 'combat' ? 'Ver combate' : node.type === 'recruit-hero' ? 'Reclutar compañero' : node.type === 'shop' ? 'Visitar mercader' : 'Explorar encuentro'}${node.depth ? ` · Paso ${node.depth}` : ''}`"
        :disabled="!isNodeReachable(node)"
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
        <span class="node-icon"><img :src="getNodeIcon(node.type)" alt="" /></span>
      </button>
    </div>
    <CombatPreviewModal v-if="previewNode" :node="previewNode" @close="previewNode = null" @confirm="confirmCombat" />
  </div>
</template>

<style scoped>
@layer menu-legacy {
.map-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }.map-heading h1 { margin-bottom: 0; }
.company-progress { display: flex; gap: 12px; flex-wrap: wrap; }.company-progress > div { display: flex; align-items: center; gap: 10px; padding: 10px 15px 10px 8px; border: 1px solid #b6c3a028; background: #21312670; border-radius: 9px; }.company-progress img { width: 35px; height: 40px; object-fit: contain; }.company-progress strong { display: block; font: 500 .85rem Georgia, serif; color: #ded9ba; }.company-progress small { display: block; font-size: .62rem; color: #96a68c; margin-top: 5px; }.company-progress strong small { display: inline; padding-left: 6px; font-family: system-ui, sans-serif; font-size: .58rem; }
.map-legend { display: flex; flex-wrap: wrap; gap: 17px; margin: 24px 0 0; font-size: .6rem; color: #8f9f84; }.map-legend span { display: flex; align-items: center; gap: 6px; }.map-legend img { width: 14px; height: 14px; opacity: .6; }
.expedition-map {
  padding-bottom: 40px;
}

.map-container {
  position: relative;
  height: 600px;
  background: radial-gradient(ellipse at center, #253a2a85, transparent 75%), #14231a;
  border: 1px solid #b6c3a021;
  border-radius: 2px;
  border: 3px solid #8b8450;
  box-shadow: inset 3px 3px #bec18b35, inset -3px -3px #101a12, 3px 4px #0009;
  margin-top: 2rem;
}

@media (max-height: 820px) {
  .expedition-map {
    padding-bottom: 1rem;
  }
  .map-container {
    height: calc(100vh - 140px);
    margin-top: 1rem;
  }
}
@media (max-width: 720px) { .map-heading { flex-wrap: wrap; }.map-heading .campaign-button { font-size: .65rem; }.company-progress { gap: 8px; }.company-progress > div { flex: 1 1 130px; padding: 8px; }.map-legend { gap: 12px; } }

@media (max-height: 600px) {
  .map-container {
    height: calc(100vh - 100px);
  }
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

.map-node:disabled { cursor: default; }
.map-node:focus-visible { outline: 3px solid #f0d975; outline-offset: 5px; }
.map-hint { margin-top: 16px; }

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

.map-node.boss .node-icon img {
  width: 44px;
  height: 44px;
}

.node-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.node-icon img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  filter: brightness(0) invert(1);
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

/* Route markers: slate-blue frames with icy-blue route highlights. */
.company-progress > div { border-color:#7089a8;background:#263d5b; }
.company-progress strong { color:#dceaff; }
.company-progress small { color:#b2c9e0; }
.map-legend { color:#b2c4d9; }
.map-container { background:radial-gradient(ellipse at center,#304d7085,transparent 75%),#14243a;border-color:#7894b4;box-shadow:inset 3px 3px #c4ddf333,inset -3px -3px #101a2b,3px 4px #0009; }
.map-node { background-color:#263d5a;border-color:#7086a4; }
.map-node:focus-visible { outline-color:#a8dfff; }
.map-node.available { border-color:#75c9ed;box-shadow:0 0 10px #53bce288; }
.map-node.current { border-color:#b4dcf8;box-shadow:0 0 15px #5c9dccb3; }
.map-node.boss { background-color:#435a83;border-color:#9cc6ef; }
.connection-line { stroke:#4c6682; }
.connection-line.available { stroke:#72c9ec;filter:drop-shadow(0 0 3px #72c9ec); }
.connection-line.completed { stroke:#9bbde1; }
@keyframes pulse { 0%,100%{box-shadow:0 0 8px #53bce288} 50%{box-shadow:0 0 17px #53bce2cc} }
}
</style>
