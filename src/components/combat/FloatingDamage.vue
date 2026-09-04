<script setup lang="ts">
import { computed, onMounted } from 'vue'

export type FloatingDamageVariant = 'damage' | 'crit' | 'blocked' | 'heal' | 'miss'

interface Props {
  value: number
  variant?: FloatingDamageVariant
  prefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'damage',
  prefix: '-'
})

const label = computed(() => `${props.prefix}${props.value}`)

onMounted(() => {
  // eslint-disable-next-line no-console
  console.log('[FloatingDamage] MOUNTED', { value: props.value, variant: props.variant, label: label.value })
})
</script>

<template>
  <div
    class="floating-damage"
    :class="`variant-${variant}`"
    aria-hidden="true"
  >{{ label }}</div>
</template>
