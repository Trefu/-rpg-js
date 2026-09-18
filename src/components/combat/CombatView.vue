<script setup lang="ts">
import '@/styles/combat.css'
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useCombat } from '@/composables/useCombat'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'
import { MAX_HEROES } from '@/stores/game'
import type { Hero } from '@/core/Hero'
import type { IAbility } from '@/core/interfaces/IAbility'
import DefenseChallenge from './DefenseChallenge.vue'
import AnnouncementBanner from './AnnouncementBanner.vue'
import CombatLogModal from './CombatLogModal.vue'
import CombatLogFab from './CombatLogFab.vue'
import HeroCard from './HeroCard.vue'
import EnemyCard from './EnemyCard.vue'
import TurnOrderBar from './TurnOrderBar.vue'
import MobileCombatHud from './MobileCombatHud.vue'
import AbilitiesActionBar from './AbilitiesActionBar.vue'
import EnemyDebugPanel from './EnemyDebugPanel.vue'
import ItemsModal from '@/components/ui/ItemsModal.vue'
import type { DefensePhaseResult } from '@/core/defense/types'
import type { IEnemy } from '@/core/interfaces/ICharacter'
import { useMediaQuery } from '@/composables/useMediaQuery'

const props = defineProps<{
  enemyList?: IEnemy[]
  isTraining?: boolean
}>()

const emit = defineEmits<{
  (e: 'combatEnded', victory: boolean): void
  (e: 'trainingEnded'): void
}>()

const expeditionStore = useExpeditionStore()
const gameStore = useGameStore()

const combatOptions: { isTraining?: boolean; onCombatEnd?: (victory: boolean) => void; onTrainingEnd?: () => void } = {
  onCombatEnd: (victory: boolean) => emit('combatEnded', victory)
}
if (props.isTraining) {
  combatOptions.isTraining = true
  combatOptions.onTrainingEnd = () => emit('trainingEnded')
}

const {
  player,
  heroes,
  enemies,
  selectedEnemy,
  selectedAbility,
  combatLog,
  isSelectingTarget,
  attackingEnemyId,
  attackedHeroIds,
  playerHitPopups,
  enemyHitPopups,
  enemyVfxEffects,
  heroVfxEffects,
  abilityCooldowns,
  announcement,
  abilities,
  abilityShortcuts,
  isDefenseActive,
  defensePattern,
  defenseZones,
  defensePhaseIndex,
  defenseIsCrit,
  defenseClouded,
  defenseRooted,
  defenseRootedStacks,
  defenseRootedOverlay,
  defenseBlinded,
  selectAbility,
  cancelAction,
  handleCombatShortcuts,
  selectEnemy,
  selectAlly,
  selectAction,
  initializeCombat,
  cleanup,
  actionRequiresTarget,
  isPlayerInputLocked,
  handleDefensePhaseComplete,
  handleDefenseAllPhasesComplete,
  closeDefenseChallenge,
  canTargetAllies,
  canTargetEnemies,

  turnQueue,
  turnActors,
  currentActorId,

  showItemsModal,
  selectedItem,
  inventory,
  usedItemThisTurn,
  selectItem,
  itemCanTargetAllies
} = useCombat(combatOptions)

const actorsById = computed<Record<string, import('@/core/turn-engine/TurnEngine').TurnActor>>(() => {
  const map: Record<string, import('@/core/turn-engine/TurnEngine').TurnActor> = {}
  for (const actor of turnActors.value) map[actor.id] = actor
  return map
})

const isMobile = useMediaQuery('(max-width: 720px)')

const isDev = import.meta.env.DEV
const showEnemyDebug = computed(() => isDev && !isMobile.value && enemies.value.length > 0)

function onMobileAbility(ability: IAbility, index: number) {
  selectAbility(ability, index)
}

function onMobileObject() {
  selectAction('Objeto')
}

const canCancelSelectedAbility = computed(() => {
  return isSelectingTarget.value && !!selectedAbility.value && actionRequiresTarget(selectedAbility.value)
})

function onCancelAbility() {
  cancelAction()
}

function onItemsModalSelectItem(entryId: string) {
  selectItem(entryId)
}

function onItemsModalClose() {
  closeItemsModal()
}

function isAllySelectable(hero: Hero | null): boolean {
  if (!hero || !isSelectingTarget.value) return false
  if (selectedItem.value) {
    return hero.isAlive && itemCanTargetAllies(selectedItem.value)
  }
  if (selectedAbility.value && canTargetAllies(selectedAbility.value)) {
    return hero.isAlive
  }
  return false
}

const heroSlots = computed(() => {
  const slots: (Hero | null)[] = []
  for (let i = 0; i < MAX_HEROES; i++) {
    slots.push(heroes.value[i] ?? null)
  }
  return slots
})

