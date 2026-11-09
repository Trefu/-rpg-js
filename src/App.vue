<script setup lang="ts">
import { computed, defineAsyncComponent, onUnmounted, ref, watch } from 'vue'
import RecruitHeroModal from './components/expedition/RecruitHeroModal.vue'
import CuriosityEventModal from './components/expedition/CuriosityEventModal.vue'
import CuriosityEventToast from './components/expedition/CuriosityEventToast.vue'
import MountainOmen from './components/expedition/MountainOmen.vue'
import GameUI from './components/ui/GameUI.vue'
import CampView from './components/expedition/CampView.vue'
import ShopView from './components/expedition/ShopView.vue'
import '@/styles/campaign.css'
import '@/styles/menus.css'
import { useGameStore } from './stores/game'
import { useExpeditionStore } from './stores/expedition'
import { AudioManager } from './core/AudioManager'
import { RECRUITABLE_HEROES } from './core/heroes/recruitment'
import type { INode } from './core/interfaces/IExpedition'
import type { Hero } from './core/Hero'
import { restoreItemsToMax } from './core/items/items'
import {
  summarizeCuriosityResult,
  type CuriosityResultSummary
} from './core/events/curiosityResultSummary'
import type { ResolveResult } from './core/events/curiosityEvents'

const CombatView = defineAsyncComponent(() => import('./components/combat/CombatView.vue'))
const ExpeditionMap = defineAsyncComponent(() => import('./components/expedition/ExpeditionMap.vue'))
const TrainingView = defineAsyncComponent(() => import('./components/combat/TrainingView.vue'))

const gameStore = useGameStore()
if (!gameStore.loadProgress()) gameStore.initializeCompany()
const expeditionStore = useExpeditionStore()
const currentView = computed(() => gameStore.currentLocation)
const audioManager = AudioManager.getInstance()
const omenVisible = ref(false)
const omenSequence = ref(0)
watch(() => expeditionStore.currentExpedition, expedition => {
  omenSequence.value++
  omenVisible.value = !!expedition?.nodes.some(node => node.curiosityEventId === 'spectral-pass')
})

if (import.meta.env.DEV) {
  ;(window as any).__gameStore = gameStore
  ;(window as any).__expeditionStore = expeditionStore
}

/**
 * Estado del modal de reclutamiento. Solo se abre cuando el jugador
 * selecciona un nodo `recruit-hero` en el mapa. El modal vive en App.vue
 * (no dentro de ExpeditionMap) para que la logica de transicion de
 * vista/combate no se acople a la UI del mapa.
 */
const isRecruitModalOpen = ref(false)
const pendingRecruitNodeId = ref<string | null>(null)

/**
 * Estado del modal de eventos "?". Se abre al hacer click en un nodo
 * `curiosity`. Tras elegir una opcion, el modal emite:
 *   - `resolved` cuando el outcome se aplico (cerramos y completamos).
 *   - `ambush` cuando la opcion dispara un combate (rellenamos los
 *     enemigos del nodo y navegamos a combat; `handleCombatEnded`
 *     se encarga del resto).
 */
const isCuriosityModalOpen = ref(false)
const pendingCuriosityNodeId = ref<string | null>(null)

/**
 * Toast informativo que aparece al volver al mapa tras un evento.
 * Se popula desde `handleCuriosityResolved` (reward/noop) y se
 * extiende desde `handleCombatEnded` (recompensas de emboscada
 * cuando el combate termina en victoria). Auto-dismiss a los 6s.
 */
const curiosityToast = ref<CuriosityResultSummary | null>(null)
let curiosityToastTimer: number | null = null

function showCuriosityToast(summary: CuriosityResultSummary) {
  curiosityToast.value = summary
  if (curiosityToastTimer !== null) {
    window.clearTimeout(curiosityToastTimer)
  }
  curiosityToastTimer = window.setTimeout(() => {
    curiosityToast.value = null
    curiosityToastTimer = null
  }, 6000)
}

