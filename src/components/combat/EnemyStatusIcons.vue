<script setup lang="ts">
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'

defineProps<{
  effects: IStatusEffect[]
}>()
</script>

<template>
  <div v-if="effects && effects.length" class="enemy-status-icons">
    <div
      v-for="effect in effects"
      :key="effect.type"
      class="enemy-status-icon"
      :title="`${effect.name} — ${effect.turns ?? 0} turno(s)${(effect.stacks ?? 1) > 1 ? ` · x${effect.stacks} stacks` : ''}`"
    >
      <img :src="effect.icon" :alt="effect.name" />
      <span class="enemy-status-turns">{{ effect.turns ?? 0 }}</span>
      <span
        v-if="(effect.stacks ?? 1) > 1"
        class="enemy-status-stacks"
        :title="`${effect.stacks} stacks`"
      >
        x{{ effect.stacks }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.enemy-status-icons {
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.2rem;
  background: rgba(30, 32, 60, 0.85);
  border-radius: 6px;
  padding: 0.1rem 0.3rem;
  z-index: 4;
  pointer-events: auto;
}

.enemy-status-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.enemy-status-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 3px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}

.enemy-status-turns {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff3333;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  border-radius: 50%;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  border: 1px solid #fff;
}

.enemy-status-stacks {
  position: absolute;
  bottom: -5px;
  left: -5px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  border-radius: 999px;
  background: linear-gradient(135deg, #b388ff, #6a40c4);
  color: #fff;
  font-size: 0.55rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 4px rgba(179, 136, 255, 0.6), 0 1px 2px rgba(0, 0, 0, 0.6);
  border: 1px solid #1a1a2e;
  font-family: 'Courier New', monospace;
}
</style>
