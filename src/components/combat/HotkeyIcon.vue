<script setup lang="ts">
import { computed } from 'vue'
import { HOTKEY_ICONS } from './hotkeySources'
import '@/styles/combat-hotkeys.css'

const props = defineProps<{ value: string | number }>()
const label = computed(() => String(props.value).toUpperCase())
const source = computed(() => HOTKEY_ICONS[label.value])
</script>

<template>
  <kbd class="combat-hotkey" role="img" :aria-label="`Tecla ${label}`" :title="`Tecla ${label}`">
    <img v-if="source" :src="source" alt="" aria-hidden="true" width="64" height="64" draggable="false" />
    <span v-else>{{ label }}</span>
  </kbd>
</template>