function dismissCuriosityToast() {
  curiosityToast.value = null
  if (curiosityToastTimer !== null) {
    window.clearTimeout(curiosityToastTimer)
    curiosityToastTimer = null
  }
}

onUnmounted(() => {
  if (curiosityToastTimer !== null) {
    window.clearTimeout(curiosityToastTimer)
  }
})

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
  isCuriosityModalOpen.value = false
  pendingCuriosityNodeId.value = null
  dismissCuriosityToast()
}

const handleNodeSelected = (node: INode) => {
  expeditionStore.selectNode(node)
  if (node.id === 'start') {
    gameStore.navigateTo('combat')
  } else if (node.type === 'combat' || node.type === 'boss') {
    gameStore.navigateTo('combat')
  } else if (node.type === 'recruit-hero') {
    const allowedIds = expeditionStore.currentConfig?.recruitableHeroIds
    const hasRecruits = RECRUITABLE_HEROES.some(choice =>
      !gameStore.companyHeroes.some(hero => hero.heroClassId === choice.id)
      && (!allowedIds || allowedIds.includes(choice.id)))
    if (!hasRecruits) {
      for (const hero of gameStore.activeHeroes) {
        hero.heal(Math.floor(hero.maxHealth * 0.15))
        hero.restoreEnergy(15)
      }
      expeditionStore.completeNode(node.id)
      gameStore.saveProgress()
      return
    }
    // Abrimos el modal y dejamos el nodo pendiente; al cerrar
    // (reclutar o saltar) lo marcaremos como completado.
    pendingRecruitNodeId.value = node.id
    isRecruitModalOpen.value = true
    gameStore.navigateTo('expedition-map')
  } else if (node.type === 'curiosity') {
    pendingCuriosityNodeId.value = node.id
    isCuriosityModalOpen.value = true
    gameStore.navigateTo('expedition-map')
  } else if (node.type === 'shop') {
    gameStore.openShop(node.id)
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

const handleCuriosityClose = () => {
  const nodeId = pendingCuriosityNodeId.value
  if (nodeId) expeditionStore.completeNode(nodeId)
  isCuriosityModalOpen.value = false
  pendingCuriosityNodeId.value = null
  if (gameStore.activeHeroes.every(h => !h.isAlive)) gameStore.finishRun(false)
  else gameStore.saveProgress()
}

const handleShopClose = () => {
  expeditionStore.completeNode(expeditionStore.selectedNode?.id ?? '')
  gameStore.navigateTo('expedition-map')
  gameStore.saveProgress()
}

/**
 * Recibe el resultado resuelto del modal (despues de que el jugador
 * pulsa "Seguir"). Lo convierte en un resumen legible y lo muestra
 * como toast al volver al mapa.
 */
const handleCuriosityResolved = (payload: { eventId: string, title: string, result: ResolveResult }) => {
  showCuriosityToast(summarizeCuriosityResult(payload.title, payload.result))
}

const handleCuriosityAmbush = (payload: { nodeId: string, enemies: any[] }) => {
  const node = expeditionStore.currentExpedition?.nodes.find(n => n.id === payload.nodeId)
  if (node) {
    node.enemies = payload.enemies
  }
  // Guardamos un placeholder de emboscada en el toast para que al
  // volver del combate el jugador recuerde el contexto. Se reemplazara
  // por el resumen de victoria si gana, o se borrara si pierde.
  showCuriosityToast({
    kind: 'ambush',
    title: 'Emboscada',
    flavor: 'Algo se mueve entre las sombras...',
    lines: ['Combate en curso']
  })
  isCuriosityModalOpen.value = false
  pendingCuriosityNodeId.value = null
  gameStore.navigateTo('combat')
}

const handleCombatEnded = (victory: boolean) => {
  // Heroismo es un recurso por-combate: la barra no se mantiene entre
  // combates (victoria o derrota) — siempre vuelve a 0 al salir.
  for (const hero of gameStore.heroes) {
    if (!hero) continue
    hero.heroism = 0
  }
  if (victory) {
    const node = expeditionStore.selectedNode
    if (node?.type === 'combat' || node?.type === 'boss' || node?.type === 'curiosity') {
      const defeatedEnemies = (node.enemies ?? []).filter(e => !e.isAlive)
      let totalXp = 0
      let totalGold = 0
      for (const e of defeatedEnemies) {
        const r = e.getRewards()
        totalXp += r.experience
        totalGold += r.gold
      }
      const floor = node.depth ?? (node.id === 'boss' ? (expeditionStore.currentConfig?.totalFloors ?? 10)
        : node.id === 'start' ? 1 : Number(node.id.split('-')[1]) + 1)
      gameStore.awardCombat(node.id, totalXp, totalGold, floor)
      restoreItemsToMax(gameStore.teamItems)
      for (const hero of gameStore.heroes) {
        if (!hero) continue
        if (!hero.isAlive) {
          hero.isAlive = true
          // Revive fallen heroes at 25% health after victory
          hero.health = Math.floor(hero.maxHealth * 0.25)
        }
      }
      // Si el combate vino de una emboscada de curiosidad, extendemos
      // el toast con los premios de combate. Asi el jugador ve ambos:
      // el contexto narrativo y el botin.
      if (node.type === 'curiosity' && (totalXp > 0 || totalGold > 0)) {
        const lines: string[] = []
        if (totalXp > 0) lines.push(`+${totalXp} XP por combate`)
        if (totalGold > 0) lines.push(`+${totalGold} por combate`)
        const existing = curiosityToast.value
        const title = existing?.title ?? 'Emboscada'
        const flavor = existing?.flavor ?? 'Sales victorioso del combate.'
        showCuriosityToast({
          kind: 'reward',
          title,
          flavor,
          lines: [...(existing?.lines ?? []), ...lines]
        })
      }
    }
    expeditionStore.completeNode(expeditionStore.selectedNode?.id || '')
    if (expeditionStore.selectedNode?.type === 'boss') {
      expeditionStore.completeExpedition()
      gameStore.finishRun(true)
      return
    }
    gameStore.saveProgress()
    gameStore.navigateTo('expedition-map')
  } else {
    // A defeat ends the attempt while preserving the company.
    const allDead = gameStore.heroes.every(h => !h || !h.isAlive)
    if (allDead) {
      dismissCuriosityToast()
      gameStore.finishRun(false)
      return
    }
    // Si pierdes la emboscada pero sigues vivo, limpiamos el toast
    // narrativo para no confundir al volver al mapa.
    if (curiosityToast.value?.kind === 'ambush') {
      dismissCuriosityToast()
    }
    gameStore.navigateTo('expedition-map')
  }
}

const handleTrainingEnded = () => {
  gameStore.navigateTo('city')
}
</script>

<template>
  <div class="app" :inert="omenVisible || undefined">
    <GameUI @reset-game="handleResetGame" />

    <ExpeditionMap v-if="currentView === 'expedition-map'" @node-selected="handleNodeSelected" />

    <CombatView v-if="currentView === 'combat'" @combat-ended="handleCombatEnded" />

    <TrainingView v-if="currentView === 'training'" @training-ended="handleTrainingEnded" />

    <CampView v-if="currentView === 'city' || currentView === 'pre-game'" />
    <ShopView v-if="currentView === 'shop'" @close="handleShopClose" />

    <RecruitHeroModal
      v-if="isRecruitModalOpen"
      @close="handleRecruitModalClose"
      @hero-recruited="handleHeroRecruited"
    />

    <CuriosityEventModal
      v-if="isCuriosityModalOpen"
      @close="handleCuriosityClose"
      @ambush="handleCuriosityAmbush"
      @resolved="handleCuriosityResolved"
    />

    <CuriosityEventToast
      :summary="curiosityToast"
      @dismiss="dismissCuriosityToast"
    />
  </div>
  <MountainOmen v-if="omenVisible" :key="omenSequence" @done="omenVisible = false" />
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
  background-color: var(--jrpg-void);
  color: var(--jrpg-text);
}

.app {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
