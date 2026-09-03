<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { IStatusEffect } from '@/core/interfaces/IStatusEffect'
import burnDotIcon from '@/assets/icons/fire.png'
import poisonDotIcon from '@/assets/icons/poison-gas.png'
import freezeDotIcon from '@/assets/icons/frostfire.png'

/**
 * Iconos de DoT compartidos entre desktop y mobile. Mantener una sola fuente
 * de verdad evita que un lado del juego muestre una estetica distinta para
 * el mismo estado (quemadura, veneno, congelado).
 */
const DOT_ICONS: Record<string, { icon: string; name: string }> = {
  burn: { icon: burnDotIcon, name: 'Quemadura' },
  poison: { icon: poisonDotIcon, name: 'Veneno' },
  freeze: { icon: freezeDotIcon, name: 'Congelado' }
}
const DOT_TYPES = new Set(Object.keys(DOT_ICONS))

interface Props {
  effects: IStatusEffect[]
}

const props = defineProps<Props>()
const containerEl = ref<HTMLElement | null>(null)

/**
 * Filtra solo los DoTs (burn/poison/freeze). Si en el futuro se anade un
 * tipo nuevo, basta con sumarlo a `DOT_TYPES` arriba para que se pinte
 * automaticamente aqui y en el desktop.
 */
const dotEffects = computed<IStatusEffect[]>(() =>
  props.effects.filter(e => DOT_TYPES.has(e.type))
)

function dotStacks(effect: IStatusEffect): number {
  return effect.stacks && effect.stacks > 0 ? effect.stacks : 1
}

function dotDamagePerStack(effect: IStatusEffect): number {
  if (typeof effect.damagePerTurn === 'number') return effect.damagePerTurn / dotStacks(effect)
  return 1
}

function dotTooltip(effect: IStatusEffect): string {
  const stacks = dotStacks(effect)
  const dps = dotDamagePerStack(effect)
  const turns = effect.turns
  return `${stacks} stack${stacks === 1 ? '' : 's'} · ${turns} turno${turns === 1 ? '' : 's'} restante${turns === 1 ? '' : 's'}\n${dps} de daño por stack/turno`
}

const hoveredDot = ref<string | null>(null)
const touchedDot = ref<string | null>(null)

function toggleDotTouch(type: string) {
  touchedDot.value = touchedDot.value === type ? null : type
}

function isDotTooltipVisible(type: string): boolean {
  return hoveredDot.value === type || touchedDot.value === type
}

function onDocClick(e: MouseEvent | TouchEvent) {
  if (!touchedDot.value) return
  const target = e.target as Node
  if (containerEl.value && !containerEl.value.contains(target)) {
    touchedDot.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<template>
  <div v-if="dotEffects.length > 0" ref="containerEl" class="hero-dot-icons">
    <div
      v-for="effect in dotEffects"
      :key="effect.type"
      class="hero-dot-icon"
      :class="['dot-' + effect.type, { 'tooltip-open': isDotTooltipVisible(effect.type) }]"
      @mouseenter="hoveredDot = effect.type"
      @mouseleave="hoveredDot === effect.type && (hoveredDot = null)"
      @click.stop="toggleDotTouch(effect.type)"
    >
      <img :src="DOT_ICONS[effect.type].icon" :alt="DOT_ICONS[effect.type].name" class="hero-dot-img" />
      <span class="hero-dot-stack">{{ dotStacks(effect) }}</span>
      <div v-if="isDotTooltipVisible(effect.type)" class="hero-dot-tooltip">
        <div class="hero-dot-tooltip-name">{{ DOT_ICONS[effect.type].name }}</div>
        <div class="hero-dot-tooltip-line">{{ dotTooltip(effect) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-dot-icons {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  gap: 4px;
  z-index: 7;
  pointer-events: none;
}

.hero-dot-icon {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(40, 20, 0, 0.95), rgba(0, 0, 0, 0.95));
  border: 1.5px solid rgba(255, 230, 102, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 230, 102, 0.35);
  pointer-events: auto;
  cursor: help;
  transition: transform 0.15s, box-shadow 0.15s;
}

.hero-dot-icon.dot-burn {
  border-color: #ff8a3a;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 138, 58, 0.6);
}

.hero-dot-icon.dot-poison {
  border-color: #b6f56b;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.8), 0 0 10px rgba(102, 187, 106, 0.6);
}

.hero-dot-icon.dot-freeze {
  border-color: #82b1ff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.8), 0 0 10px rgba(130, 177, 255, 0.6);
}

.hero-dot-icon:hover,
.hero-dot-icon.tooltip-open {
  transform: scale(1.15);
  z-index: 8;
}

.hero-dot-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.9));
  pointer-events: none;
}

.hero-dot-stack {
  position: absolute;
  top: -7px;
  right: -7px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: linear-gradient(180deg, #ffe066 0%, #ff8a00 100%);
  color: #1a1230;
  font-family: 'Courier New', monospace;
  font-size: 0.72rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #1a1230;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  line-height: 1;
}

.hero-dot-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 220px;
  background: linear-gradient(145deg, #1e2035 0%, #23243a 100%);
  border: 1.5px solid rgba(255, 230, 102, 0.55);
  border-radius: 8px;
  padding: 0.4rem 0.55rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
  z-index: 100;
  text-align: left;
  pointer-events: none;
  white-space: pre-line;
}

.hero-dot-tooltip::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: rgba(255, 230, 102, 0.55);
}

.hero-dot-tooltip-name {
  color: #ffe066;
  font-weight: 700;
  font-size: 0.78rem;
  margin-bottom: 0.15rem;
  text-shadow: 0 1px 2px #000;
}

.hero-dot-tooltip-line {
  color: #cfd8dc;
  font-family: 'Courier New', monospace;
  font-size: 0.68rem;
  line-height: 1.35;
  text-shadow: 1px 2px #000;
}
</style>
