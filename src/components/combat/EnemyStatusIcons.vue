<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import { getEffectDescription } from '@/core/interfaces/IStatusEffect'

const props = defineProps<{
  effects: IStatusEffect[]
}>()

const infoEffect = ref<IStatusEffect | null>(null)
const containerEl = ref<HTMLElement | null>(null)

const infoDescription = computed(() => {
  if (!infoEffect.value) return ''
  return getEffectDescription(infoEffect.value, 'enemy')
})

function showEffectInfo(effect: IStatusEffect, event: Event) {
  event.stopPropagation()
  infoEffect.value = infoEffect.value?.type === effect.type ? null : effect
}

function closeInfo() {
  infoEffect.value = null
}

function onDocClick(e: MouseEvent | TouchEvent) {
  if (!infoEffect.value) return
  const target = e.target as Node
  if (containerEl.value && !containerEl.value.contains(target)) {
    closeInfo()
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeInfo()
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', onDocClick)
  window.addEventListener('touchstart', onDocClick)
  window.addEventListener('keydown', onKey)
}

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', onDocClick)
    window.removeEventListener('touchstart', onDocClick)
    window.removeEventListener('keydown', onKey)
  }
})

function effectTagline(e: IStatusEffect): string {
  const turns = e.turns ?? 0
  const stacks = e.stacks ?? 1
  const parts: string[] = []
  if (stacks > 1) parts.push(`x${stacks} stacks`)
  parts.push(turns > 0 ? `${turns} turno${turns > 1 ? 's' : ''} restante${turns > 1 ? 's' : ''}` : 'sin duración')
  return parts.join(' · ')
}
</script>

<template>
  <div
    v-if="effects && effects.length"
    ref="containerEl"
    class="enemy-status-icons"
  >
    <div
      v-for="effect in effects"
      :key="effect.type"
      class="enemy-status-icon"
      :class="{ 'is-info-open': infoEffect?.type === effect.type }"
      :title="`${effect.name} — ${effect.turns ?? 0} turno(s)${(effect.stacks ?? 1) > 1 ? ` · x${effect.stacks} stacks` : ''}`"
      role="button"
      tabindex="0"
      @click="showEffectInfo(effect, $event)"
      @contextmenu.prevent="showEffectInfo(effect, $event)"
      @keydown.enter.prevent="showEffectInfo(effect, $event)"
      @keydown.space.prevent="showEffectInfo(effect, $event)"
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

      <transition name="esi-info">
        <div
          v-if="infoEffect && infoEffect.type === effect.type"
          class="esi-info-popup"
          role="dialog"
          :aria-label="`Info de ${effect.name}`"
          @click.stop
        >
          <header class="esi-info-header">
            <img :src="effect.icon" :alt="effect.name" class="esi-info-icon" />
            <div class="esi-info-titles">
              <span class="esi-info-name">{{ effect.name }}</span>
              <span class="esi-info-tag">{{ effectTagline(effect) }}</span>
            </div>
            <button
              type="button"
              class="esi-info-close"
              aria-label="Cerrar"
              @click.stop="closeInfo"
            >✕</button>
          </header>
          <p v-if="infoDescription" class="esi-info-desc">{{ infoDescription }}</p>
          <p v-else class="esi-info-desc esi-info-desc-empty">Sin descripción disponible.</p>
        </div>
      </transition>
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
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: background 0.15s;
}

.enemy-status-icon:hover,
.enemy-status-icon:focus-visible {
  background: rgba(255, 255, 255, 0.08);
  outline: none;
}

.enemy-status-icon.is-info-open {
  background: rgba(255, 230, 102, 0.2);
  outline: 1.5px solid rgba(255, 230, 102, 0.75);
}

.enemy-status-icon img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  background: transparent;
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

.esi-info-popup {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 60;
  width: min(320px, calc(100vw - 24px));
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.65), 0 0 16px rgba(255, 200, 60, 0.3);
  padding: 0.7rem 0.85rem 0.75rem;
  color: #fff;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.esi-info-popup::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 10px;
  height: 10px;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border-top: 1.5px solid rgba(255, 230, 102, 0.55);
  border-left: 1.5px solid rgba(255, 230, 102, 0.55);
  display: none;
}

.esi-info-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.esi-info-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.45);
  padding: 3px;
  filter: drop-shadow(0 1px 3px #000a);
  flex-shrink: 0;
}

.esi-info-titles {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.esi-info-name {
  font-family: 'Georgia', serif;
  font-size: 1rem;
  font-weight: 700;
  color: #ffe066;
  text-shadow: 0 1px 2px #000;
  line-height: 1.15;
}

.esi-info-tag {
  font-family: 'Courier New', monospace;
  font-size: 0.68rem;
  color: #b6f5b6;
  letter-spacing: 0.02em;
}

.esi-info-close {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.esi-info-close:hover {
  background: rgba(255, 255, 255, 0.18);
}

.esi-info-desc {
  margin: 0;
  color: #e0e0f0;
  font-size: 0.82rem;
  line-height: 1.4;
}

.esi-info-desc-empty {
  color: #777;
  font-style: italic;
}

.esi-info-enter-active,
.esi-info-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}
.esi-info-enter-from,
.esi-info-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

@media (min-width: 600px) {
  .esi-info-popup {
    position: absolute;
    top: calc(100% + 8px);
    bottom: auto;
    width: max-content;
    max-width: min(280px, calc(100vw - 32px));
  }
  .esi-info-popup::before {
    display: block;
  }
  .esi-info-enter-from,
  .esi-info-leave-to {
    transform: translateX(-50%) translateY(-4px);
  }
}
</style>