// Mapea cada enemigo vivo a su posicion dentro de aliveEnemies (su hotkey).
// Los enemigos muertos quedan fuera del mapa (-1) para que no muestren hotkey
// y para que el handler de teclado y el HUD esten sincronizados.
const aliveIndexByEnemyId = computed<Record<string, number>>(() => {
  const map: Record<string, number> = {}
  enemies.value.forEach((enemy) => {
    if (!enemy.isAlive) {
      map[enemy.id] = -1
    }
  })
  let aliveIdx = 0
  enemies.value.forEach((enemy) => {
    if (enemy.isAlive) {
      map[enemy.id] = aliveIdx++
    }
  })
  return map
})

// Distribuye offsets aleatorios para que los enemigos no queden en linea perfectamente.
// Cada enemigo recibe un offset Y (entre -180 y 180 distribuidos) y X (entre -30 y 30).
// Tambien se le asigna una celda aleatoria de la grilla 3x2 para evitar que queden en grilla perfecta.
// Se reasigna cuando cambia la lista de enemigos.
const enemyPositions = ref<Record<string, { x: number, y: number, col: number, row: number }>>({})

function generateEnemyPositions(enemyList: IEnemy[]) {
  const positions: Record<string, { x: number, y: number, col: number, row: number }> = {}
  if (enemyList.length === 0) {
    enemyPositions.value = positions
    return
  }

  // Orden de colocacion: primero los enemigos vivos (respetando el orden de la
  // lista, que es el mismo que usa aliveIndexByEnemyId para asignar hotkeys),
  // luego los muertos. Asi el enemigo con hotkey 1 cae arriba-izquierda,
  // el 2 arriba-centro, etc.
  const orderedEnemies: IEnemy[] = []
  enemyList.forEach((e) => { if (e.isAlive) orderedEnemies.push(e) })
  enemyList.forEach((e) => { if (!e.isAlive) orderedEnemies.push(e) })

  // Recorrer la grilla 3x2 en orden de lectura: fila superior izq->der, luego fila inferior.
  const cellOrder: Array<{ col: number, row: number }> = []
  for (let row = 1; row <= 2; row++) {
    for (let col = 1; col <= 3; col++) {
      cellOrder.push({ col, row })
    }
  }

  orderedEnemies.forEach((enemy, idx) => {
    const cell = cellOrder[idx] ?? cellOrder[cellOrder.length - 1]
    positions[enemy.id] = {
      x: Math.round((Math.random() - 0.5) * 24),
      y: Math.round((Math.random() - 0.5) * 24),
      col: cell.col,
      row: cell.row
    }
  })
  enemyPositions.value = positions
}

watch(() => enemies.value, (newEnemies) => {
  generateEnemyPositions(newEnemies)
}, { immediate: true })

const showLogModal = ref(false)

const onDefensePhaseComplete = (result: DefensePhaseResult) => {
  void handleDefensePhaseComplete(result)
}

const onDefenseAllPhasesComplete = (results: DefensePhaseResult[]) => {
  handleDefenseAllPhasesComplete(results)
}

const onDefenseClose = () => {
  closeDefenseChallenge()
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (isMobile.value) return
  handleCombatShortcuts(e)
}

