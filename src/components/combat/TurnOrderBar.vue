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
        <div
          class="turn-slot-icon-wrap"
          :class="{ hero: slot.actor?.kind === 'hero', enemy: slot.actor?.kind === 'enemy' }"
        >
          <img
            v-if="slot.actor?.icon"
            :src="slot.actor.icon"
            :alt="slot.actor.name"
            class="turn-slot-icon"
          />
          <div v-else class="turn-slot-icon turn-slot-icon-fallback">
            {{ slot.actor?.name?.charAt(0) ?? '?' }}
          </div>
        </div>
        <div class="turn-slot-body">
          <div class="turn-slot-name">
            <span :class="{ 'turn-slot-strikethrough': slot.isSkip }">
              {{ slot.actor?.name ?? '???' }}
            </span>
          </div>
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
  width: 100%;
  box-sizing: border-box;
  padding: 0.65rem 0.85rem;
  min-height: 64px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.45) 100%);
  border-top: 1px solid rgba(255, 230, 102, 0.25);
  border-bottom: 1px solid rgba(255, 230, 102, 0.2);
  backdrop-filter: blur(4px);
}


.turn-slot-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1 1 auto;
}

.turn-order-bar-slots {
  display: flex;
  gap: 0.4rem;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  padding: 0 0.25rem;
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
  flex: 0 0 auto;
  width: 130px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.65rem;
  border-radius: 6px;
  border: 1.5px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  scroll-snap-align: start;
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

.turn-slot-icon-wrap {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 5px;
  background: #000;
}

.turn-slot-icon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  transform: scale(1.8);
  transform-origin: center 25%;
}

.turn-slot-icon-wrap.enemy .turn-slot-icon {
  transform-origin: center 35%;
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
  font-size: 0.78rem;
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
    padding: 0.4rem 0.6rem;
    gap: 0.4rem;
    min-height: 56px;
  }

  .turn-slot {
    width: 110px;
    padding: 0.25rem 0.35rem;
    gap: 0.4rem;
  }
  .turn-slot-icon-wrap {
    width: 38px;
    height: 38px;
  }
  .turn-slot-name {
    font-size: 0.7rem;
  }
}
</style>