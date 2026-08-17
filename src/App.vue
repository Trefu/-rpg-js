<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import ExpeditionMap from './components/expedition/ExpeditionMap.vue'
import CombatView from './components/combat/CombatView.vue'
import TrainingView from './components/combat/TrainingView.vue'
import GameUI from './components/ui/GameUI.vue'
import { useGameStore } from './stores/game'
import { useExpeditionStore } from './stores/expedition'
import { Warrior } from './core/heroes/Warrior'
import { AudioManager } from './core/AudioManager'
import { createWarriorAttackAbility, createSecondWindAbility } from './core/abilities/Abilities'
import type { INode } from './core/interfaces/IExpedition'

const gameStore = useGameStore()
const expeditionStore = useExpeditionStore()
const currentView = computed(() => gameStore.currentLocation)
const audioManager = AudioManager.getInstance()

watch(currentView, (newView) => {
  if (newView === 'expedition-map') {
    audioManager.playMountainExploration()
  } else if (newView === 'city' || newView === 'shop') {
    audioManager.stopCurrentMusic()
  }
})

onMounted(() => {
  initGame()
})

function initGame() {
  const warrior = new Warrior(1)
  warrior.learnAbility(createWarriorAttackAbility())
  warrior.learnAbility(createSecondWindAbility())
  gameStore.startGame([warrior])
  expeditionStore.startExpedition()
  gameStore.navigateTo('expedition-map')
}

const handleResetGame = () => {
  gameStore.resetGame()
  expeditionStore.resetExpedition()
  initGame()
}

const handleNodeSelected = (node: INode) => {
  expeditionStore.selectNode(node)
  if (node.id === 'start') {
    gameStore.navigateTo('combat')
  } else if (node.type === 'combat' || node.type === 'boss') {
    gameStore.navigateTo('combat')
  } else if (node.type === 'shop') {
    gameStore.navigateTo('shop')
  } else if (node.type === 'curiosity') {
    gameStore.navigateTo('expedition-map')
  }
}

const handleCombatEnded = (victory: boolean) => {
  if (victory) {
    expeditionStore.completeNode(expeditionStore.selectedNode?.id || '')
    if (expeditionStore.selectedNode?.type === 'boss') {
      expeditionStore.completeExpedition()
    }
  }
  gameStore.navigateTo('expedition-map')
}

const handleTrainingEnded = () => {
  gameStore.navigateTo('city')
}
</script>

<template>
  <div class="app">
    <GameUI @reset-game="handleResetGame" />

    <ExpeditionMap v-if="currentView === 'expedition-map'" @node-selected="handleNodeSelected" />

    <CombatView v-if="currentView === 'combat'" @combat-ended="handleCombatEnded" />

    <TrainingView v-if="currentView === 'training'" @training-ended="handleTrainingEnded" />

    <div v-if="currentView === 'shop'">
      <h2>Tienda (En construccion)</h2>
      <button @click="gameStore.navigateTo('expedition-map')">Volver</button>
    </div>
  </div>
</template>

<style>
html,
body,
#app,
.app {
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
</style>