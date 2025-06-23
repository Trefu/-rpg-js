<script setup lang="ts">
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'

defineProps<{
  effects: IStatusEffect[]
}>()
</script>

<template>
  <div v-if="effects && effects.length" class="status-bar">
    <div v-for="effect in effects" :key="effect.type" class="status-effect-icon">
      <img :src="effect.icon" :alt="effect.name" :title="`${effect.name} (${effect.turns})\n${effect.description}`" />
      <span class="status-turns">{{ effect.turns }}</span>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  gap: 0.3rem;
  justify-content: center;
  align-items: center;
  background: rgba(30, 32, 60, 0.85);
  border-radius: 8px;
  padding: 0.15rem 0.4rem;
  box-shadow: 0 2px 8px #0002;
  min-height: 28px;
  max-width: 120px;
  overflow-x: auto;
  z-index: 12;
  position: relative;
}
.status-effect-icon {
  position: relative;
  display: flex;
  align-items: center;
}
.status-effect-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 1px 4px #0005;
  background: #fff;
  cursor: pointer;
  transition: transform 0.15s;
}
.status-effect-icon img:hover {
  transform: scale(1.18);
  z-index: 2;
}
.status-turns {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff3333;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px #0005;
  border: 1px solid #fff;
  z-index: 3;
}
</style> 