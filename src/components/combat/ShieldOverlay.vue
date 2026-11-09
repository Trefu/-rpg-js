<script setup lang="ts">
import { computed } from 'vue'
import type { ICharacter } from '@/core/interfaces/ICharacter'
import { getShieldAmount, getShieldLayers } from '@/core/combat/shields'

const props = defineProps<{ character: ICharacter | null }>()
const amount = computed(() => getShieldAmount(props.character))
const layers = computed(() => getShieldLayers(amount.value, props.character?.maxHealth ?? 0))
</script>

<template>
  <span v-if="layers.length" class="shield-overlay"
    role="img" :aria-label="`Escudo: ${amount} de daño absorbible`" :title="`Escudo: ${amount} · cada capa equivale a ${character?.maxHealth} HP`">
    <span v-for="(layer, index) in layers" :key="index" class="shield-layer"
      :class="`shield-layer--${index}`" :style="{ width: `${layer.percent}%` }"
      :data-units="layer.units"><span v-if="layer.units > 1" class="shield-layer-count">×{{ layer.units }}</span></span>
  </span>
</template>

<style scoped>
.shield-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}
.shield-layer {
  display: block;
  position: relative;
  flex: 1;
  min-height: 0;
  background: #247de0;
  border-right: 1px solid #c5edff;
  box-sizing: border-box;
  transition: width .3s ease;
}
.shield-layer + .shield-layer { border-top: 1px solid #0b2948; }
.shield-layer--1 { background: #43c5ea; }
.shield-layer--2 { background: #8882ec; }
.shield-layer--3 { background: #ce91e4; }
.shield-layer-count { position: absolute; right: 2px; bottom: 0; color: #fff; font: bold 9px monospace; text-shadow: 1px 1px #000; }
@media (prefers-reduced-motion: reduce) { .shield-layer { transition: none; } }
</style>
