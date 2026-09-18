<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useExpeditionStore } from '@/stores/expedition'
import { getEnemiesForConfig } from '@/core/zones/EnemyPools'
import { resolveEncounterById } from '@/core/expeditions/encounters'
import { AudioManager } from '@/core/AudioManager'
import {
  resolveCuriosityChoice,
  type CuriosityChoice,
  type CuriosityEvent,
  type ResolveResult
} from '@/core/events/curiosityEvents'
import { pickRandomFromList } from '@/core/expeditions/pickRandom'
import curiosityIcon from '@/assets/icons/magic-portal.png'
import closeIcon from '@/assets/icons/cross-mark.png'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'ambush', payload: { nodeId: string, enemies: any[] }): void
  (e: 'resolved', payload: { eventId: string, title: string, result: ResolveResult }): void
}>()

const gameStore = useGameStore()
const expeditionStore = useExpeditionStore()
const audioManager = AudioManager.getInstance()

/**
 * Evento elegido al abrir el modal a partir del catalogo de la
 * expedicion activa. Si la expedicion declara `curiosityEvents`, gana;
 * si no, se usa el catalogo compartido (`SHARED_CURIOSITY_EVENTS`).
 *
 * Persiste durante toda la interaccion (no se re-rollea al elegir).
 */
const event = computed<CuriosityEvent>(() =>
  pickRandomFromList(expeditionStore.activeCuriosityEvents)
)

type Resolution =
  | { kind: 'effects-applied', flavor: string, effects: import('@/core/events/curiosityEvents').AppliedEffect[] }
  | { kind: 'noop', flavor: string }
  | { kind: 'ambush-ready', flavor: string }
const resolution = ref<Resolution | null>(null)

onMounted(() => {
  audioManager.playCuriosityOpenSound()
})

/**
 * Devuelve el floor asociado al nodo actualmente seleccionado. Coincide
 * con la cuenta que usa `useExpeditionGenerator`: start = 1, cada fila
 * intermedia suma 1, boss = totalFloors. Para un nodo `curiosity`
 * intercalado entre dos `combat`, queda en el mismo piso que su fila.
 */
function floorForSelectedNode(): number {
  const node = expeditionStore.selectedNode
  if (!node) return 1
  const config = expeditionStore.currentConfig
  if (!config) return 1
  if (node.id === 'start') return 1
  if (node.id === 'boss') return config.totalFloors
  // Para nodos intermedios: la posicion y va de 15 a 95, mapeada a
  // floors 2..totalFloors-1 por el generador.
  const rowFraction = (node.position.y - 15) / 80
  const rowIndex = Math.round(rowFraction * config.generator.minNodesBeforeBoss)
  return Math.max(2, Math.min(config.totalFloors - 1, rowIndex + 2))
}

function choose(choice: CuriosityChoice) {
  audioManager.playCuriosityConfirmSound()
  const result = resolveCuriosityChoice(choice, {
    heroes: gameStore.activeHeroes,
    teamItems: gameStore.teamItems
  })

  if (result.kind === 'ambush') {
    audioManager.playCuriosityAmbushSound()
    resolution.value = { kind: 'ambush-ready', flavor: result.flavor }
  } else if (result.kind === 'noop') {
    audioManager.playCuriosityNoopSound()
    resolution.value = { kind: 'noop', flavor: result.flavor }
  } else {
    const hasDamage = result.effects.some(e =>
      e.kind === 'damage' || e.kind === 'energyLoss' || e.kind === 'loseItem'
    )
    const hasReward = result.effects.some(e =>
      e.kind === 'heal' || e.kind === 'fullHeal' || e.kind === 'restoreEnergy'
        || e.kind === 'grantItem' || e.kind === 'gold' || e.kind === 'xp'
    )
    if (hasDamage && !hasReward) {
      audioManager.playCuriosityPunishmentSound()
    } else if (hasReward && !hasDamage) {
      audioManager.playCuriosityRewardSound()
    } else if (hasDamage && hasReward) {
      audioManager.playCuriosityPunishmentSound()
    } else {
      audioManager.playCuriosityNoopSound()
    }
    resolution.value = { kind: 'effects-applied', flavor: result.log[0] ?? '', effects: result.effects }
  }
}

function continueAfterResolution() {
  if (resolution.value?.kind === 'ambush-ready') {
    const nodeId = expeditionStore.selectedNode?.id
    const config = expeditionStore.currentConfig
    if (!nodeId || !config) {
      emit('close')
      return
    }
    const enemies = resolveAmbushEnemies(config)
    emit('ambush', { nodeId, enemies })
    return
  }
  if (resolution.value) {
    const r = resolution.value
    const lastResult: ResolveResult = r.kind === 'noop'
      ? { kind: 'noop', flavor: r.flavor }
      : { kind: 'effects-applied', log: [r.flavor], effects: r.effects }
    emit('resolved', { eventId: event.value.id, title: event.value.title, result: lastResult })
  }
  emit('close')
}

