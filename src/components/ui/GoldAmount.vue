<script setup lang="ts">
withDefaults(defineProps<{
  amount: number | string
  iconSize?: number
}>(), {
  iconSize: 20
})
</script>

<template>
  <span class="gold-amount" :aria-label="`${amount} oro`">
    <img src="@/assets/icons/oro_32x32.png" alt="" :style="{ width: `${iconSize}px`, height: `${iconSize}px` }" />
    <span>{{ amount }}</span>
  </span>
</template>

<style scoped>
.gold-amount { display:inline-flex;align-items:center;gap:.3em;white-space:nowrap;font-variant-numeric:tabular-nums; }
.gold-amount img { flex:none;object-fit:contain;image-rendering:pixelated; }
</style>
