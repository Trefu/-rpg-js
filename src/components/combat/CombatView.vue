<script setup lang="ts">
import '@/styles/combat.css'
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useCombat } from '@/composables/useCombat'
import { useExpeditionStore } from '@/stores/expedition'
import { useGameStore } from '@/stores/game'
import { MAX_HEROES } from '@/stores/game'
import type { Hero } from '@/core/Hero'
import type { IAbility } from '@/core/interfaces/IAbility'
import AbilitiesIcon from '@/assets/icons/shield.png'
import ItemIcon from '@/assets/icons/backpack.png'
import DefenseChallenge from './DefenseChallenge.vue'
import AnnouncementBanner from './AnnouncementBanner.vue'
import CombatLogModal from './CombatLogModal.vue'
import CombatLogPanel from './CombatLogPanel.vue'
import CombatLogFab from './CombatLogFab.vue'
import HeroCard from './HeroCard.vue'
import EnemyCard from './EnemyCard.vue'
import MobileCombatHud from './MobileCombatHud.vue'
import MobileActionBar from './MobileActionBar.vue'
import AbilitiesModal from '@/components/ui/AbilitiesModal.vue'
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
  isPlayerTurn,
  attackingEnemyId,
  enemyHitPopups,
  showAbilitiesModal,
  abilityCooldowns,
  announcement,
  abilities,
  abilityShortcuts,
  isDefenseActive,
  defensePattern,
  defenseZones,
  defensePhaseIndex,
  defenseIsCrit,
  openAbilitiesModal,
  closeAbilitiesModal,
  selectAbility,
  cancelAction,
  handleAbilitiesModalShortcuts,
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
  startPlayerTurn,
  canTargetAllies,
  canTargetEnemies,

  showItemsModal,
  selectedItem,
  inventory,
  usedItemThisTurn,
  openItemsModal,
  closeItemsModal,
  selectItem,
  itemCanTargetAllies
} = useCombat(combatOptions)

const isMobile = useMediaQuery('(max-width: 720px)')

function rotateHero() {
  const slots = gameStore.heroes
  const total = slots.length
  if (total <= 1) return
  for (let off = 1; off <= total; off++) {
    const idx = (gameStore.activeHeroIndex + off) % total
    if (slots[idx] && slots[idx]!.isAlive) {
      gameStore.setActiveHero(idx)
      return
    }
  }
}

function onMobileAbility(ability: IAbility, index: number) {
  selectAbility(ability, index)
}

function onMobileAttack() {
  selectAction('attack')
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

function onObjectAction() {
  openItemsModal()
}

function onItemsModalSelectItem(entryId: string) {
  selectItem(entryId)
}

function onItemsModalClose() {
  closeItemsModal()
}

const canCancelTargeting = computed(() => {
  if (!isSelectingTarget.value) return false
  if (selectedItem.value) return true
  if (selectedAbility.value && actionRequiresTarget(selectedAbility.value)) return true
  return false
})

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
  handleDefensePhaseComplete(result)
}

const onDefenseAllPhasesComplete = (results: DefensePhaseResult[]) => {
  handleDefenseAllPhasesComplete(results)
}

const onDefenseClose = () => {
  closeDefenseChallenge()
}

const handleAbilitySelect = (ability: any, index: number) => {
  selectAbility(ability, index)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (isMobile.value) return
  handleCombatShortcuts(e)
  handleAbilitiesModalShortcuts(e)
}

onMounted(() => {
  if (props.enemyList && props.enemyList.length > 0) {
    initializeCombat(props.enemyList)
  } else {
    const currentNode = expeditionStore.currentExpedition?.currentNode
    if (currentNode && currentNode.enemies && currentNode.enemies.length > 0) {
      initializeCombat(currentNode.enemies)
    } else {
      console.error('CombatView: No se encontraron enemigos en el nodo de expedicion actual. Volviendo al mapa.')
      gameStore.navigateTo('expedition-map')
      return
    }
  }

  startPlayerTurn()

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  cleanup()
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="combat-view">
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
      :is-player-turn="isPlayerTurn"
      :is-selecting-target="isSelectingTarget"
      :can-target-allies="(!!selectedItem && itemCanTargetAllies(selectedItem)) || (!!selectedAbility && canTargetAllies(selectedAbility))"
      :active-hero-index="gameStore.activeHeroIndex"
      @rotate-hero="rotateHero"
      @select-enemy="selectEnemy"
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
            :hit-popups="enemyHitPopups"
            :show-shortcut="canTargetEnemies(selectedAbility)"
            @select="selectEnemy"
          />
        </div>
      </div>
    </div>

    <div v-if="!isMobile" class="combat-bottom-bar">
      <div class="combat-log-slot">
        <CombatLogPanel
          :messages="combatLog"
          @open-full="showLogModal = true"
        />
      </div>

      <div class="actions-area">
        <div class="action-buttons">
          <button class="action-btn" :disabled="isPlayerInputLocked" @click="openAbilitiesModal">
            <img :src="AbilitiesIcon" alt="" class="btn-icon" /> Habilidades <span class="shortcut-badge">[A]</span>
          </button>
          <button
            class="action-btn item"
            :disabled="isPlayerInputLocked || usedItemThisTurn"
            :class="{ 'action-used': usedItemThisTurn }"
            @click="onObjectAction"
          >
            <img :src="ItemIcon" alt="" class="btn-icon" />
            Objeto
            <span v-if="usedItemThisTurn" class="action-used-tag">usado</span>
          </button>
          <button
            class="action-btn cancel"
            :class="{ 'is-hidden': !canCancelTargeting }"
            :aria-hidden="!canCancelTargeting"
            :tabindex="canCancelTargeting ? 0 : -1"
            @click="onCancelAbility"
          >
            ✕ Cancelar <span class="shortcut-badge">[Esc]</span>
          </button>
        </div>
      </div>
    </div>

    <MobileActionBar
      v-if="isMobile"
      class="mobile-action-bar"
      :abilities="abilities"
      :ability-cooldowns="abilityCooldowns"
      :player-energy="player?.energy ?? 0"
      :is-player-input-locked="isPlayerInputLocked"
      :selected-ability="selectedAbility"
      :is-selecting-target="isSelectingTarget"
      :used-item-this-turn="usedItemThisTurn"
      @attack="onMobileAttack"
      @select-ability="onMobileAbility"
      @object="onMobileObject"
      @cancel="onCancelAbility"
    />

    <CombatLogFab
      v-if="isMobile"
      class="combat-log-fab"
      :messages="combatLog"
      @open-full="showLogModal = true"
    />

    <DefenseChallenge
      :show="isDefenseActive"
      :pattern="defensePattern"
      :zones="defenseZones"
      :phase-index="defensePhaseIndex"
      :is-crit="defenseIsCrit"
      @phase-complete="onDefensePhaseComplete"
      @all-phases-complete="onDefenseAllPhasesComplete"
      @close="onDefenseClose"
    />

    <AbilitiesModal
      :show="showAbilitiesModal"
      :abilities="abilities"
      :ability-cooldowns="abilityCooldowns"
      :ability-shortcuts="abilityShortcuts"
      @close="closeAbilitiesModal"
      @select-ability="handleAbilitySelect"
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
