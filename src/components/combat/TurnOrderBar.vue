<script setup lang="ts">
import { computed } from 'vue'
import type { TurnActor, TurnQueueEntry } from '@/core/turn-engine/TurnEngine'

const props = defineProps<{
  queue: TurnQueueEntry[]
  actorsById: Record<string, TurnActor>
  currentActorId: string | null
}>()

const slots = computed(() => {
  return props.queue.map(entry => {
    const actor = props.actorsById[entry.actorId]
    return {
      entry,
      actor,
      isCurrent: entry.actorId === props.currentActorId,
      isSkip: entry.kind === 'skip'
    }
  })
})
</script>

<template>
  <div class="turn-order-bar" v-if="slots.length > 0">
    <div class="turn-order-bar-label">Próximos turnos</div>
    <div class="turn-order-bar-slots">
      <div
        v-for="(slot, idx) in slots"
        :key="`${slot.entry.actorId}-${idx}`"
        class="turn-slot"
        :class="{
          current: slot.isCurrent,
          skip: slot.isSkip,
          enemy: slot.actor?.kind === 'enemy',
          hero: slot.actor?.kind === 'hero'
        }"
        :title="slot.actor?.name ?? ''"
      >
        <div class="turn-slot-index">{{ idx + 1 }}</div>
        <img
          v-if="slot.actor?.icon"
          :src="slot.actor.icon"
          :alt="slot.actor.name"
          class="turn-slot-icon"
        />
        <div v-else class="turn-slot-icon turn-slot-icon-fallback">
          {{ slot.actor?.name?.charAt(0) ?? '?' }}
        </div>
        <div class="turn-slot-name">
          <span :class="{ 'turn-slot-strikethrough': slot.isSkip }">
            {{ slot.actor?.name ?? '???' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.turn-order-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.45) 100%);
  border-top: 1px solid rgba(255, 230, 102, 0.25);
  border-bottom: 1px solid rgba(255, 230, 102, 0.2);
  backdrop-filter: blur(4px);
}

.turn-order-bar-label {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffe066;
  white-space: nowrap;
  opacity: 0.85;
}

.turn-order-bar-slots {
  display: flex;
  gap: 0.4rem;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
}

.turn-order-bar-slots::-webkit-scrollbar {
  height: 4px;
}
.turn-order-bar-slots::-webkit-scrollbar-thumb {
  background: rgba(255, 230, 102, 0.35);
  border-radius: 2px;
}

.turn-slot {
  position: relative;
  flex: 1 1 0;
  min-width: 64px;
  max-width: 110px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.45rem;
  border-radius: 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  scroll-snap-align: start;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.turn-slot.enemy {
  border-color: rgba(255, 80, 80, 0.35);
}
.turn-slot.hero {
  border-color: rgba(102, 255, 178, 0.35);
}

.turn-slot.current {
  border-color: #ffe066;
  box-shadow:
    0 0 0 1.5px rgba(255, 224, 102, 0.55),
    0 0 12px rgba(255, 224, 102, 0.45);
  background: linear-gradient(145deg, rgba(255, 224, 102, 0.18) 0%, rgba(255, 224, 102, 0.05) 100%);
}

.turn-slot.skip {
  opacity: 0.5;
  filter: grayscale(0.6);
}

.turn-slot-index {
  position: absolute;
  top: -6px;
  left: -6px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
  font-size: 0.65rem;
  font-weight: 900;
  color: #1a1a2e;
  background: #ffe066;
  border-radius: 50%;
  border: 1.5px solid #1a1a2e;
  z-index: 1;
}

.turn-slot-icon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
  image-rendering: pixelated;
  background: #000;
  flex-shrink: 0;
}

.turn-slot-icon-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #ffe066;
  background: #2a1f4a;
}

.turn-slot-name {
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.turn-slot-strikethrough {
  text-decoration: line-through;
}

@media (max-width: 720px) {
  .turn-order-bar {
    padding: 0.3rem 0.5rem;
    gap: 0.5rem;
  }
  .turn-order-bar-label {
    display: none;
  }
  .turn-slot {
    min-width: 72px;
    padding: 0.25rem 0.4rem;
    gap: 0.3rem;
  }
  .turn-slot-icon {
    width: 24px;
    height: 24px;
  }
  .turn-slot-name {
    font-size: 0.65rem;
  }
  .turn-slot-index {
    width: 16px;
    height: 16px;
    font-size: 0.6rem;
  }
}
</style>