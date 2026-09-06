<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useExpeditionStore } from '@/stores/expedition'
import { getEnemiesForNode } from '@/core/zones/EnemyPools'
import { AudioManager } from '@/core/AudioManager'
import {
  pickRandomCuriosityEvent,
  resolveCuriosityChoice,
  type CuriosityChoice,
  type ResolveResult
} from '@/core/events/curiosityEvents'
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

/** Evento elegido al abrir el modal; persiste durante toda la interaccion. */
const event = pickRandomCuriosityEvent()

/**
 * Despues de elegir una opcion guardamos el resultado completo para
 * mostrar el flavor de resolucion y, al cerrar, alimentar el toast
 * informativo del mapa. `null` mientras el jugador sigue decidiendo.
 */
type Resolution =
  | { kind: 'effects-applied', flavor: string, effects: import('@/core/events/curiosityEvents').AppliedEffect[] }
  | { kind: 'noop', flavor: string }
  | { kind: 'ambush-ready', flavor: string }
const resolution = ref<Resolution | null>(null)

onMounted(() => {
  audioManager.playCuriosityOpenSound()
})

/**
 * Mapa de piso coherente con el que usa `useExpeditionGenerator` para
 * los nodos `combat`: cada fila del mapa se mapea a un piso entre 2 y
 * `totalNodes - 1`. Para un nodo `curiosity` en la misma fila que un
 * `combat` se obtiene la misma dificultad en la emboscada.
 */
function floorForNode(nodeId: string): number {
  const node = expeditionStore.currentExpedition?.nodes.find(n => n.id === nodeId)
  if (!node) return 5
  const minNodesBeforeBoss = 8
  const totalNodes = minNodesBeforeBoss + 2
  const rowIndex = Math.round((node.position.y - 15) * minNodesBeforeBoss / 80)
  return Math.max(2, Math.min(totalNodes - 1, rowIndex + 2))
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
    // effects-applied: el outcome es reward o punishment (puede incluir
    // ambos tipos). Reproducimos el sonido segun la naturaleza del
    // primer efecto para que el jugador reciba feedback inmediato.
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
      // Tradeoff (dano + item, energyLoss + xp, etc.): sonido de
      // castigo porque suele ser el efecto dominante perceptivamente.
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
    const zoneId = expeditionStore.currentExpedition?.zone.id
    if (!nodeId || !zoneId) {
      emit('close')
      return
    }
    const floor = floorForNode(nodeId)
    const enemies = getEnemiesForNode(zoneId, floor, floor + 3)
    emit('ambush', { nodeId, enemies })
    return
  }
  // Emitimos el resultado resuelto para que App.vue muestre el toast
  // informativo al volver al mapa. El modal ya hizo su trabajo; lo
  // cerramos a continuacion.
  if (resolution.value) {
    const r = resolution.value
    const lastResult: ResolveResult = r.kind === 'noop'
      ? { kind: 'noop', flavor: r.flavor }
      : { kind: 'effects-applied', log: [r.flavor], effects: r.effects }
    emit('resolved', { eventId: event.id, title: event.title, result: lastResult })
  }
  emit('close')
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

        <!-- Fase de decision -->
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

        <!-- Fase de resolucion -->
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
