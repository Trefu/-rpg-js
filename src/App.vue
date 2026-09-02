<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ExpeditionMap from './components/expedition/ExpeditionMap.vue'
import RecruitHeroModal from './components/expedition/RecruitHeroModal.vue'
import CombatView from './components/combat/CombatView.vue'
import TrainingView from './components/combat/TrainingView.vue'
import PreGameView from './components/pregame/PreGameView.vue'
import GameUI from './components/ui/GameUI.vue'
import { useGameStore } from './stores/game'
import { useExpeditionStore } from './stores/expedition'
import { AudioManager } from './core/AudioManager'
import type { ZoneId } from './core/zones/EnemyPools'
import type { INode } from './core/interfaces/IExpedition'
import type { Hero } from './core/Hero'
import { restoreItemsToMax } from './core/items/items'

const gameStore = useGameStore()
const expeditionStore = useExpeditionStore()
const currentView = computed(() => gameStore.currentLocation)
const audioManager = AudioManager.getInstance()

/**
 * Estado del modal de reclutamiento. Solo se abre cuando el jugador
 * selecciona un nodo `recruit-hero` en el mapa. El modal vive en App.vue
 * (no dentro de ExpeditionMap) para que la logica de transicion de
 * vista/combate no se acople a la UI del mapa.
 */
const isRecruitModalOpen = ref(false)
const pendingRecruitNodeId = ref<string | null>(null)

audioManager.playMenuMusic()

watch(currentView, (newView) => {
  if (newView === 'combat' || newView === 'shop') {
    audioManager.stopCurrentMusic()
  } else {
    audioManager.playMenuMusic()
  }
})

const handleResetGame = () => {
  gameStore.resetGame()
  expeditionStore.resetExpedition()
  isRecruitModalOpen.value = false
  pendingRecruitNodeId.value = null
}

const handleStartRun = (payload: { zoneId: ZoneId, heroes: Hero[] }) => {
  gameStore.beginRun({ zoneId: payload.zoneId, heroes: payload.heroes })
}

const handleNodeSelected = (node: INode) => {
  expeditionStore.selectNode(node)
  if (node.id === 'start') {
    gameStore.navigateTo('combat')
  } else if (node.type === 'combat' || node.type === 'boss') {
    gameStore.navigateTo('combat')
  } else if (node.type === 'recruit-hero') {
    // Abrimos el modal y dejamos el nodo pendiente; al cerrar
    // (reclutar o saltar) lo marcaremos como completado.
    pendingRecruitNodeId.value = node.id
    isRecruitModalOpen.value = true
    gameStore.navigateTo('expedition-map')
  } else if (node.type === 'shop' || node.type === 'curiosity') {
    expeditionStore.completeNode(node.id)
    gameStore.navigateTo('expedition-map')
  }
}

const handleRecruitModalClose = () => {
  const nodeId = pendingRecruitNodeId.value
  if (nodeId) expeditionStore.completeNode(nodeId)
  isRecruitModalOpen.value = false
  pendingRecruitNodeId.value = null
}

const handleHeroRecruited = (_hero: Hero) => {
  // El modal ya invoco addHeroToFirstFreeSlot y se cerrara solo.
  // Aqui podriamos emitir un toast/log si lo deseamos.
}

const handleCombatEnded = (victory: boolean) => {
  if (victory) {
    const node = expeditionStore.selectedNode
    if (node?.type === 'combat' || node?.type === 'boss') {
      const defeatedEnemies = (node.enemies ?? []).filter(e => !e.isAlive)
      let totalXp = 0
      let totalGold = 0
      for (const e of defeatedEnemies) {
        const r = e.getRewards()
        totalXp += r.experience
        totalGold += r.gold
      }
      for (const hero of gameStore.heroes) {
        if (!hero) continue
        hero.gainExperience(totalXp)
        hero.addGold(totalGold)
        restoreItemsToMax(hero)
      }
      for (const hero of gameStore.heroes) {
        if (!hero) continue
        if (!hero.isAlive) {
          hero.isAlive = true
          // Revive fallen heroes at 25% health after victory
          hero.health = Math.floor(hero.maxHealth * 0.25)
        }
      }
    }
    expeditionStore.completeNode(expeditionStore.selectedNode?.id || '')
    if (expeditionStore.selectedNode?.type === 'boss') {
      expeditionStore.completeExpedition()
    }
    gameStore.navigateTo('expedition-map')
  } else {
    // [GAME OVER] All heroes have fallen - show thanks and return to start
    const allDead = gameStore.heroes.every(h => !h || !h.isAlive)
    if (allDead) {
      window.alert('Gracias por jugar.下次好运！')
      handleResetGame()
      return
    }
    gameStore.navigateTo('expedition-map')
  }
}

const handleTrainingEnded = () => {
  gameStore.navigateTo('city')
}
</script>

<template>
  <div class="app">
    <GameUI @reset-game="handleResetGame" />

    <PreGameView v-if="currentView === 'pre-game'" @start="handleStartRun" />

    <ExpeditionMap v-if="currentView === 'expedition-map'" @node-selected="handleNodeSelected" />

    <CombatView v-if="currentView === 'combat'" @combat-ended="handleCombatEnded" />

    <TrainingView v-if="currentView === 'training'" @training-ended="handleTrainingEnded" />

    <div v-if="currentView === 'shop'">
      <h2>Tienda (En construccion)</h2>
      <button @click="gameStore.navigateTo('expedition-map')">Volver</button>
    </div>

    <RecruitHeroModal
      v-if="isRecruitModalOpen"
      @close="handleRecruitModalClose"
      @hero-recruited="handleHeroRecruited"
    />
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