/**
 * Resuelve la composicion de enemigos del combate que sigue a la
 * eleccion del jugador. Prioridad:
 *   1. Si el `outcome` declara un `encounter` fijo, se resuelve ese.
 *   2. Si no, fallback a un sample aleatorio del pool del tier del piso.
 */
function resolveAmbushEnemies(config: ReturnType<typeof useExpeditionStore>['currentConfig']): any[] {
  if (!config) return []
  // Buscamos el outcome que produjo el ambush para leer su `encounter`.
  // Comparamos flavor del outcome contra el del resolution (es una
  // lista pequena, ~3 entries por evento).
  const matchingChoice = event.value.choices.find(c => {
    const oc = c.outcome
    return oc.kind === 'ambush' && oc.flavor === resolution.value?.flavor
  })
  const encounterId = matchingChoice?.outcome.kind === 'ambush'
    ? matchingChoice.outcome.encounter
    : undefined
  if (encounterId) {
    return resolveEncounterById(config, encounterId)
  }
  return getEnemiesForConfig(config, floorForSelectedNode())
}

function close() {
  emit('close')
}
</script>

<template>
  <transition name="curiosity-fade">
    <div class="curiosity-overlay" @mousedown.self="close">
      <div class="curiosity-modal" role="dialog" aria-labelledby="curiosity-title">
        <header class="curiosity-header">
          <img :src="curiosityIcon" alt="" class="curiosity-header-icon" />
          <h2 id="curiosity-title">{{ event.title }}</h2>
          <button class="curiosity-close" type="button" @click="close" title="Cerrar">
            <img :src="closeIcon" alt="" />
          </button>
        </header>

        <template v-if="!resolution">
          <p class="curiosity-flavor">{{ event.flavor }}</p>
          <ul class="curiosity-choices">
            <li v-for="choice in event.choices" :key="choice.id">
              <button
                class="curiosity-choice-btn"
                type="button"
                @click="choose(choice)"
              >
                {{ choice.label }}
              </button>
            </li>
          </ul>
        </template>

        <template v-else>
          <p class="curiosity-resolution" :class="resolution.kind">
            {{ resolution.flavor }}
          </p>
          <button
            class="curiosity-continue"
            type="button"
            @click="continueAfterResolution"
          >
            <template v-if="resolution.kind === 'ambush-ready'">Enfrentar el combate</template>
            <template v-else>Seguir</template>
          </button>
        </template>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.curiosity-fade-enter-active,
.curiosity-fade-leave-active {
  transition: opacity 0.2s ease;
}
.curiosity-fade-enter-from,
.curiosity-fade-leave-to {
  opacity: 0;
}

.curiosity-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1100;
  padding: 0;
  backdrop-filter: blur(4px);
}

.curiosity-modal {
  position: relative;
  width: 100%;
  max-width: 100%;
  background: linear-gradient(180deg, #1f2230 0%, #15171f 100%);
  color: #e8e8ea;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: none;
  padding: 1rem 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: 85vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.55);
}

.curiosity-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.curiosity-header-icon {
  width: 28px;
  height: 28px;
  filter: brightness(0) invert(1);
}
.curiosity-header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  flex: 1;
  line-height: 1.2;
}
.curiosity-close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.curiosity-close img {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
}

.curiosity-flavor {
  margin: 0;
  font-size: 0.92rem;
  color: rgba(232, 232, 234, 0.85);
  line-height: 1.4;
  font-style: italic;
}

.curiosity-choices {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.curiosity-choice-btn {
  width: 100%;
  background: rgba(156, 39, 176, 0.15);
  border: 1px solid rgba(156, 39, 176, 0.45);
  color: #e8e8ea;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.15s ease;
  min-height: 48px;
}
.curiosity-choice-btn:hover {
  background: rgba(156, 39, 176, 0.3);
}
.curiosity-choice-btn:active {
  transform: scale(0.99);
}

.curiosity-resolution {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  font-size: 0.92rem;
  line-height: 1.4;
}
.curiosity-resolution.effects-applied {
  background: rgba(76, 175, 80, 0.18);
  border: 1px solid rgba(76, 175, 80, 0.4);
  color: #d6f5d8;
}
.curiosity-resolution.noop {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.curiosity-resolution.ambush-ready {
  background: rgba(244, 67, 54, 0.18);
  border: 1px solid rgba(244, 67, 54, 0.45);
  color: #ffb4ae;
}

.curiosity-continue {
  background: #9c27b0;
  color: #fff;
  border: none;
  padding: 0.85rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 48px;
}
.curiosity-continue:hover {
  background: #8e24aa;
}

@media (min-width: 720px) {
  .curiosity-overlay {
    align-items: center;
    padding: 1.5rem;
  }
  .curiosity-modal {
    width: 100%;
    max-width: 520px;
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1.5rem 1.5rem 1.25rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    max-height: 80vh;
  }
  .curiosity-header h2 {
    font-size: 1.25rem;
  }
}
</style>
