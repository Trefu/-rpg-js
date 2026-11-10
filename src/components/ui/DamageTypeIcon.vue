<script setup lang="ts">
import { computed } from 'vue'
import { damageTypePresentation } from './damageTypePresentation'

const props = defineProps<{ type?: string; attackName?: string }>()
const presentation = computed(() => damageTypePresentation(props.type, props.attackName))
</script>

<template>
  <img v-if="presentation" :src="presentation.icon" :alt="presentation.label" :title="presentation.label" class="damage-type-icon" width="20" height="20" />
</template>

<style scoped>
.damage-type-icon { display: inline-block; width: 20px; height: 20px; object-fit: contain; vertical-align: middle; flex-shrink: 0; image-rendering: pixelated; }
</style>
