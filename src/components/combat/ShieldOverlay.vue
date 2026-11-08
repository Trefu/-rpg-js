<script setup lang="ts">
import { computed } from 'vue'
import type { ICharacter } from '@/core/interfaces/ICharacter'
import { getShieldAmount } from '@/core/combat/shields'

const props = defineProps<{ character: ICharacter | null }>()
const amount = computed(() => getShieldAmount(props.character))
const percent = computed(() => props.character && props.character.maxHealth > 0
  ? Math.min(100, amount.value / props.character.maxHealth * 100) : 0)
</script>

<template>
  <span v-if="amount > 0" class="shield-overlay" :style="{ width: `${percent}%` }"
    role="img" :aria-label="`Escudo: ${amount} de daño absorbible`" :title="`Escudo: ${amount}`" />
</template>

<style scoped>
.shield-overlay {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  background: repeating-linear-gradient(120deg, #8ddfff55 0 3px, transparent 3px 7px), linear-gradient(90deg, #176dd9, #55cfff);
  border-right: 1px solid #d4f5ff;
  box-shadow: inset 0 1px 2px #e4faffaa, 0 0 5px #47baff;
  box-sizing: border-box;
  pointer-events: none;
  transition: width .3s ease;
}
@media (prefers-reduced-motion: reduce) { .shield-overlay { transition: none; } }
</style>