onMounted(() => {
  if (props.enemyList && props.enemyList.length > 0) {
    const isBoss = props.enemyList.some(e => e.constructor.name === 'Dragon')
    initializeCombat(props.enemyList, isBoss)
  } else {
    const currentNode = expeditionStore.currentExpedition?.currentNode
    if (currentNode && currentNode.enemies && currentNode.enemies.length > 0) {
      const isBoss = currentNode.type === 'boss'
        || currentNode.enemies.some(e => e.constructor.name === 'Dragon')
      initializeCombat(currentNode.enemies, isBoss)
    } else {
      console.error('CombatView: No se encontraron enemigos en el nodo de expedicion actual. Volviendo al mapa.')
      gameStore.navigateTo('expedition-map')
      return
    }
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  cleanup()
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="combat-view">
    <TurnOrderBar
      :queue="turnQueue"
      :actors-by-id="actorsById"
      :current-actor-id="currentActorId"
    />

    <AnnouncementBanner />

    <div v-if="!isMobile" class="heroes-column">
      <div class="heroes-container">
        <HeroCard
          v-for="(hero, idx) in heroSlots"
          :key="idx"
          :hero="hero"
          :index="idx"
          :is-active="!!hero && idx === gameStore.activeHeroIndex"
          :is-target-selectable="isAllySelectable(hero)"
          :is-being-attacked="!!hero && attackedHeroIds.includes(hero.id)"
          :hit-popups="hero ? playerHitPopups.filter(p => p.heroId === hero.id) : []"
          :vfx-effects="hero ? heroVfxEffects.filter(e => e.heroId === hero.id) : []"
          @select="(h) => selectAlly(h)"
        />
      </div>
    </div>

    <MobileCombatHud
      v-if="isMobile"
      class="mobile-top-hud"
      :player="player"
      :heroes="heroes"
      :enemies="enemies"
      :alive-index-by-enemy-id="aliveIndexByEnemyId"
      :is-selecting-target="isSelectingTarget"
      :can-target-allies="(!!selectedItem && itemCanTargetAllies(selectedItem)) || (!!selectedAbility && canTargetAllies(selectedAbility))"
      :active-hero-index="gameStore.activeHeroIndex"
      :attacked-hero-ids="attackedHeroIds"
      :hit-popups="playerHitPopups"
      :hero-vfx-effects="heroVfxEffects"
      @select-ally="selectAlly"
    />

    <div class="enemies-column">
      <div class="enemies-container">
        <div
          v-for="enemy in enemies"
          :key="enemy.id"
          class="enemy-position-wrapper"
          :style="{
            '--col': enemyPositions[enemy.id]?.col ?? 0,
            '--row': enemyPositions[enemy.id]?.row ?? 0,
            transform: `translate(${enemyPositions[enemy.id]?.x ?? 0}px, ${enemyPositions[enemy.id]?.y ?? 0}px)`
          }"
        >
          <EnemyCard
            :enemy="enemy"
            :index="aliveIndexByEnemyId[enemy.id] ?? -1"
            :is-selected="selectedEnemy?.id === enemy.id"
            :is-selecting-target="isSelectingTarget && canTargetEnemies(selectedAbility)"
            :is-action-target-required="actionRequiresTarget(selectedAbility)"
            :is-attacking="attackingEnemyId === enemy.id"
            :show-shortcut="canTargetEnemies(selectedAbility)"
            :hit-popups="enemyHitPopups.filter(p => p.id === enemy.id)"
            :vfx-effects="enemyVfxEffects.filter(effect => effect.id === enemy.id)"
            @select="selectEnemy"
          />
        </div>
      </div>
    </div>

    <div v-if="!isMobile" class="combat-bottom-bar">
      <AbilitiesActionBar
        class="desktop-actions"
        layout="desktop"
        :abilities="abilities"
        :ability-cooldowns="abilityCooldowns"
        :ability-shortcuts="abilityShortcuts"
        :player-energy="player?.energy ?? 0"
        :is-player-input-locked="isPlayerInputLocked"
        :selected-ability="selectedAbility"
        :is-selecting-target="isSelectingTarget"
        :used-item-this-turn="usedItemThisTurn"
        :caster="player"
        @select-ability="onMobileAbility"
        @object="onMobileObject"
        @cancel="onCancelAbility"
      />
    </div>

    <AbilitiesActionBar
      v-if="isMobile"
      class="mobile-action-bar"
      layout="mobile"
      :abilities="abilities"
      :ability-cooldowns="abilityCooldowns"
      :ability-shortcuts="abilityShortcuts"
      :player-energy="player?.energy ?? 0"
      :is-player-input-locked="isPlayerInputLocked"
      :selected-ability="selectedAbility"
      :is-selecting-target="isSelectingTarget"
      :used-item-this-turn="usedItemThisTurn"
      :caster="player"
      @select-ability="onMobileAbility"
      @object="onMobileObject"
      @cancel="onCancelAbility"
    />

    <CombatLogFab
      class="combat-log-fab"
      :messages="combatLog"
      @open-full="showLogModal = true"
    />

    <EnemyDebugPanel
      v-if="showEnemyDebug"
      :enemies="enemies"
    />

    <DefenseChallenge
      :show="isDefenseActive"
      :pattern="defensePattern"
      :zones="defenseZones"
      :phase-index="defensePhaseIndex"
      :is-crit="defenseIsCrit"
      :clouded="defenseClouded"
      :rooted="defenseRooted"
      :rooted-stacks="defenseRootedStacks"
      :rooted-overlay="defenseRootedOverlay"
      :blinded="defenseBlinded"
      @phase-complete="onDefensePhaseComplete"
      @all-phases-complete="onDefenseAllPhasesComplete"
      @close="onDefenseClose"
    />

    <ItemsModal
      :show="showItemsModal"
      :inventory="inventory"
      :used-this-turn="usedItemThisTurn"
      @close="onItemsModalClose"
      @select-item="onItemsModalSelectItem"
    />

    <CombatLogModal
      :show="showLogModal"
      :messages="combatLog"
      @close="showLogModal = false"
    />
  </div>
</template>

<style scoped>
.inline-icon {
  width: 1em;
  height: 1em;
  display: inline-block;
  vertical-align: -0.15em;
  margin-right: 0.25rem;
  filter: brightness(0) invert(1);
}
.btn-icon {
  width: 1.05em;
  height: 1.05em;
  display: inline-block;
  vertical-align: -0.18em;
  margin-right: 0.35rem;
  filter: brightness(0) invert(1);
}

.action-btn.action-used {
  opacity: 0.55;
  cursor: not-allowed;
}

.action-used-tag {
  margin-left: 0.4em;
  background: rgba(255, 107, 107, 0.22);
  border: 1px solid rgba(255, 107, 107, 0.4);
  color: #ffb3b3;
  font-size: 0.7em;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  line-height: 1;
}
</style>
